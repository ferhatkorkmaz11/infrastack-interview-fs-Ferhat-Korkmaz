import { NextResponse } from "next/server";
import { createClient } from "@clickhouse/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const traceId = params.id;

  try {
    const client = createClient({
      host: process.env.CLICKHOUSE_HOST,
      username: process.env.CLICKHOUSE_USER,
      password: process.env.CLICKHOUSE_PASSWORD,
      database: process.env.CLICKHOUSE_DATABASE,
    });

    const query = `
      SELECT 
        Timestamp,
        TraceId,
        SpanId,
        ParentSpanId,
        SpanName,
        ServiceName,
        Duration / 1000000 as Duration,
        SpanAttributes,
        ResourceAttributes
      FROM otel_traces
      WHERE TraceId = '${traceId}'
      ORDER BY Timestamp
    `;

    const resultSet = await client.query({
      query,
      format: "JSONEachRow",
    });

    const trace = await resultSet.json();
    return NextResponse.json(trace);
  } catch (error) {
    console.error("Error fetching trace details:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
