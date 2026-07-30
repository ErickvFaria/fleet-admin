import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { financialEntries } from "../db/schema";

export const financialRouter = Router();

financialRouter.get("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const result = await db
    .select()
    .from(financialEntries)
    .where(eq(financialEntries.companyId, companyId));
  res.json(result);
});

financialRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await db.select().from(financialEntries).where(eq(financialEntries.id, id));
  if (!result) return res.status(404).json({ error: "Lançamento não encontrado" });
  res.json(result);
});

financialRouter.post("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const { vehicleId, driverId, direction, category, description, amount, dueAt } = req.body;
  const [created] = await db
    .insert(financialEntries)
    .values({ companyId, vehicleId, driverId, direction, category, description, amount, dueAt })
    .returning();
  res.status(201).json(created);
});

financialRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { direction, category, description, amount, dueAt, paidAt, status } = req.body;
  const [updated] = await db
    .update(financialEntries)
    .set({ direction, category, description, amount, dueAt, paidAt, status })
    .where(eq(financialEntries.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Lançamento não encontrado" });
  res.json(updated);
});

financialRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(financialEntries).where(eq(financialEntries.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Lançamento não encontrado" });
  res.json({ ok: true });
});