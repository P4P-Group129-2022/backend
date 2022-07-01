import express from "express";
import NotificationController from "../controllers/NotificationController";

const router = express();

router.get("/", (_, res) => {
    res.json({ message: "You are connected to backend notification api" });
});
router.get("/:name", NotificationController.getNotificationByName);

export default router;
