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
const INFO_SEVERITY_TEXT = "INFO";
const WARN_SEVERITY_TEXT = "WARN";
const ERROR_SEVERITY_TEXT = "ERROR";
const DEBUG_SEVERITY_TEXT = "DEBUG";
const INFO_SEVERITY_NUMBER = 9;
const WARN_SEVERITY_NUMBER = 13;
const ERROR_SEVERITY_NUMBER = 17;
const DEBUG_SEVERITY_NUMBER = 5;

export const log = {
  info: createLogger(INFO_SEVERITY_TEXT, INFO_SEVERITY_NUMBER),
  warn: createLogger(WARN_SEVERITY_TEXT, WARN_SEVERITY_NUMBER),
  error: createLogger(ERROR_SEVERITY_TEXT, ERROR_SEVERITY_NUMBER),
  debug: createLogger(DEBUG_SEVERITY_TEXT, DEBUG_SEVERITY_NUMBER),
};

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.NONE);

let loggerProvider: LoggerProvider | undefined;

interface RegisterOptions {
  endpoint: string;
  instruments: string[];
}

const serviceName = process.env.SERVICE_NAME ?? randomUUID();
const serviceInstanceId = process.env.POD_NAME ?? randomUUID();
const SERVICE_NAME_INSTANCE_ID_KEY = `${serviceName}#${serviceInstanceId}`;

export async function register({
  endpoint,
  instruments,
}: RegisterOptions): Promise<void> {
  try {
    if (!validateUrl(endpoint)) {
      throw new Error("Invalid endpoint URL. Please provide a valid URL.");
    }
    if (!(endpoint.startsWith("http://") || endpoint.startsWith("https://"))) {
      endpoint = `http://${endpoint}`;
    }

    const exporterOptions = getExporterOptions(endpoint);

    const traceExporter = new OTLPTraceExporter(exporterOptions);
    const logExporter = new OTLPLogExporter(exporterOptions);
    const metricExporter = new OTLPMetricExporter(exporterOptions);

    const selectedInstrumentations = await getSelectedInstrumentations(
      instruments
    );

    const resource = await initializeResource();

    initializeLoggerProvider(logExporter, resource);
    initializeMetricProvider(metricExporter, resource);

    startSDK(traceExporter, selectedInstrumentations, resource);
    console.log(
      `SDK initialized successfully with the following:\nService name: ${serviceName}\nService instanceId: ${serviceInstanceId}`
    );
  } catch (error) {
    console.error("Error setting up SDK:", error);
  }
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getExporterOptions(endpoint: string) {
  return {
    url: endpoint,
    compression: CompressionAlgorithm.GZIP,
  };
}

async function getSelectedInstrumentations(
  instruments: string[]
): Promise<any[]> {
  const selectedInstrumentations: any[] = [];

  for (const instrument of instruments) {
    try {
      const instrumentation = await getInstrumentation(instrument);
      if (instrumentation) {
        selectedInstrumentations.push(instrumentation);
      }
    } catch (error) {
      console.warn(`Error loading instrumentation: ${instrument}`, error);
    }
  }

  return selectedInstrumentations;
}

async function getInstrumentation(instrument: string) {
  switch (instrument) {
    case "amqplib":
      return new (
        await import("@opentelemetry/instrumentation-amqplib")
      ).AmqplibInstrumentation();
    case "aws-lambda":
      return new (
        await import("@opentelemetry/instrumentation-aws-lambda")
      ).AwsLambdaInstrumentation();
    case "aws-sdk":
      return new (
        await import("@opentelemetry/instrumentation-aws-sdk")
      ).AwsInstrumentation();
    case "bunyan":
      return new (
        await import("@opentelemetry/instrumentation-bunyan")
      ).BunyanInstrumentation();
    case "cassandra-driver":
      return new (
        await import("@opentelemetry/instrumentation-cassandra-driver")
      ).CassandraDriverInstrumentation();
    case "connect":
      return new (
        await import("@opentelemetry/instrumentation-connect")
      ).ConnectInstrumentation();
    case "cucumber":
      return new (
        await import("@opentelemetry/instrumentation-cucumber")
      ).CucumberInstrumentation();
    case "dataloader":
      return new (
        await import("@opentelemetry/instrumentation-dataloader")
      ).DataloaderInstrumentation();
    case "dns":
      return new (
        await import("@opentelemetry/instrumentation-dns")
      ).DnsInstrumentation();
    case "express":
      return new (
        await import("@opentelemetry/instrumentation-express")
      ).ExpressInstrumentation();
    case "fastify":
      return new (
        await import("@opentelemetry/instrumentation-fastify")
      ).FastifyInstrumentation();
    case "generic-pool":
      return new (
        await import("@opentelemetry/instrumentation-generic-pool")
      ).GenericPoolInstrumentation();
    case "graphql":
      return new (
        await import("@opentelemetry/instrumentation-graphql")
      ).GraphQLInstrumentation();
    case "grpc":
      return new (
        await import("@opentelemetry/instrumentation-grpc")
      ).GrpcInstrumentation();
    case "hapi":
      return new (
        await import("@opentelemetry/instrumentation-hapi")
      ).HapiInstrumentation();
    case "http":
      return new (
        await import("@opentelemetry/instrumentation-http")
      ).HttpInstrumentation();
    case "ioredis":
      return new (
        await import("@opentelemetry/instrumentation-ioredis")
      ).IORedisInstrumentation();
    case "kafkajs":
      return new (
        await import("@opentelemetry/instrumentation-kafkajs")
      ).KafkaJsInstrumentation();
    case "knex":
      return new (
        await import("@opentelemetry/instrumentation-knex")
      ).KnexInstrumentation();
    case "koa":
      return new (
        await import("@opentelemetry/instrumentation-koa")
      ).KoaInstrumentation();
    case "lru-memoizer":
      return new (
        await import("@opentelemetry/instrumentation-lru-memoizer")
      ).LruMemoizerInstrumentation();
    case "memcached":
      return new (
        await import("@opentelemetry/instrumentation-memcached")
      ).MemcachedInstrumentation();
    case "mongodb":
      return new (
        await import("@opentelemetry/instrumentation-mongodb")
      ).MongoDBInstrumentation();
    case "mongoose":
      return new (
        await import("@opentelemetry/instrumentation-mongoose")
      ).MongooseInstrumentation();
    case "mysql":
      return new (
        await import("@opentelemetry/instrumentation-mysql")
      ).MySQLInstrumentation();
    case "mysql2":
      return new (
        await import("@opentelemetry/instrumentation-mysql2")
      ).MySQL2Instrumentation();
    case "nestjs-core":
      return new (
        await import("@opentelemetry/instrumentation-nestjs-core")
      ).NestInstrumentation();
    case "net":
      return new (
        await import("@opentelemetry/instrumentation-net")
      ).NetInstrumentation();
    case "pg":
      return new (
        await import("@opentelemetry/instrumentation-pg")
      ).PgInstrumentation();
    case "pino":
      return new (
        await import("@opentelemetry/instrumentation-pino")
      ).PinoInstrumentation();
    case "redis":
      return new (
        await import("@opentelemetry/instrumentation-redis")
      ).RedisInstrumentation();
    case "restify":
      return new (
        await import("@opentelemetry/instrumentation-restify")
      ).RestifyInstrumentation();
    case "socket.io":
      return new (
        await import("@opentelemetry/instrumentation-socket.io")
      ).SocketIoInstrumentation();
    case "undici":
      return new (
        await import("@opentelemetry/instrumentation-undici")
      ).UndiciInstrumentation();
    case "winston":
      return new (
        await import("@opentelemetry/instrumentation-winston")
      ).WinstonInstrumentation();
    default:
      console.warn(`Unsupported instrumentation: ${instrument}`);
      return null;
  }
}

async function initializeResource() {
  const resource = new resources.Resource({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: "1.0.0",
    [ATTR_SERVICE_INSTANCE_ID]: serviceInstanceId,
  });

  await resource.waitForAsyncAttributes?.();
  return resource;
}

function initializeLoggerProvider(logExporter: OTLPLogExporter, resource: any) {
  loggerProvider = new LoggerProvider({ resource });
  loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(logExporter)
  );
}

function initializeMetricProvider(
  metricExporter: OTLPMetricExporter,
  resource: any
) {
  if (process.env.METRICS_ENABLED === "true") {
    console.log("Metrics enabled");
    const metricProvider = new MeterProvider({
      resource,
      readers: [
        new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 1000,
        }),
      ],
    });
    metrics.setGlobalMeterProvider(metricProvider);
  }
}

function startSDK(
  traceExporter: OTLPTraceExporter,
  instrumentations: any[],
  resource: any
) {
  const sdk = new NodeSDK({ traceExporter, instrumentations, resource });
  sdk.start();

  process.on("SIGTERM", async () => {
    try {
      await sdk.shutdown();
      await loggerProvider?.shutdown();
      console.log("SDK and LoggerProvider shutdown successfully");
    } catch (error) {
      console.error("Error shutting down SDK or LoggerProvider:", error);
    } finally {
      process.exit(0);
    }
  });
}

function createLogger(severityText: string, severityNumber: number) {
  return (message: string) => {
    if (loggerProvider) {
      loggerProvider.getLogger(SERVICE_NAME_INSTANCE_ID_KEY).emit({
        body: message,
        severityText,
        severityNumber,
      });
    } else {
      console.error("LoggerProvider is not initialized.");
    }
    switch (severityText) {
      case INFO_SEVERITY_TEXT:
        console.log(message);
        break;
      case WARN_SEVERITY_TEXT:
        console.warn(message);
        break;
      case ERROR_SEVERITY_TEXT:
        console.error(message);
        break;
      case DEBUG_SEVERITY_TEXT:
        console.debug(message);
        break;
      default:
        console.log(message);
    }
  };
}
