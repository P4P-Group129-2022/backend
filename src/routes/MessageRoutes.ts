import express from "express";
import MessageController from "../controllers/MessageController";

const router = express();

router.get("/", (_, res) => {
    res.json({ message: "You are connected to backend message api" });
});
router.get("/:nameId", MessageController.getMessageByNameId);

export default router;
