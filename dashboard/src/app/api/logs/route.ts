import { NextResponse } from "next/server";
import client from "@/lib/clickhouse";
const SEVERITY_OPTIONS = ["ERROR", "WARN", "INFO", "DEBUG"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const searchTerm = searchParams.get("search") || "";
  const severity = searchParams.get("severity") || "";
  const sortOrder = searchParams.get("sortOrder") || "DESC";

  try {
    let query = `
      SELECT 
        Timestamp,
        TraceId,
        SpanId,
        TraceFlags,
        SeverityText,
        SeverityNumber,
        Body,
        ResourceAttributes,
        LogAttributes
      FROM otel_logs
      WHERE 1=1
    `;

    const conditions = [];
    if (service) {
      conditions.push(`ServiceName = '${service}'`);
    }
    if (searchTerm) {
      conditions.push(`(
        Body ILIKE '%${searchTerm}%'
        OR TraceId ILIKE '%${searchTerm}%'
        OR SpanId ILIKE '%${searchTerm}%'
        OR toString(LogAttributes) ILIKE '%${searchTerm}%'
        OR toString(ResourceAttributes) ILIKE '%${searchTerm}%'
      )`);
    }
    if (severity) {
      conditions.push(`SeverityText = '${severity}'`);
    }

    if (conditions.length > 0) {
      query += " AND " + conditions.join(" AND ");
    }

    query += `
      ORDER BY Timestamp ${sortOrder}
      LIMIT ${pageSize}
      OFFSET ${(page - 1) * pageSize}
    `;

    const countQuery = `
      SELECT count(*) as total
      FROM otel_logs
      WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "1=1"}
    `;

    const uniqueServicesQuery = `
      SELECT DISTINCT ResourceAttributes['service.name'] as service_name
      FROM otel_logs
      WHERE ResourceAttributes['service.name'] != ''
    `;

    const [logsResult, countResult, uniqueServicesResult] = await Promise.all([
      client.query({
        query,
        format: "JSONEachRow",
      }),
      client.query({
        query: countQuery,
        format: "JSONEachRow",
      }),
      client.query({
        query: uniqueServicesQuery,
        format: "JSONEachRow",
      }),
    ]);

    const logs = await logsResult.json();
    const totalCount = ((await countResult.json()) as [{ total: number }])[0]
      .total;
    const uniqueServices = (
      (await uniqueServicesResult.json()) as { service_name: string }[]
    ).map((row) => row.service_name);

    return NextResponse.json({
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        totalItems: totalCount,
      },
      metadata: {
        uniqueServices,
        uniqueSeverities: SEVERITY_OPTIONS,
      },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
