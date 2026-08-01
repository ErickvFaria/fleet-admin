CREATE TABLE "vehicle_financings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"installment_value" numeric(10, 2) NOT NULL,
	"due_day" integer NOT NULL,
	"total_installments" integer NOT NULL,
	"paid_installments" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_insurances" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"vehicle_id" integer NOT NULL,
	"monthly_value" numeric(10, 2) NOT NULL,
	"due_day" integer NOT NULL,
	"last_paid_at" date,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_financings" ADD CONSTRAINT "vehicle_financings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_financings" ADD CONSTRAINT "vehicle_financings_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_insurances" ADD CONSTRAINT "vehicle_insurances_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_insurances" ADD CONSTRAINT "vehicle_insurances_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;