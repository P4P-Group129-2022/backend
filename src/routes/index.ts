import express from "express";
import GitActionsRoutes from "./GitActionsRoutes";
import NotificationRoutes from "./NotificationRoutes";
import ColleagueRoutes from "./ColleagueRoutes";
import MessageRoutes from "./MessageRoutes";
import ScenarioRoutes from "./ScenarioRoutes";
import GitHubRoutes from "./GitHubRoutes";
import FileRoutes from "./FileRoutes";

const router = express();

router.use("/git", GitActionsRoutes);
router.use("/notification", NotificationRoutes);
router.use("/colleague", ColleagueRoutes);
router.use("/message", MessageRoutes);
router.use("/scenario", ScenarioRoutes);
router.use("/github", GitHubRoutes);
router.use("/file", FileRoutes);

export default router;
