import { pgTable, serial, integer, varchar, text, decimal, timestamp, date } from "drizzle-orm/pg-core";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: varchar("name", { length: 180 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  plate: varchar("plate", { length: 12 }).notNull(),
  brand: varchar("brand", { length: 80 }),
  model: varchar("model", { length: 120 }).notNull(),
  year: integer("year").notNull(),
  currentKm: integer("current_km").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("available").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  currentVehicleId: integer("current_vehicle_id").references(() => vehicles.id),
  name: varchar("name", { length: 180 }).notNull(),
  document: varchar("document", { length: 32 }).notNull(),
  licenseNumber: varchar("license_number", { length: 48 }),
  licenseExpiresAt: date("license_expires_at"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financialEntries = pgTable("financial_entries", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  driverId: integer("driver_id").references(() => drivers.id),
  direction: varchar("direction", { length: 10 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  description: varchar("description", { length: 220 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueAt: date("due_at").notNull(),
  paidAt: date("paid_at"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  weeklyRate: decimal("weekly_rate", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});