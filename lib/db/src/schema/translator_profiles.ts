import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const translatorProfilesTable = pgTable("translator_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  bio: text("bio"),
  certifications: text("certifications"),
  yearsOfExperience: integer("years_of_experience"),
  pricePerWord: real("price_per_word").notNull().default(0),
  sourceLanguages: text("source_languages").array().notNull().default([]),
  targetLanguages: text("target_languages").array().notNull().default([]),
  specializations: text("specializations").array().notNull().default([]),
  rating: real("rating"),
  completedJobsCount: integer("completed_jobs_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTranslatorProfileSchema = createInsertSchema(translatorProfilesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTranslatorProfile = z.infer<typeof insertTranslatorProfileSchema>;
export type TranslatorProfile = typeof translatorProfilesTable.$inferSelect;
