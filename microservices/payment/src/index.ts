import { Express } from "express";

const app: Express = require("express")();

app.get("/", (req, res) => {
  res.send("Hello World from Payment service!");
});

app.listen(8081, () => {
  console.log("Server is running on port 8081");
});
