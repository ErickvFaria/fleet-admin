import express from "express";
import cors from "cors";
import "dotenv/config";
import { db } from "./db/client";
import { companies } from "./db/schema";
import { vehiclesRouter } from "./routes/vehicles";
import { driversRouter } from "./routes/drivers";
import { financialRouter } from "./routes/financial";
import { authRouter } from "./routes/auth";
import { requireAuth } from "./middlewares/auth";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/companies", async (_req, res) => {
  const result = await db.select().from(companies);
  res.json(result);
});

app.use("/vehicles", requireAuth, vehiclesRouter);
app.use("/drivers", requireAuth, driversRouter);
app.use("/financial-entries", requireAuth, financialRouter);
app.use("/auth", authRouter);

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});