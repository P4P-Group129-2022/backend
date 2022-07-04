import express from "express";
import Logger from "../utils/Logger";
import GitActionsRoutes from "./GitActionsRoutes";
import NotificationRoutes from "./NotificationRoutes";
import ColleagueRoutes from "./ColleagueRoutes";

const router = express();

router.use("/git", GitActionsRoutes);
router.use("/notification", NotificationRoutes);
router.use("/colleague", ColleagueRoutes)

export default router;
