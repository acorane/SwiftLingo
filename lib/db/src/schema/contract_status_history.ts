import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { contractsTable } from "./contracts";

export const contractStatusHistoryTable = pgTable("contract_status_history", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contractsTable.id),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContractStatusHistorySchema = createInsertSchema(contractStatusHistoryTable).omit({ id: true, createdAt: true });
export type InsertContractStatusHistory = z.infer<typeof insertContractStatusHistorySchema>;
export type ContractStatusHistory = typeof contractStatusHistoryTable.$inferSelect;
