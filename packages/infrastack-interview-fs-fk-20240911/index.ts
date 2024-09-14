import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";

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
  const exporter = new OTLPTraceExporter({
    url: endpoint,
  });

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

  const sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: selectedInstrumentations,
  });

  sdk.start();
  console.log(
    "OpenTelemetry SDK registered and started with selected instrumentations."
  );
}
