import express from "express";
import GitActionController from "../controllers/GitActionsController";

const router = express();

router.get("/", (_, res) => {
  res.json({ message: "You are connected to backend git actions api" });
});
router.post("/init", GitActionController.initRepo);
router.post("/add-remote", GitActionController.addRemote);
router.get("/status/:username", GitActionController.getRepoStatus);
router.post("/stage", GitActionController.stageFile);
router.post("/stage-all", GitActionController.stageAllFiles);
router.post("/stage-all-and-commit", GitActionController.stageAllAndCommit);
router.post("/commit", GitActionController.commit);
router.post("/push", GitActionController.push);

export default router;
