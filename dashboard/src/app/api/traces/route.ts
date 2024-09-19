import { NextResponse } from "next/server";
import { createClient } from "@clickhouse/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  try {
    const client = createClient({
      host: process.env.CLICKHOUSE_HOST,
      username: process.env.CLICKHOUSE_USER,
      password: process.env.CLICKHOUSE_PASSWORD,
      database: process.env.CLICKHOUSE_DATABASE,
    });

    let query = `
      SELECT 
        Timestamp,
        TraceId,
        SpanId,
        SpanName,
        ServiceName,
        Duration / 1000000 as Duration
      FROM otel_traces
    `;

    if (service) {
      query += ` WHERE ServiceName = '${service}'`;
    }

    query += ` ORDER BY Timestamp DESC LIMIT ${pageSize} OFFSET ${offset}`;

    const resultSet = await client.query({
      query,
      format: "JSONEachRow",
    });

    const traces = await resultSet.json();
    return NextResponse.json(traces);
  } catch (error) {
    console.error("Error fetching traces:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
