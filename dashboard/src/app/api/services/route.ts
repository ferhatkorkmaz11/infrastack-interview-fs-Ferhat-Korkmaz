import { NextResponse } from "next/server";
import { createClient } from "@clickhouse/client";

export async function GET() {
  try {
    const client = createClient({
      host: process.env.CLICKHOUSE_HOST,
      username: process.env.CLICKHOUSE_USER,
      password: process.env.CLICKHOUSE_PASSWORD,
      database: process.env.CLICKHOUSE_DATABASE,
    });

    const query = `
      SELECT 
        ServiceName as name,
        count(*) as requestCount,
        avg(Duration / 1000000) as avgLatency,
        countIf(StatusCode = 'ERROR') / count(*) as errorRate
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
