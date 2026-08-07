import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { vehicleFinancings, financialEntries } from "../db/schema";

export const financingsRouter = Router();

financingsRouter.get("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const result = await db.select().from(vehicleFinancings).where(eq(vehicleFinancings.companyId, companyId));
  res.json(result);
});

financingsRouter.post("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const { vehicleId, installmentValue, dueDay, totalInstallments } = req.body;

  const [created] = await db
    .insert(vehicleFinancings)
    .values({ companyId, vehicleId, installmentValue, dueDay, totalInstallments })
    .returning();

  res.status(201).json(created);
});

financingsRouter.put("/:id/pay-installment", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const { amount } = req.body;

  const [financing] = await db
    .select()
    .from(vehicleFinancings)
    .where(and(eq(vehicleFinancings.id, id), eq(vehicleFinancings.companyId, companyId)));
  if (!financing) return res.status(404).json({ error: "Financiamento não encontrado" });

  const paidAmount = amount ? String(amount) : financing.installmentValue;
  const newPaidCount = financing.paidInstallments + 1;
  const newStatus = newPaidCount >= financing.totalInstallments ? "finished" : "active";

  const [updated] = await db
    .update(vehicleFinancings)
    .set({ paidInstallments: newPaidCount, status: newStatus })
    .where(and(eq(vehicleFinancings.id, id), eq(vehicleFinancings.companyId, companyId)))
    .returning();

  const today = new Date().toISOString().slice(0, 10);
  await db.insert(financialEntries).values({
    companyId,
    vehicleId: financing.vehicleId,
    direction: "out",
    category: "financiamento",
    description: `Parcela ${newPaidCount}/${financing.totalInstallments} - Financiamento`,
    amount: paidAmount,
    dueAt: today,
    paidAt: today,
    status: "paid",
  });

  res.json(updated);
});

financingsRouter.delete("/:id", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const [deleted] = await db
    .delete(vehicleFinancings)
    .where(and(eq(vehicleFinancings.id, id), eq(vehicleFinancings.companyId, companyId)))
    .returning();
  if (!deleted) return res.status(404).json({ error: "Financiamento não encontrado" });
  res.json({ ok: true });
});