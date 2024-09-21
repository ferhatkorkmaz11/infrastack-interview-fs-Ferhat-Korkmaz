import { NextResponse } from "next/server";
import client from "@/lib/clickhouse";
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const traceId = params.id;

  try {
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
