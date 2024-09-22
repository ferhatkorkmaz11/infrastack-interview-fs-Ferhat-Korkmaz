import { configDotenv } from "dotenv";
configDotenv();
import { Express } from "express";
import {
  register,
  log,
} from "@ferhatkorkmaz11/infrastack-interview-fs-fk-20240916";

import { ClickHouseClient, createClient } from "@clickhouse/client";

const client = createClient({
  url: process.env.CLICKHOUSE_ENDPOINT_HTTP,
  username: process.env.CLICKHOUSE_USERNAME,
  password: process.env.CLICKHOUSE_PASSWORD,
});
const SERVICE_NAME = process.env.SERVICE_NAME ?? "VALIDATOR";

let logsExported = false;
let metricsExported = false;
let tracesExported = false;

async function startServer() {
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4317";
  await register({
    endpoint: endpoint,
    instruments: ["express", "http"],
  });

  const app: Express = require("express")();

  app.get("/:mode?", async (req, res) => {
    try {
      const mode = req.params.mode;
      if (mode === "self") {
        log.info(`Received self mode request. Calling itself recursively...`);
        const response = await fetch("http://localhost:8083/");
        const data = await response.text();
        log.info(`Response from self: ${response.status} - ${data}`);
        res.send(`Self call result: ${data}`);
      } else {
        log.info(`Received request from host: ${req.headers.host}`);
        res.json({ message: "Hello World from validation!", mode });
      }
    } catch (error) {
      log.error(`Error in recursive call: ${error}`);
      res.status(500).send("Internal Server Error");
    }
  });

  app.listen(8083, async () => {
    log.info("Test service is running on port 8083");

    try {
      log.info("Making initial call to /self");
      const response = await fetch("http://localhost:8083/self");
      const data = await response.text();
      log.info(`Initial call to /self: ${response.status} - ${data}`);

      const checkExports = async (attempt = 1) => {
        const logCount = await getLogCount(client, SERVICE_NAME);
        const metricCount = await getMetricCount(client, SERVICE_NAME);
        const traceCount = await getTraceCount(client, SERVICE_NAME);

        if (logCount >= 5) logsExported = true;
        if (metricCount >= 2) metricsExported = true;
        if (traceCount >= 1) tracesExported = true;

        if (logsExported && metricsExported && tracesExported) {
          log.info("All data exported successfully!");
          process.exit(0);
        } else if (attempt < 5) {
          const nextDelay = Math.pow(2, attempt) * 1000;
          log.info(
            `Attempt ${attempt} failed. Retrying in ${
              nextDelay / 1000
            } seconds...`
          );
          setTimeout(() => checkExports(attempt + 1), nextDelay);
        } else {
          log.error("Data export failed after 5 attempts!");
          process.exit(1);
        }
      };

      checkExports();
    } catch (error) {
      log.error(`Error making initial call to /self: ${error}`);
    }
  });
}
async function getLogCount(
  client: ClickHouseClient,
  serviceName: string
): Promise<number> {
  try {
    const query = `
          SELECT count(*) AS log_count 
          FROM otel_logs 
          WHERE ServiceName = '${serviceName}' 
          AND Timestamp >= now() - INTERVAL 1 MINUTE
        `;
    const resultSet = await client.query({
      query: query,
      format: "JSONEachRow",
    });

    const result = (await resultSet.json()) as Array<{ log_count: number }>;

    if (result.length > 0 && "log_count" in result[0]) {
      const logCount = result[0].log_count;
      return logCount;
    } else {
      return 0;
    }
  } catch (error) {
    log.error(`Error fetching log count from ClickHouse: ${error}`);
    throw error;
  }
}
async function getMetricCount(
  client: ClickHouseClient,
  serviceName: string
): Promise<number> {
  try {
    const query = `
            SELECT count(*) AS metric_count 
            FROM otel_metrics_histogram 
            WHERE ServiceName = '${serviceName}' 
            AND TimeUnix >= now() - INTERVAL 1 MINUTE
            `;
    const resultSet = await client.query({
      query: query,
      format: "JSONEachRow",
    });

    const result = (await resultSet.json()) as Array<{ metric_count: number }>;

    if (result.length > 0 && "metric_count" in result[0]) {
      const metricCount = result[0].metric_count;
      return metricCount;
    } else {
      return 0;
    }
  } catch (error) {
    log.error(`Error fetching metric count from ClickHouse: ${error}`);
    throw error;
  }
}

async function getTraceCount(
  client: ClickHouseClient,
  serviceName: string
): Promise<number> {
  try {
    const query = `
                SELECT count(*) AS trace_count 
                FROM otel_traces 
                WHERE ServiceName = '${serviceName}' 
                AND Timestamp >= now() - INTERVAL 1 MINUTE
                `;
    const resultSet = await client.query({
      query: query,
      format: "JSONEachRow",
    });

    const result = (await resultSet.json()) as Array<{ trace_count: number }>;

    if (result.length > 0 && "trace_count" in result[0]) {
      const traceCount = result[0].trace_count;
      return traceCount;
    } else {
      return 0;
    }
  } catch (error) {
    log.error(`Error fetching trace count from ClickHouse: ${error}`);
    throw error;
  }
}

startServer();
