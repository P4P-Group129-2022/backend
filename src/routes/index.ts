import express from "express";
import Logger from "../utils/Logger";
import GitActionsRoutes from "./GitActionsRoutes";
import NotificationRoutes from "./NotificationRoutes";
import ColleagueRoutes from "./ColleagueRoutes";
import MessageRoutes from "./MessageRoutes";

const router = express();

router.use("/git", GitActionsRoutes);
router.use("/notification", NotificationRoutes);
router.use("/colleague", ColleagueRoutes);
router.use("/message", MessageRoutes);

export default router;
