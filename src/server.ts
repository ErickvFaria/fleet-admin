import express from "express";
import "dotenv/config";
import { db } from "./db/client";
import { companies } from "./db/schema";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/companies", async (_req, res) => {
  const result = await db.select().from(companies);
  res.json(result);
});

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});