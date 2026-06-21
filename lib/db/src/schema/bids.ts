import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";

export const bidStatusEnum = pgEnum("bid_status", ["pending", "accepted", "rejected", "withdrawn"]);

export const bidsTable = pgTable("bids", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id),
  translatorId: integer("translator_id").notNull().references(() => usersTable.id),
  amount: real("amount").notNull(),
  coverLetter: text("cover_letter"),
  deliveryDays: integer("delivery_days"),
  status: bidStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBidSchema = createInsertSchema(bidsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bidsTable.$inferSelect;
