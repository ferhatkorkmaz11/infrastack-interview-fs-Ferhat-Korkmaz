import { configDotenv } from "dotenv";
configDotenv();
import { Express } from "express";
import {
  register,
  log,
} from "@ferhatkorkmaz11/infrastack-interview-fs-fk-20240916";

const FAILURE_RATE = parseFloat(process.env.FAILURE_RATE ?? "0.0");

interface User {
  id: number;
  name: string;
}
const users: User[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
];
async function startServer() {
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4317";
  await register({
    endpoint: endpoint,
    instruments: ["express", "http"],
  });

  const app: Express = require("express")();
  app.use(require("express").json());
  app.get("/users/:id", async (req, res) => {
    try {
      log.info(`Received request from host: ${req.headers.host}`);
      const id = parseInt(req.params.id);
      const user = users.find((u) => u.id === id);
      if (!user) {
        res.status(404).send("User not found");
        log.error(`User not found with id: ${id}`);
        return;
      }
      if (Math.random() < FAILURE_RATE) {
        res.status(500).send("Internal Server Error");
        log.error(`Random failure for user with id: ${id}`);
        return;
      }
      res.json(user);
    } catch (error) {
      log.error(`Error handling request:${error}`);
      res.status(500).send("Internal Server Error");
    }
  });
  app.listen(8080, () => {
    log.info("User service is running on port 8080");
  });
}

startServer();
