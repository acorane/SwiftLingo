import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import translatorProfilesRouter from "./translator_profiles";
import translatorApplicationsRouter from "./translator_applications";
import jobsRouter from "./jobs";
import bidsRouter from "./bids";
import contractsRouter from "./contracts";
import messagesRouter from "./messages";
import paymentsRouter from "./payments";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/translator-profiles", translatorProfilesRouter);
router.use("/translator-applications", translatorApplicationsRouter);
router.use("/jobs", jobsRouter);
router.use("/bids", bidsRouter);
router.use("/contracts", contractsRouter);
router.use("/contracts", messagesRouter);
router.use("/payments", paymentsRouter);
router.use("/reviews", reviewsRouter);
router.use("/notifications", notificationsRouter);
router.use("/my-bids", bidsRouter);
router.use(dashboardRouter);

export default router;
