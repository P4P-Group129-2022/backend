import express from "express";
import Logger from "../utils/Logger";
import GitActionsRoutes from "./GitActionsRoutes";
import NotificationRoutes from "./NotificationRoutes";
import ColleagueRoutes from "./ColleagueRoutes";
import MessageRoutes from "./MessageRoutes";
import ScenarioRoutes from "./ScenarioRoutes";
import GitHubRoutes from "./GitHubRoutes";

const router = express();

router.use("/git", GitActionsRoutes);
router.use("/notification", NotificationRoutes);
router.use("/colleague", ColleagueRoutes);
router.use("/message", MessageRoutes);
router.use("/scenario", ScenarioRoutes);
router.use("/github", GitHubRoutes);

export default router;
