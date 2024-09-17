import { NodeSDK, resources } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { CompressionAlgorithm } from "@opentelemetry/otlp-exporter-base";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { randomUUID } from "crypto";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  metrics,
} from "@opentelemetry/api";

const ATTR_SERVICE_INSTANCE_ID = "service.instance.id";

interface RegisterOptions {
  endpoint: string;
  instruments: string[];
}

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ALL);

let loggerProvider: LoggerProvider | undefined;
const serviceName = process.env.SERVICE_NAME ?? randomUUID();
const serviceInstanceId = process.env.POD_NAME ?? randomUUID();
const SERVICE_NAME_INSTANCE_ID_KEY = `${serviceName}#${serviceInstanceId}`;

export const log = {
  info: (message: string) => {
    if (loggerProvider) {
      loggerProvider.getLogger(SERVICE_NAME_INSTANCE_ID_KEY).emit({
        body: message,
        severityText: "INFO",
        severityNumber: 9,
      });
    } else {
      console.error("LoggerProvider is not initialized.");
    }
  },
  warn: (message: string) => {
    if (loggerProvider) {
      loggerProvider.getLogger(SERVICE_NAME_INSTANCE_ID_KEY).emit({
        body: message,
        severityText: "WARN",
        severityNumber: 13,
      });
    } else {
      console.error("LoggerProvider is not initialized.");
    }
  },
  error: (message: string) => {
    if (loggerProvider) {
      loggerProvider.getLogger(SERVICE_NAME_INSTANCE_ID_KEY).emit({
        body: message,
        severityText: "ERROR",
        severityNumber: 17,
      });
    } else {
      console.error("LoggerProvider is not initialized.");
    }
  },
  debug: (message: string) => {
    if (loggerProvider) {
      loggerProvider.getLogger(SERVICE_NAME_INSTANCE_ID_KEY).emit({
        body: message,
        severityText: "DEBUG",
        severityNumber: 5,
      });
    } else {
      console.error("LoggerProvider is not initialized.");
    }
  },
};

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

export async function register({
  endpoint,
  instruments,
}: RegisterOptions): Promise<void> {
  try {
    let isEndpointValid: boolean = validateUrl(endpoint);

    if (!isEndpointValid) {
      console.error("Invalid endpoint URL. Please provide a valid URL.");
      return;
    }

    const exporterOptions = {
      url: endpoint,
      compression: CompressionAlgorithm.GZIP,
    };

    const traceExporter = new OTLPTraceExporter(exporterOptions);
    const logExporter = new OTLPLogExporter(exporterOptions);
    const metricExporter = new OTLPMetricExporter(exporterOptions);

    const selectedInstrumentations: any[] = [];

    for (const instrument of instruments) {
      switch (instrument) {
        case "amqplib":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-amqplib")
            ).AmqplibInstrumentation()
          );
          break;
        case "aws-lambda":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-aws-lambda")
            ).AwsLambdaInstrumentation()
          );
          break;
        case "aws-sdk":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-aws-sdk")
            ).AwsInstrumentation()
          );
          break;
        case "bunyan":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-bunyan")
            ).BunyanInstrumentation()
          );
          break;
        case "cassandra-driver":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-cassandra-driver")
            ).CassandraDriverInstrumentation()
          );
          break;
        case "connect":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-connect")
            ).ConnectInstrumentation()
          );
          break;
        case "cucumber":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-cucumber")
            ).CucumberInstrumentation()
          );
          break;
        case "dataloader":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-dataloader")
            ).DataloaderInstrumentation()
          );
          break;
        case "dns":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-dns")
            ).DnsInstrumentation()
          );
          break;
        case "express":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-express")
            ).ExpressInstrumentation()
          );
          break;
        case "fastify":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-fastify")
            ).FastifyInstrumentation()
          );
          break;
        case "generic-pool":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-generic-pool")
            ).GenericPoolInstrumentation()
          );
          break;
        case "graphql":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-graphql")
            ).GraphQLInstrumentation()
          );
          break;
        case "grpc":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-grpc")
            ).GrpcInstrumentation()
          );
          break;
        case "hapi":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-hapi")
            ).HapiInstrumentation()
          );
          break;
        case "http":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-http")
            ).HttpInstrumentation()
          );
          break;
        case "ioredis":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-ioredis")
            ).IORedisInstrumentation()
          );
          break;
        case "kafkajs":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-kafkajs")
            ).KafkaJsInstrumentation()
          );
          break;
        case "knex":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-knex")
            ).KnexInstrumentation()
          );
          break;
        case "koa":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-koa")
            ).KoaInstrumentation()
          );
          break;
        case "lru-memoizer":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-lru-memoizer")
            ).LruMemoizerInstrumentation()
          );
          break;
        case "memcached":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-memcached")
            ).MemcachedInstrumentation()
          );
          break;
        case "mongodb":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-mongodb")
            ).MongoDBInstrumentation()
          );
          break;
        case "mongoose":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-mongoose")
            ).MongooseInstrumentation()
          );
          break;
        case "mysql":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-mysql")
            ).MySQLInstrumentation()
          );
          break;
        case "mysql2":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-mysql2")
            ).MySQL2Instrumentation()
          );
          break;
        case "nestjs-core":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-nestjs-core")
            ).NestInstrumentation()
          );
          break;
        case "net":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-net")
            ).NetInstrumentation()
          );
          break;
        case "pg":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-pg")
            ).PgInstrumentation()
          );
          break;
        case "pino":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-pino")
            ).PinoInstrumentation()
          );
          break;
        case "redis":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-redis")
            ).RedisInstrumentation()
          );
          break;
        case "restify":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-restify")
            ).RestifyInstrumentation()
          );
          break;
        case "socket.io":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-socket.io")
            ).SocketIoInstrumentation()
          );
          break;
        case "undici":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-undici")
            ).UndiciInstrumentation()
          );
          break;
        case "winston":
          selectedInstrumentations.push(
            new (
              await import("@opentelemetry/instrumentation-winston")
            ).WinstonInstrumentation()
          );
          break;
        default:
          console.warn(
            `Unsupported instrumentation: ${instrument}. Skipping...`
          );
          break;
      }
    }

    const resource = new resources.Resource({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: "1.0.0",
      [ATTR_SERVICE_INSTANCE_ID]: serviceInstanceId,
    });

    loggerProvider = new LoggerProvider();
    loggerProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(logExporter)
    );

    if (process.env.METRICS_ENABLED === "true") {
      console.log("Metrics enabled");
      const metricProvider = new MeterProvider({
        resource: resource,
        readers: [
          new PeriodicExportingMetricReader({
            exporter: metricExporter,
            exportIntervalMillis: 1000,
          }),
        ],
      });
      metrics.setGlobalMeterProvider(metricProvider);
    }

    const sdk: NodeSDK = new NodeSDK({
      traceExporter: traceExporter,
      instrumentations: selectedInstrumentations,
      resource: resource,
    });

    sdk.start();

    process.on("SIGTERM", () => {
      Promise.all([sdk.shutdown(), loggerProvider!.shutdown()])
        .then(() => console.log("infrastack-interview-fs-fk-20240916 stopped"))
        .catch((error) =>
          console.error(
            "Error shutting down infrastack-interview-fs-fk-20240916",
            error
          )
        )
        .finally(() => process.exit(0));
    });
  } catch (error) {
    console.error(
      "Error setting up infrastack-interview-fs-fk-20240916:",
      error
    );
  }
}
