import { NextResponse } from "next/server";
import client from "@/lib/clickhouse";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeRange = parseInt(searchParams.get("timeRange") || "60", 10);
  const service = searchParams.get("service");

  try {
    let timeFilter = "";
    if (timeRange > 0) {
      timeFilter = `TimeUnix >= now() - INTERVAL ${timeRange} MINUTE`;
    }

    let serviceFilter = "";
    if (service) {
      serviceFilter = `ServiceName = '${service}'`;
    }

    let whereClause = "";
    if (timeFilter || serviceFilter) {
      whereClause =
        "WHERE " + [timeFilter, serviceFilter].filter(Boolean).join(" AND ");
    }

    const query = `
      SELECT
        ServiceName,
        MetricName,
        MetricUnit,
        avg(Sum) as AvgValue,
        max(Max) as MaxValue,
        min(Min) as MinValue,
        sum(Count) as TotalCount,
        toStartOfInterval(TimeUnix, INTERVAL 1 MINUTE) as Minute
      FROM otel_metrics_histogram
      ${whereClause}
      GROUP BY ServiceName, MetricName, MetricUnit, Minute
      ORDER BY Minute DESC
    `;

    const resultSet = await client.query({
      query,
      format: "JSONEachRow",
    });

    const metrics = await resultSet.json();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics data:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
