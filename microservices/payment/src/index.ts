import { configDotenv } from "dotenv";
configDotenv();
import { Express } from "express";
import {
  register,
  log,
} from "@ferhatkorkmaz11/infrastack-interview-fs-fk-20240916";

const FAILURE_RATE = parseFloat(process.env.FAILURE_RATE ?? "0.0");
const ORDER_SERVICE_BASE_URL =
  process.env.ORDER_SERVICE_BASE_URL ?? "http://localhost:8082";

interface CreatePaymentRequest {
  orderId: number;
}

interface User {
  id: number;
  name: string;
}
interface Order {
  id: number;
  user: User;
  total: number;
}

async function startServer() {
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4317";
  await register({
    endpoint: endpoint,
    instruments: ["express", "http"],
  });

  const app: Express = require("express")();
  app.use(require("express").json());
  app.post("/payments", async (req, res) => {
    try {
      log.info(`Received request from host: ${req.headers.host}`);
      if (Math.random() < FAILURE_RATE) {
        res.status(500).send("Internal Server Error");
        log.error(`Random failure for creating payment.`);
        return;
      }
      const createPaymentRequest: CreatePaymentRequest = req.body;
      const order = await fetch(
        `${ORDER_SERVICE_BASE_URL}/orders/${createPaymentRequest.orderId}`
      );
      if (!order.ok) {
        res.status(404).send("Order not found");
        log.error(`Order not found with id: ${createPaymentRequest.orderId}`);
        return;
      }
      const orderData: Order = await order.json();
      res.json(orderData);
    } catch (error) {
      log.error(`Error handling request:${error}`);
      res.status(500).send("Internal Server Error");
    }
  });
  app.listen(8081, () => {
    log.info("Payment service is running on port 8081");
  });
}

startServer();
