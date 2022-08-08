import express from "express";
import ScenarioController from "../controllers/ScenarioController";

const router = express();

router.get("/", ScenarioController.getScenarios);
router.get("/:nameId", ScenarioController.getScenarioByNameId);

export default router;