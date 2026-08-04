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
  paymentDayOfWeek: integer("payment_day_of_week").notNull(),
  termEndDate: date("term_end_date"),
  weeklyRate: decimal("weekly_rate", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicleFinancings = pgTable("vehicle_financings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  installmentValue: decimal("installment_value", { precision: 10, scale: 2 }).notNull(),
  dueDay: integer("due_day").notNull(),
  totalInstallments: integer("total_installments").notNull(),
  paidInstallments: integer("paid_installments").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicleInsurances = pgTable("vehicle_insurances", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  monthlyValue: decimal("monthly_value", { precision: 10, scale: 2 }).notNull(),
  dueDay: integer("due_day").notNull(),
  lastPaidAt: date("last_paid_at"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspections = pgTable("inspections", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  contractId: integer("contract_id").references(() => contracts.id),
  inspectedAt: timestamp("inspected_at").defaultNow().notNull(),
  km: integer("km").notNull(),
  color: varchar("color", { length: 40 }),
  checklist: text("checklist").notNull(),
  generalNotes: text("general_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inspectionPhotos = pgTable("inspection_photos", {
  id: serial("id").primaryKey(),
  inspectionId: integer("inspection_id").notNull().references(() => inspections.id),
  filename: varchar("filename", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});