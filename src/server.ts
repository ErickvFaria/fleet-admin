import express from "express";
import cors from "cors";
import "dotenv/config";
import { db } from "./db/client";
import { companies } from "./db/schema";
import { vehiclesRouter } from "./routes/vehicles";
import { driversRouter } from "./routes/drivers";
import { financialRouter } from "./routes/financial";
import { authRouter } from "./routes/auth";
import { contractsRouter } from "./routes/contracts";
import { financingsRouter } from "./routes/financings";
import { insurancesRouter } from "./routes/insurances";
import { inspectionsRouter } from "./routes/inspections";
import { requireAuth } from "./middlewares/auth";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

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
app.use("/contracts", requireAuth, contractsRouter);
app.use("/financings", requireAuth, financingsRouter);
app.use("/insurances", requireAuth, insurancesRouter);
app.use("/inspections", requireAuth, inspectionsRouter);
app.use("/auth", authRouter);

const port = process.env.PORT || 3333;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});