import express from "express";
import GitActionController from "../controllers/GitActionsController";

const router = express();

router.get("/", (_, res) => {
  res.json({ message: "You are connected to backend git actions api" });
});
router.post("/init", GitActionController.initRepo);
router.get("/logs", GitActionController.getRepoCommitLogs);

export default router;
