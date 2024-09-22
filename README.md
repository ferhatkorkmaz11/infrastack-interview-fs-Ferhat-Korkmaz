# Running the app

First step to run the app is setting the `.env` file that is in the root of the project. There is an example `.env.example` file for you to refer. It has the following variables

```
CLICKHOUSE_ENDPOINT=TCP://YOUR_CLICKHOUSE_ENDPOINT:9440?SECURE=TRUE&DIAL_TIMEOUT=10S
CLICKHOUSE_ENDPOINT_HTTP=HTTPS://YOUR_CLICKHOUSE_ENDPOINT:8443
CLICKHOUSE_USERNAME=YOUR_USERNAME
CLICKHOUSE_PASSWORD=YOUR_PASSWORD
CLICKHOUSE_DATABASE=YOUR_DATABASE
METRICS_ENABLED=TRUE
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

## Opentelemetry collector

After setting up the root `.env` file, you can invoke the open telemetry collector by entering the command to _only_ invoke the collector service.

```
$ docker-compose up --build otel-collector
```

`P.S.: This collector runs on port 4317, make sure that they are not allocated by any other process.`

---

## Exporter validation script

The validation script is placed under `~/scripts/opentelemetry/validation/data-streaming`.
It has an `.env.example` with the following variables:

```
CLICKHOUSE_ENDPOINT_HTTP=https://YOUR_CLICKHOUUSE_ENDPOINT:8443
CLICKHOUSE_USERNAME=YOUR_CLICKHOUSE_USERNAME
CLICKHOUSE_PASSWORD=YOUR_CLICKHOUSE_PASSWORD
CLICKHOUSE_DATABASE=YOUR_CLICKHOUSE_DATABASE
METRICS_ENABLED=true
SERVICE_NAME=VALIDATOR
```

After you set up the `.env` file under `~/scripts/opentelemetry/validation/data-streaming/.env`, enter the following commands to run the validation scripts to see whether traces, metrics, and logs are replicated to Clickhouse.
`P.S.: This script runs on port 8083, make sure that they are not allocated by any other process.`

```
$ npm install
```

```
$ npm run dev
```

It applies exponential-backoff waiting for data validation. After a certain time, if no data is exported to Clickhouse, it exit the process with the exit code `1`, else, it exits with code `0`.

---

## Dashboard and example microservices

There are two ways:

### 1- via Docker compose (recommended)

If you have already set up the `.env` in the root, you can just run the followig command:

```
$ docker-compose up --build
```

The `docker-compose.yml` file have some environment variables. You can play with them, but their default behaviours are also fine.

It should start the following processes:

- Opentelemetry collector (Port 4317, exports the traces, metrics, and logs to Clickhouse)
- User microservice (Port 8080, no outgoing communication to other microservices)
- Order microservice (Port 8082, gets the details of the user who created the order from user-service)
- Payment microservice (Port 8081, gets the details of an order whose payment has been made from order-service)
- Dashboard (Port 3000, Next.js application to monitor those microservices.)
  `P.S.: Make sure that the ports 3000, 4317, 8080, 8081, 8082 are not occuppied by other processes.`

---

### 2- via Turborepo

This is a little bit more work as there are four additional `.env` files to be setup.

1. `~/microservices/user/.env`
2. `~/microservices/payment/.env`
3. `~/microservices/order/.env`
4. `~/dashboard/.env`

First 3 are almost identical and there are provided `.env.example` files in each directory.

```
METRICS_ENABLED=true
SERVICE_NAME=NAME_OF_THE_SERVICE
POD_NAME=NAME_OF_THE_POD
FAILURE_RATE=0
OTEL_EXPORTER_OTLP_ENDPOINT=YOUR_OTEL_EXPORTER_OTLP_ENDPOINT
```

The failure rate determins the probability of the internal server error that is thrown by that server. This variable is between 0 and 1 floating. This helps about investigating the dashboard.

Above is the base `.env` configuration.

- For order, you should add `USER_SERVICE_BASE_URL=YOUR_USER_SERVICE_BASE_URL` which is probably `http://localhost:8080`
- For payment, you should add `ORDER_SERVICE_BASE_URL=YOUR_ORDER_SERVICE_BASE_URL` which is probably `http://localhost:8082`.

For the dashboard:

```
CLICKHOUSE_HOST=YOUR_CLICKHOUSE_HOST
CLICKHOUSE_USER=YOUR_CLICKHOUSE_USER
CLICKHOUSE_PASSWORD=YOUR_CLICKHOUSE_PASSWORD
CLICKHOUSE_DATABASE=YOUR_CLICKHOUSE_DATABASE
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

the `.env` file should be set like the above.

After that is set up, run the following commands in the root directory:

```
$ npm install
```

```
$ npm run dev
```

That should invoke the microservices and the dashboard.
`P.S.: You still need to run the Opentelemetry collector via Docker compose.`

---

NPM Package could be installed via the commands:

```
$ npm i @ferhatkorkmaz11/infrastack-interview-fs-fk-20240916
```

[NPM Package](https://www.npmjs.com/package/@ferhatkorkmaz11/infrastack-interview-fs-fk-20240916)
[YouTube](https://youtu.be/-_oplH0OEFc?si=VfWNnU9lz6mlJyF1)
`I forgot to say that as performance suggestion it is good to cache those frequently read query results from Clickhouse to Redis. Since telemetry data is single write and almost never changes, it would be huge performance and cost boost.`
`Also, again I forgot to say that in a real world scenario, during the SDK setup, API key parameter should be taken. Decode that API key and insert the logs, traces, and metrics with the organization id. All of the queries in the dashboard, then updated with respect to that organizations id, which would probably come from an auth middleware.`

---

If you encounter any problem during the above processes please let me know via my GSM, my email, or my LinkedIn at any time. I live in `UTC+3 timezone` and it may take some time to get back to you.
GSM: +90 532 674 6608
Email: ferhat@ferhatkorkmaz.com
LinkedIn: http://linkedin.com/in/ferhatkorkmaz11

---
