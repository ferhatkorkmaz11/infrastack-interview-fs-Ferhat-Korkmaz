import { Express } from "express";

const app: Express = require("express")();

app.get("/", (req, res) => {
  res.send("Hello World from User service!");
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
