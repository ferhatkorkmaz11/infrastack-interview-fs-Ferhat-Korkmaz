import { NextResponse } from "next/server";
import { createClient } from "@clickhouse/client";

interface RawServiceInteraction {
  source: string;
  url: string;
  count: string;
  avgLatency: string;
  errorRate: string;
}

interface ServiceInteraction {
  source: string;
  target: string;
  count: number;
  avgLatency: number;
  errorRate: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRange = parseInt(searchParams.get("timeRange") || "10", 10);

  try {
    const client = createClient({
      host: process.env.CLICKHOUSE_HOST,
      username: process.env.CLICKHOUSE_USER,
      password: process.env.CLICKHOUSE_PASSWORD,
      database: process.env.CLICKHOUSE_DATABASE,
    });

    let timeFilter = "";
    if (timeRange > 0) {
      timeFilter = `AND Timestamp >= now() - INTERVAL ${timeRange} MINUTE`;
    }

    const query = `
      SELECT 
        ServiceName as source,
        SpanAttributes['http.url'] as url,
        count(*) as count,
        avg(Duration / 1000000) as avgLatency,
        countIf(StatusCode = 'ERROR') / count(*) as errorRate
      FROM otel_traces
      WHERE SpanKind = 'Client' 
        AND SpanAttributes['http.url'] != ''
        ${timeFilter}
      GROUP BY ServiceName, SpanAttributes['http.url']
    `;

    const resultSet = await client.query({
      query,
      format: "JSONEachRow",
    });

    const rawData: RawServiceInteraction[] = await resultSet.json();

    const serviceInteractions = rawData
      .map((item: RawServiceInteraction) => ({
        source: item.source,
        target: item.url.includes("microservice-user")
          ? "user-service"
          : item.url.includes("microservice-order")
          ? "order-service"
          : item.url.includes("microservice-payment")
          ? "payment-service"
          : "unknown",
        count: parseInt(item.count, 10),
        avgLatency: parseFloat(item.avgLatency),
        errorRate: parseFloat(item.errorRate),
      }))
      .filter((item: ServiceInteraction) => item.target !== "unknown");

    const combinedInteractions = serviceInteractions.reduce(
      (acc: ServiceInteraction[], curr: ServiceInteraction) => {
        const existingInteraction = acc.find(
          (item) => item.source === curr.source && item.target === curr.target
        );

        if (existingInteraction) {
          existingInteraction.count += curr.count;
          existingInteraction.avgLatency =
            (existingInteraction.avgLatency * existingInteraction.count +
              curr.avgLatency * curr.count) /
            (existingInteraction.count + curr.count);
          existingInteraction.errorRate =
            (existingInteraction.errorRate * existingInteraction.count +
              curr.errorRate * curr.count) /
            (existingInteraction.count + curr.count);
        } else {
          acc.push(curr);
        }

        return acc;
      },
      []
    );

    return NextResponse.json(combinedInteractions);
  } catch (error) {
    console.error("Error fetching service map data:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
