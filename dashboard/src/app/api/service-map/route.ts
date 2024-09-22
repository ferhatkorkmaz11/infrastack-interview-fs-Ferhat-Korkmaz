import { NextResponse } from "next/server";
import client from "@/lib/clickhouse";

interface ServiceInteraction {
  source: string;
  target: string;
  count: number;
  avgLatency: number;
}

interface ServiceMapResponse {
  interactions: ServiceInteraction[];
  isolatedServices: string[];
}

interface RawInteraction {
  source: string;
  target: string;
  count: string;
  avgLatency: string;
  errorRate: string;
}

interface ServiceData {
  ServiceName: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRange = parseInt(searchParams.get("timeRange") || "10", 10);

  try {
    let timeFilter = "";
    if (timeRange > 0) {
      timeFilter = `AND Timestamp >= now() - INTERVAL ${timeRange} MINUTE`;
    }

    const query = `
      SELECT 
        source.ServiceName as source,
        target.ServiceName as target,
        count(*) as count,
        avg(source.Duration / 1000000) as avgLatency,
        countIf(source.SpanAttributes['http.status_code'] >= '400' AND source.SpanAttributes['http.status_code'] < '600') / count(*) as errorRate
      FROM otel_traces as source
      JOIN otel_traces as target ON source.TraceId = target.TraceId AND source.SpanId = target.ParentSpanId
      WHERE source.SpanKind = 'Client' 
        AND source.ServiceName != target.ServiceName
        ${timeFilter}
      GROUP BY source.ServiceName, target.ServiceName
    `;

    const interactionsResult = await client.query({
      query,
      format: "JSONEachRow",
    });

    const rawInteractions =
      (await interactionsResult.json()) as RawInteraction[];

    const serviceInteractions: ServiceInteraction[] = rawInteractions.map(
      (item: RawInteraction) => ({
        source: item.source,
        target: item.target,
        count: parseInt(item.count, 10),
        avgLatency: parseFloat(item.avgLatency),
        errorRate: parseFloat(item.errorRate),
      })
    );

    const allServicesQuery = `
      SELECT DISTINCT ServiceName
      FROM otel_traces
      WHERE 1=1 ${timeFilter}
    `;

    const allServicesResult = await client.query({
      query: allServicesQuery,
      format: "JSONEachRow",
    });

    const allServicesData = (await allServicesResult.json()) as ServiceData[];
    const allServices = allServicesData.map(
      (item: ServiceData) => item.ServiceName
    );

    const servicesWithInteractions = new Set([
      ...serviceInteractions.map((i) => i.source),
      ...serviceInteractions.map((i) => i.target),
    ]);

    const isolatedServices = allServices.filter(
      (service) => !servicesWithInteractions.has(service)
    );

    const response: ServiceMapResponse = {
      interactions: serviceInteractions,
      isolatedServices: isolatedServices,
    };
    console.log(response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching service map data:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
