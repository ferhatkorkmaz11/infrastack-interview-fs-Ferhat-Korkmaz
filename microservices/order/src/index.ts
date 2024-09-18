import { configDotenv } from "dotenv";
configDotenv();
import { Express } from "express";
import {
  register,
  log,
} from "@ferhatkorkmaz11/infrastack-interview-fs-fk-20240916";

const FAILURE_RATE = parseFloat(process.env.FAILURE_RATE ?? "0.0");
const USER_SERVICE_BASE_URL =
  process.env.USER_SERVICE_BASE_URL ?? "http://localhost:8080";

interface User {
  id: number;
  name: string;
}
interface Order {
  id: number;
  user: User;
  total: number;
}

interface CreateOrderRequest {
  userId: number;
  total: number;
}

const orders: Order[] = [];
async function startServer() {
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4317";
  await register({
    endpoint: endpoint,
    instruments: ["express", "http"],
  });

  const app: Express = require("express")();
  app.use(require("express").json());
  app.post("/orders", async (req, res) => {
    try {
      log.info(`Received request from host: ${req.headers.host}`);
      if (Math.random() < FAILURE_RATE) {
        res.status(500).send("Internal Server Error");
        log.error(`Random failure for creating order.`);
        return;
      }
      const createOrderRequest: CreateOrderRequest = req.body;
      const user = await fetch(
        `${USER_SERVICE_BASE_URL}/users/${createOrderRequest.userId}`
      );
      if (!user.ok) {
        res.status(404).send("User not found");
        log.error(`User not found with id: ${createOrderRequest.userId}`);
        return;
      }
      const order: Order = {
        id: orders.length + 1,
        user: await user.json(),
        total: createOrderRequest.total,
      };
      orders.push(order);
      res.json(order);
    } catch (error) {
      log.error(`Error handling request:${error}`);
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/orders/:id", async (req, res) => {
    try {
      log.info(`Received request from host: ${req.headers.host}`);
      if (Math.random() < FAILURE_RATE) {
        res.status(500).send("Internal Server Error");
        log.error(`Random failure for creating order.`);
        return;
      }
      const id = parseInt(req.params.id);
      const order = orders.find((o) => o.id === id);
      if (!order) {
        res.status(404).send("Order not found");
        log.error(`Order not found with id: ${id}`);
        return;
      }
      res.json(order);
    } catch (error) {
      log.error("Error handling request:");
      res.status(500).send("Internal Server Error");
    }
  });
  app.listen(8082, () => {
    log.info("Order service is running on port 8082");
  });
}

startServer();
