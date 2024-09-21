import { NextResponse } from "next/server";
import client from "@/lib/clickhouse";

export async function GET() {
  try {
    const query = `
      SELECT 
        ServiceName as name,
        count(*) as requestCount,
        avg(Duration / 1000000) as avgLatency,
        countIf(SpanAttributes['http.status_code'] >= '400' AND SpanAttributes['http.status_code'] < '600') / count(*) as errorRate
      FROM otel_traces
      GROUP BY ServiceName
    `;

    const resultSet = await client.query({
      query,
      format: "JSONEachRow",
    });

    const services = await resultSet.json();
    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services data:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
