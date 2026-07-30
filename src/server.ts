import express from "express";
import "dotenv/config";
import { db } from "./db/client";
import { companies } from "./db/schema";
import { vehiclesRouter } from "./routes/vehicles";
import { driversRouter } from "./routes/drivers";
import { financialRouter } from "./routes/financial";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/companies", async (_req, res) => {
  const result = await db.select().from(companies);
  res.json(result);
});

app.use("/vehicles", vehiclesRouter);
app.use("/drivers", driversRouter);
app.use("/financial-entries", financialRouter);

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});