import { Express } from "express";

const app: Express = require("express")();

app.get("/", (req, res) => {
  res.send("Hello World from Order service!");
});

app.listen(8082, () => {
  console.log("Server is running on port 8082");
});
