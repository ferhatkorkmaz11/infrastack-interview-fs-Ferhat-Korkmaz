import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, generateObject, generateText } from "ai";
import client from "@/lib/clickhouse";
import { z } from "zod";

export const maxDuration = 30;

const TABLE_DDLS = `
CREATE TABLE default.otel_traces
(
    \`Timestamp\` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
    \`TraceId\` String CODEC(ZSTD(1)),
    \`SpanId\` String CODEC(ZSTD(1)),
    \`ParentSpanId\` String CODEC(ZSTD(1)),
    \`TraceState\` String CODEC(ZSTD(1)),
    \`SpanName\` LowCardinality(String) CODEC(ZSTD(1)),
    \`SpanKind\` LowCardinality(String) CODEC(ZSTD(1)),
    \`ServiceName\` LowCardinality(String) CODEC(ZSTD(1)),
    \`ResourceAttributes\` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    \`ScopeName\` String CODEC(ZSTD(1)),
    \`ScopeVersion\` String CODEC(ZSTD(1)),
    \`SpanAttributes\` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    \`Duration\` Int64 CODEC(ZSTD(1)),
    \`Events.Timestamp\` Array(DateTime64(9)) CODEC(ZSTD(1)),
    \`Events.Name\` Array(LowCardinality(String)) CODEC(ZSTD(1)),
    \`Events.Attributes\` Array(Map(LowCardinality(String), String)) CODEC(ZSTD(1)),
    \`Links.TraceId\` Array(String) CODEC(ZSTD(1)),
    \`Links.SpanId\` Array(String) CODEC(ZSTD(1)),
    \`Links.TraceState\` Array(String) CODEC(ZSTD(1)),
    \`Links.Attributes\` Array(Map(LowCardinality(String), String)) CODEC(ZSTD(1)),
    INDEX idx_trace_id TraceId TYPE bloom_filter(0.001) GRANULARITY 1,
    INDEX idx_res_attr_key mapKeys(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_res_attr_value mapValues(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_span_attr_key mapKeys(SpanAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_span_attr_value mapValues(SpanAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_duration Duration TYPE minmax GRANULARITY 1
)
ENGINE = SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
PARTITION BY toDate(Timestamp)
ORDER BY (ServiceName, SpanName, toUnixTimestamp(Timestamp), TraceId)
SETTINGS index_granularity = 8192, ttl_only drop_parts = 1;

CREATE TABLE default.otel_metrics_histogram
(
    \`ResourceAttributes\` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    \`ResourceSchemaUrl\` String CODEC(ZSTD(1)),
    \`ScopeName\` String CODEC(ZSTD(1)),
    \`ScopeVersion\` String CODEC(ZSTD(1)),
    \`ScopeAttributes\` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    \`ScopeDroppedAttrCount\` UInt32 CODEC(ZSTD(1)),
    \`ScopeSchemaUrl\` String CODEC(ZSTD(1)),
    \`ServiceName\` LowCardinality(String) CODEC(ZSTD(1)),
    \`MetricName\` String CODEC(ZSTD(1)),
    \`MetricDescription\` String CODEC(ZSTD(1)),
    \`MetricUnit\` String CODEC(ZSTD(1)),
    \`Attributes\` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    \`StartTimeUnix\` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
    \`TimeUnix\` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
    \`Count\` UInt64 CODEC(Delta(8), ZSTD(1)),
    \`Sum\` Float64 CODEC(ZSTD(1)),
    \`BucketCounts\` Array(UInt64) CODEC(ZSTD(1)),
    \`ExplicitBounds\` Array(Float64) CODEC(ZSTD(1)),
    \`Exemplars.FilteredAttributes\` Array(Map(LowCardinality(String), String)) CODEC(ZSTD(1)),
    \`Exemplars.TimeUnix\` Array(DateTime64(9)) CODEC(ZSTD(1)),
    \`Exemplars.Value\` Array(Float64) CODEC(ZSTD(1)),
    \`Exemplars.SpanId\` Array(String) CODEC(ZSTD(1)),
    \`Exemplars.TraceId\` Array(String) CODEC(ZSTD(1)),
    \`Flags\` UInt32 CODEC(ZSTD(1)),
    \`Min\` Float64 CODEC(ZSTD(1)),
    \`Max\` Float64 CODEC(ZSTD(1)),
    \`AggregationTemporality\` Int32 CODEC(ZSTD(1)),
    INDEX idx_res_attr_key mapKeys(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_res_attr_value mapValues(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scope_attr_key mapKeys(ScopeAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scope_attr_value mapValues(ScopeAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_attr_key mapKeys(Attributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_attr_value mapValues(Attributes) TYPE bloom_filter(0.01) GRANULARITY 1
)
ENGINE = SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
PARTITION BY toDate(TimeUnix)
ORDER BY (ServiceName, MetricName, Attributes, toUnixTimestamp64Nano(TimeUnix))
SETTINGS index_granularity = 8192, ttl_only drop_parts = 1;

CREATE TABLE default.otel_logs
(
    \`Timestamp\` DateTime64(9) CODEC(Delta(8), ZSTD(1)),
    \`TimestampTime\` DateTime DEFAULT toDateTime(Timestamp),
    \`TraceId\` String CODEC(ZSTD(1)),
    \`SpanId\` String CODEC(ZSTD(1)),
    \`TraceFlags\` UInt8,
    \`SeverityText\` LowCardinality(String) CODEC(ZSTD(1)),
    \`SeverityNumber\` UInt8,
    \`ServiceName\` LowCardinality(String) CODEC(ZSTD(1)),
    \`Body\` String CODEC(ZSTD(1)),
    \`ResourceSchemaUrl\` LowCardinality(String) CODEC(ZSTD(1)),
    \`ResourceAttributes\` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    \`ScopeSchemaUrl\` LowCardinality(String) CODEC(ZSTD(1)),
    \`ScopeName\` String CODEC(ZSTD(1)),
    \`ScopeVersion\` LowCardinality(String) CODEC(ZSTD(1)),
    \`ScopeAttributes\` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    \`LogAttributes\` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    INDEX idx_trace_id TraceId TYPE bloom_filter(0.001) GRANULARITY 1,
    INDEX idx_res_attr_key mapKeys(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_res_attr_value mapValues(ResourceAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scope_attr_key mapKeys(ScopeAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scope_attr_value mapValues(ScopeAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_log_attr_key mapKeys(LogAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_log_attr_value mapValues(LogAttributes) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_body Body TYPE tokenbf_v1(32768, 3, 0) GRANULARITY 8
)
ENGINE = SharedMergeTree('/clickhouse/tables/{uuid}/{shard}', '{replica}')
PARTITION BY toDate(TimestampTime)
PRIMARY KEY (ServiceName, TimestampTime)
ORDER BY (ServiceName, TimestampTime, Timestamp)
SETTINGS index_granularity = 8192, ttl_only drop_parts = 1;
`;

const schema = z.object({
  queryNeeded: z.boolean(),
  text: z.string(),
});

async function executeQuery(query: string) {
  const resultSet = await client.query({
    query,
    format: "JSONEachRow",
  });
  return await resultSet.json();
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const availableServiceNames = await executeQuery(
    "SELECT DISTINCT ServiceName FROM otel_traces"
  );
  const initialPrompt = `
      You are an AI assistant for a microservices dashboard. You will chat with the user and help them with their questions.
      You will determine if you need to execute a query based on the user's question. If you need to execute a query, 
      you will generate a valid SQL query based on the user's question and the provided table schemas and just provide the query nothing else.
      If you need to execute a query, use the following table DDLs to create and evaluate queries:
      ${TABLE_DDLS}
      If you need to execute a query, you should infer the service name from the user's question. 
      Do not exceed the limit of 40 rows for logs and traces.
      Do not exceed the limit of 20 rows for metrics.
      Available service names for user: ${JSON.stringify(availableServiceNames)}
      User messages: ${JSON.stringify(messages)}
    `;

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: schema,
    prompt: initialPrompt,
  });

  const queryNeeded = object.queryNeeded;
  const responseText = object.text;

  if (queryNeeded) {
    try {
      console.log("Query:", responseText);
      const queryResult = await executeQuery(responseText);

      const secondPrompt = `
          You are an AI assistant for a microservices dashboard. Use the following query result to answer the user's question. But do not give the query result directly.
          Query result: ${JSON.stringify(queryResult)}
          User messages: ${JSON.stringify(messages)}
        `;
      const aiAnswer = await generateText({
        model: openai("gpt-4o"),
        messages: convertToCoreMessages([
          { role: "system", content: secondPrompt },
          ...messages,
        ]),
      });

      return new Response(aiAnswer.text, {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      console.error("Query execution error:", error);
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  }

  return new Response(responseText, {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
