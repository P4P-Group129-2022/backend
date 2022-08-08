import express from "express";
import GitHubController from "../controllers/GitHubController";

const router = express();

router.get("/", (_, res) => {
    res.json({ message: "You are connected to backend github api" });
});
router.get("/invite/:username", GitHubController.inviteToOrganization);
router.put("/update", GitHubController.updateGitHubDetails);
router.get("/checkPR/:username/:pullNumber", GitHubController.checkPR);

export default router;
