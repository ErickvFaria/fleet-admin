import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { vehicles } from "../db/schema";

export const vehiclesRouter = Router();

// Listar veículos de uma empresa
vehiclesRouter.get("/", async (req, res) => {
  const companyId = Number(req.query.companyId);
  const result = await db.select().from(vehicles).where(eq(vehicles.companyId, companyId));
  res.json(result);
});

// Buscar um veículo específico
vehiclesRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await db.select().from(vehicles).where(eq(vehicles.id, id));
  if (!result) return res.status(404).json({ error: "Veículo não encontrado" });
  res.json(result);
});

// Criar veículo
vehiclesRouter.post("/", async (req, res) => {
  const { companyId, plate, brand, model, year, currentKm } = req.body;
  const [created] = await db
    .insert(vehicles)
    .values({ companyId, plate, brand, model, year, currentKm })
    .returning();
  res.status(201).json(created);
});

// Atualizar veículo
vehiclesRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { plate, brand, model, year, currentKm, status } = req.body;
  const [updated] = await db
    .update(vehicles)
    .set({ plate, brand, model, year, currentKm, status })
    .where(eq(vehicles.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Veículo não encontrado" });
  res.json(updated);
});

// Deletar veículo
vehiclesRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Veículo não encontrado" });
  res.json({ ok: true });
});