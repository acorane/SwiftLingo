import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const deliveryTypeEnum = pgEnum("delivery_type", ["standard", "express", "urgent"]);
export const jobStatusEnum = pgEnum("job_status", ["open", "in_progress", "completed", "cancelled"]);

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description"),
  sourceLang: text("source_lang").notNull(),
  targetLang: text("target_lang").notNull(),
  wordCount: integer("word_count"),
  budgetMin: real("budget_min").notNull(),
  budgetMax: real("budget_max").notNull(),
  deliveryType: deliveryTypeEnum("delivery_type").notNull().default("standard"),
  specialization: text("specialization"),
  status: jobStatusEnum("status").notNull().default("open"),
  bidsCount: integer("bids_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true, bidsCount: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
