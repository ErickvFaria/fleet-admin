import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { vehicleInsurances, financialEntries } from "../db/schema";

export const insurancesRouter = Router();

insurancesRouter.get("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const result = await db.select().from(vehicleInsurances).where(eq(vehicleInsurances.companyId, companyId));
  res.json(result);
});

insurancesRouter.post("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const { vehicleId, monthlyValue, dueDay } = req.body;

  const [created] = await db
    .insert(vehicleInsurances)
    .values({ companyId, vehicleId, monthlyValue, dueDay })
    .returning();

  res.status(201).json(created);
});

insurancesRouter.put("/:id/pay-month", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);

  const [insurance] = await db
    .select()
    .from(vehicleInsurances)
    .where(and(eq(vehicleInsurances.id, id), eq(vehicleInsurances.companyId, companyId)));
  if (!insurance) return res.status(404).json({ error: "Seguro não encontrado" });

  const today = new Date().toISOString().slice(0, 10);

  const [updated] = await db
    .update(vehicleInsurances)
    .set({ lastPaidAt: today })
    .where(and(eq(vehicleInsurances.id, id), eq(vehicleInsurances.companyId, companyId)))
    .returning();

  await db.insert(financialEntries).values({
    companyId,
    vehicleId: insurance.vehicleId,
    direction: "out",
    category: "seguro",
    description: "Mensalidade do seguro",
    amount: insurance.monthlyValue,
    dueAt: today,
    paidAt: today,
    status: "paid",
  });

  res.json(updated);
});

insurancesRouter.delete("/:id", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const [deleted] = await db
    .delete(vehicleInsurances)
    .where(and(eq(vehicleInsurances.id, id), eq(vehicleInsurances.companyId, companyId)))
    .returning();
  if (!deleted) return res.status(404).json({ error: "Seguro não encontrado" });
  res.json({ ok: true });
});