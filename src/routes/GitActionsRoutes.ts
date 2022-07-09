import express from "express";
import GitActionController from "../controllers/GitActionsController";

const router = express();

router.get("/", (_, res) => {
  res.json({ message: "You are connected to backend git actions api" });
});
router.post("/init", GitActionController.initRepo);
router.get("/logs", GitActionController.getRepoCommitLogs);
router.get("/status", GitActionController.getRepoStatus);
router.post("/stage", GitActionController.stageFile);
router.post("/stage-all", GitActionController.stageAllFiles);

export default router;
