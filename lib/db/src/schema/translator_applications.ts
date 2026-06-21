import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const applicationStatusEnum = pgEnum("application_status", ["draft", "pending", "approved", "rejected"]);

export const translatorApplicationsTable = pgTable("translator_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  fullName: text("full_name").notNull(),
  bio: text("bio"),
  certifications: text("certifications"),
  yearsOfExperience: integer("years_of_experience"),
  pricePerWord: real("price_per_word").notNull(),
  sourceLanguages: text("source_languages").array().notNull().default([]),
  targetLanguages: text("target_languages").array().notNull().default([]),
  specializations: text("specializations").array().notNull().default([]),
  status: applicationStatusEnum("status").notNull().default("pending"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }).notNull(),
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTranslatorApplicationSchema = createInsertSchema(translatorApplicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTranslatorApplication = z.infer<typeof insertTranslatorApplicationSchema>;
export type TranslatorApplication = typeof translatorApplicationsTable.$inferSelect;
