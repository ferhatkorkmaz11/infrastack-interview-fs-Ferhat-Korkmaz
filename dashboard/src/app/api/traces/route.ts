import { NextResponse } from "next/server";
import clickhouseClient from "@/lib/clickhouse";

interface CountResult {
  total: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const searchTerm = searchParams.get("search") || "";
  const spanKind = searchParams.get("spanKind") || "";
  const spanName = searchParams.get("spanName") || "";
  const statusCode = searchParams.get("statusCode") || "";
  const sortOrder = searchParams.get("sortOrder") || "DESC";

  try {
    let query = `
      SELECT 
        Timestamp,
        TraceId,
        SpanId,
        SpanName,
        SpanKind,
        ServiceName,
        Duration / 1000000 as Duration,
        SpanAttributes,
        ResourceAttributes,
        SpanAttributes['http.status_code'] as HttpStatusCode
      FROM otel_traces
      WHERE 1=1
    `;

    const conditions = [];
    if (service) {
      conditions.push(`ServiceName = '${service}'`);
    }
    if (searchTerm) {
      conditions.push(`(
        SpanName ILIKE '%${searchTerm}%'
        OR TraceId ILIKE '%${searchTerm}%'
        OR SpanId ILIKE '%${searchTerm}%'
        OR toString(SpanAttributes) ILIKE '%${searchTerm}%'
        OR toString(ResourceAttributes) ILIKE '%${searchTerm}%'
      )`);
    }
    if (spanKind) {
      conditions.push(`SpanKind = '${spanKind}'`);
    }
    if (spanName) {
      conditions.push(`SpanName = '${spanName}'`);
    }
    if (statusCode) {
      conditions.push(`SpanAttributes['http.status_code'] = '${statusCode}'`);
    }

    if (conditions.length > 0) {
      query += ` AND ${conditions.join(" AND ")}`;
    }

    const countQuery = `SELECT count(*) as total FROM (${query})`;
    const countResultSet = await clickhouseClient.query({
      query: countQuery,
      format: "JSONEachRow",
    });
    const countData = (await countResultSet.json()) as CountResult[];
    const totalCount = countData[0].total;

    query += ` ORDER BY Timestamp ${sortOrder}`;
    query += ` LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`;

    const tracesResultSet = await clickhouseClient.query({
      query,
      format: "JSONEachRow",
    });

    const traces = await tracesResultSet.json();

    const servicesQuery = `
      SELECT DISTINCT ServiceName
      FROM otel_traces
    `;
    const servicesResultSet = await clickhouseClient.query({
      query: servicesQuery,
      format: "JSONEachRow",
    });
    const servicesData = (await servicesResultSet.json()) as {
      ServiceName: string;
    }[];
    const uniqueServices = servicesData.map((item) => item.ServiceName);

    const metadataQuery = `
      SELECT DISTINCT
        SpanKind,
        SpanName,
        SpanAttributes['http.status_code'] as HttpStatusCode
      FROM otel_traces
      ${service ? `WHERE ServiceName = '${service}'` : ""}
    `;
    const metadataResultSet = await clickhouseClient.query({
      query: metadataQuery,
      format: "JSONEachRow",
    });
    const metadataData = (await metadataResultSet.json()) as {
      SpanKind: string;
      SpanName: string;
      HttpStatusCode: string;
    }[];

    const uniqueSpanKinds = Array.from(
      new Set(metadataData.map((item) => item.SpanKind))
    );
    const uniqueSpanNames = Array.from(
      new Set(metadataData.map((item) => item.SpanName))
    );
    const uniqueHttpStatusCodes = Array.from(
      new Set(metadataData.map((item) => item.HttpStatusCode).filter(Boolean))
    );

    return NextResponse.json({
      traces,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      metadata: {
        uniqueServices,
        uniqueSpanKinds,
        uniqueSpanNames,
        uniqueHttpStatusCodes,
      },
    });
  } catch (error) {
    console.error("Error fetching traces:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
