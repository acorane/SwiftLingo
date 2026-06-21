import { pgTable, serial, integer, real, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contractsTable } from "./contracts";

export const paymentTxStatusEnum = pgEnum("payment_tx_status", ["pending", "confirmed", "released", "refunded"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contractsTable.id).unique(),
  amount: real("amount").notNull(),
  platformFee: real("platform_fee").notNull(),
  translatorPayout: real("translator_payout").notNull(),
  status: paymentTxStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
