import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";
import { bidsTable } from "./bids";

export const contractStatusEnum = pgEnum("contract_status", ["pending_payment", "active", "delivered", "completed", "cancelled", "disputed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "confirmed", "released", "refunded"]);

export const contractsTable = pgTable("contracts", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id),
  clientId: integer("client_id").notNull().references(() => usersTable.id),
  translatorId: integer("translator_id").notNull().references(() => usersTable.id),
  bidId: integer("bid_id").notNull().references(() => bidsTable.id),
  agreedPrice: real("agreed_price").notNull(),
  platformFee: real("platform_fee").notNull(),
  translatorPayout: real("translator_payout").notNull(),
  status: contractStatusEnum("status").notNull().default("pending_payment"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  deliveryNote: text("delivery_note"),
  disputeReason: text("dispute_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertContractSchema = createInsertSchema(contractsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contractsTable.$inferSelect;
