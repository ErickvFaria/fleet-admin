import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";

export const authRouter = Router();

// Registrar um novo usuário (vinculado a uma empresa que já existe)
authRouter.post("/register", async (req, res) => {
  const { companyId, name, email, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(users)
    .values({ companyId, name, email, passwordHash })
    .returning({ id: users.id, name: users.name, email: users.email });

  res.status(201).json(created);
});

// Login
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) return res.status(401).json({ error: "Email ou senha inválidos" });

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) return res.status(401).json({ error: "Email ou senha inválidos" });

  const token = jwt.sign(
    { userId: user.id, companyId: user.companyId },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});