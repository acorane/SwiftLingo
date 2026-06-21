import { Router } from "express";
import { db, translatorApplicationsTable, usersTable, translatorProfilesTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getUser } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

function formatApp(a: import("@workspace/db").TranslatorApplication) {
  return {
    id: a.id,
    userId: a.userId,
    fullName: a.fullName,
    bio: a.bio,
    certifications: a.certifications,
    yearsOfExperience: a.yearsOfExperience,
    pricePerWord: a.pricePerWord,
    sourceLanguages: a.sourceLanguages,
    targetLanguages: a.targetLanguages,
    specializations: a.specializations,
    status: a.status,
    termsAcceptedAt: a.termsAcceptedAt.toISOString(),
    adminNote: a.adminNote,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

router.post("/", requireAuth, async (req, res) => {
  const user = getUser(req);
  const { fullName, bio, certifications, yearsOfExperience, pricePerWord, sourceLanguages, targetLanguages, specializations, acceptTerms } = req.body;

  if (!acceptTerms) {
    res.status(400).json({ error: "Must accept terms and conditions" });
    return;
  }

  try {
    const existing = await db.select().from(translatorApplicationsTable).where(eq(translatorApplicationsTable.userId, user.id)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Application already submitted" });
      return;
    }

    const [app] = await db.insert(translatorApplicationsTable).values({
      userId: user.id,
      fullName,
      bio,
      certifications,
      yearsOfExperience,
      pricePerWord,
      sourceLanguages: sourceLanguages ?? [],
      targetLanguages: targetLanguages ?? [],
      specializations: specializations ?? [],
      status: "pending",
      termsAcceptedAt: new Date(),
    }).returning();

    await db.update(usersTable).set({ role: "translator" }).where(eq(usersTable.id, user.id));

    await db.insert(notificationsTable).values({
      userId: user.id,
      type: "application_submitted",
      title: "Application Submitted",
      body: "Your translator application has been submitted and is under review.",
      relatedId: app.id,
      relatedType: "translator_application",
    });

    res.status(201).json(formatApp(app));
  } catch (err) {
    logger.error({ err }, "Submit translator application error");
    res.status(500).json({ error: "Failed to submit application" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = getUser(req);
  try {
    const [app] = await db.select().from(translatorApplicationsTable).where(eq(translatorApplicationsTable.userId, user.id)).limit(1);
    if (!app) {
      res.status(404).json({ error: "No application found" });
      return;
    }
    res.json(formatApp(app));
  } catch (err) {
    logger.error({ err }, "Get translator application error");
    res.status(500).json({ error: "Failed to get application" });
  }
});

export default router;
