import { Express } from "express";
import { register } from "@ferhatkorkmaz11/infrastack-interview-fs-fk-20240916";
register({
  endpoint: "http://localhost:4317",
  instruments: ["express", "http"],
});

const app: Express = require("express")();
register;
app.get("/", (req, res) => {
  console.log(`received request from host:${req.headers.host}`);
  res.send("Hello World from User service!");
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
