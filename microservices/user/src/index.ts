import { Express } from "express";
import {
  register,
  log,
} from "@ferhatkorkmaz11/infrastack-interview-fs-fk-20240916";

async function startServer() {
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4317";
  await register({
    endpoint: endpoint,
    instruments: ["express", "http"],
  });

  const app: Express = require("express")();

  app.get("/", async (req, res) => {
    try {
      log.info(`Received request from host: ${req.headers.host}`);
      const response = await fetch("http://localhost:8082");
      res.send("Hello World from User service!");
    } catch (error) {
      log.error("Error handling request:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  app.get("/404", (req, res) => {
    res.status(404).send("Not Found");
  });

  app.listen(8080, () => {
    log.info("User service is running on port 8080");
  });
}

startServer();
