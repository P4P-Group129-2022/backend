import express from "express";
import ScenarioController from "../controllers/ScenarioController";

const router = express();

router.get("/", (_, res) => {
    res.json({ message: "You are connected to backend scenario api" });
});
router.get("/:nameId", ScenarioController.getScenarioByNameId);

export default router;