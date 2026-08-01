import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { vehicleFinancings, financialEntries } from "../db/schema";

export const financingsRouter = Router();

// Listar financiamentos da empresa
financingsRouter.get("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const result = await db.select().from(vehicleFinancings).where(eq(vehicleFinancings.companyId, companyId));
  res.json(result);
});

// Criar financiamento
financingsRouter.post("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const { vehicleId, installmentValue, dueDay, totalInstallments } = req.body;

  const [created] = await db
    .insert(vehicleFinancings)
    .values({ companyId, vehicleId, installmentValue, dueDay, totalInstallments })
    .returning();

  res.status(201).json(created);
});

// Marcar parcela como paga (valor customizável, útil pra amortização com desconto de juros)
financingsRouter.put("/:id/pay-installment", async (req, res) => {
  const id = Number(req.params.id);
  const companyId = req.auth!.companyId;
  const { amount } = req.body;

  const [financing] = await db.select().from(vehicleFinancings).where(eq(vehicleFinancings.id, id));
  if (!financing) return res.status(404).json({ error: "Financiamento não encontrado" });

  const paidAmount = amount ? String(amount) : financing.installmentValue;
  const newPaidCount = financing.paidInstallments + 1;
  const newStatus = newPaidCount >= financing.totalInstallments ? "finished" : "active";

  const [updated] = await db
    .update(vehicleFinancings)
    .set({ paidInstallments: newPaidCount, status: newStatus })
    .where(eq(vehicleFinancings.id, id))
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

// Deletar financiamento
financingsRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(vehicleFinancings).where(eq(vehicleFinancings.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Financiamento não encontrado" });
  res.json({ ok: true });
});