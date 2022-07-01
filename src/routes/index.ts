import express from "express";
import Logger from "../utils/Logger";
import GitActionsRoutes from "./GitActionsRoutes";
import NotificationRoutes from "./NotificationRoutes";

const router = express();

router.use("/git", GitActionsRoutes);
router.use("/notification", NotificationRoutes);

export default router;
