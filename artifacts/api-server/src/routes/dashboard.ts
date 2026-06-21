import { Router } from "express";
import { db, jobsTable, contractsTable, notificationsTable, bidsTable, paymentsTable } from "@workspace/db";
import { eq, and, or, desc, count, sql } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/dashboard", requireAuth, async (req, res) => {
  const user = getUser(req);

  try {
    const activeJobs = await db.select().from(jobsTable)
      .where(and(eq(jobsTable.clientId, user.id), eq(jobsTable.status, "open")))
      .orderBy(desc(jobsTable.createdAt))
      .limit(5);

    const userContracts = or(eq(contractsTable.clientId, user.id), eq(contractsTable.translatorId, user.id))!;
    const activeContracts = await db.select().from(contractsTable)
      .where(and(userContracts, or(eq(contractsTable.status, "active"), eq(contractsTable.status, "pending_payment"), eq(contractsTable.status, "delivered"))!))
      .orderBy(desc(contractsTable.createdAt))
      .limit(5);

    const completedContracts = await db.select().from(contractsTable)
      .where(and(userContracts, eq(contractsTable.status, "completed")))
      .orderBy(desc(contractsTable.updatedAt))
      .limit(5);

    const [unreadResult] = await db.select({ count: count() }).from(notificationsTable)
      .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.isRead, false)));

    const recentActivity = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, user.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(10);

    const [pendingBidsResult] = await db.select({ count: count() }).from(bidsTable)
      .where(and(eq(bidsTable.translatorId, user.id), eq(bidsTable.status, "pending")));

    const formatJob = (j: typeof jobsTable.$inferSelect) => ({
      id: j.id, clientId: j.clientId, title: j.title, sourceLang: j.sourceLang,
      targetLang: j.targetLang, wordCount: j.wordCount, budgetMin: j.budgetMin,
      budgetMax: j.budgetMax, deliveryType: j.deliveryType, specialization: j.specialization,
      status: j.status, bidsCount: j.bidsCount, createdAt: j.createdAt.toISOString(),
    });

    const formatContract = (c: typeof contractsTable.$inferSelect) => ({
      id: c.id, jobId: c.jobId, clientId: c.clientId, translatorId: c.translatorId,
      bidId: c.bidId, agreedPrice: c.agreedPrice, platformFee: c.platformFee,
      translatorPayout: c.translatorPayout, status: c.status, paymentStatus: c.paymentStatus,
      createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(),
    });

    const formatNotif = (n: typeof notificationsTable.$inferSelect) => ({
      id: n.id, userId: n.userId, type: n.type, title: n.title, body: n.body,
      relatedId: n.relatedId, relatedType: n.relatedType, isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    });

    res.json({
      activeJobs: activeJobs.map(formatJob),
      activeContracts: activeContracts.map(formatContract),
      completedContracts: completedContracts.map(formatContract),
      unreadNotificationsCount: Number(unreadResult?.count ?? 0),
      recentActivity: recentActivity.map(formatNotif),
      pendingBidsCount: Number(pendingBidsResult?.count ?? 0),
      earningsTotal: null,
    });
  } catch (err) {
    logger.error({ err }, "Dashboard error");
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

router.get("/marketplace/stats", requireAuth, async (req, res) => {
  try {
    const [openJobsResult] = await db.select({ count: count() }).from(jobsTable).where(eq(jobsTable.status, "open"));
    const [approvedTranslatorsResult] = await db.select({ count: count() }).from(db.$with("users_approved" as any) as any);

    const openJobsCount = Number(openJobsResult?.count ?? 0);
    const [completedResult] = await db.select({ count: count() }).from(contractsTable).where(eq(contractsTable.status, "completed"));

    const langPairStats = await db.select({
      sourceLang: jobsTable.sourceLang,
      targetLang: jobsTable.targetLang,
      count: count(),
    }).from(jobsTable).groupBy(jobsTable.sourceLang, jobsTable.targetLang).limit(10);

    res.json({
      openJobsCount,
      approvedTranslatorsCount: 0,
      completedContractsCount: Number(completedResult?.count ?? 0),
      languagePairStats: langPairStats.map(s => ({ sourceLang: s.sourceLang, targetLang: s.targetLang, count: Number(s.count) })),
    });
  } catch (err) {
    logger.error({ err }, "Marketplace stats error");
    res.status(500).json({ error: "Failed to load stats" });
  }
});

export default router;
