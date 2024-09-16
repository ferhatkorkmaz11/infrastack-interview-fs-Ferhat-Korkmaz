import { NodeSDK, resources } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { CompressionAlgorithm } from "@opentelemetry/otlp-exporter-base";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { randomUUID } from "crypto";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

const ATTR_SERVICE_INSTANCE_ID = "service.instance.id"; // This is not exported from the semantic-conventions package, It says it is experimental, so I just defined it myself https://github.com/open-telemetry/opentelemetry-js/blob/9c30124e764e08bd6ccf8dbfbe426a8531c20352/semantic-conventions/src/experimental_attributes.ts#L5919

interface RegisterOptions {
  endpoint: string;
  instruments: string[];
}

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
  let isEndpointValid: boolean = validateUrl(endpoint);

  if (!isEndpointValid) {
    console.error("Invalid endpoint URL. Please provide a valid URL.");
    return;
  }
  const exporterOptions = {
    url: endpoint,
    compression: CompressionAlgorithm.GZIP,
  };

  const exporter = new OTLPTraceExporter(exporterOptions);

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
        console.warn(`Unsupported instrumentation: ${instrument}. Skipping...`);
        break;
    }
  }

  selectedInstrumentations.push(getNodeAutoInstrumentations());
  const sdk: NodeSDK = new NodeSDK({
    traceExporter: exporter,
    instrumentations: selectedInstrumentations,
    resource: new resources.Resource({
      [ATTR_SERVICE_NAME]: endpoint,
      [ATTR_SERVICE_VERSION]: "1.0.0",
      [ATTR_SERVICE_INSTANCE_ID]: process.env.POD_NAME ?? randomUUID(),
    }),
  });

  sdk.start();
  console.log(
    "OpenTelemetry SDK registered and started with selected instrumentations."
  );

  process.on("SIGTERM", () => {
    sdk
      .shutdown()
      .then(() => console.log("Tracing terminated"))
      .catch((error) => console.log("Error terminating tracing", error))
      .finally(() => process.exit(0));
  });
}
