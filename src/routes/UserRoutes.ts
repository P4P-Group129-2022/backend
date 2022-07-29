import express from "express";
import UserController from "../controllers/UserController";

const router = express();

router.get("/github/:gitHubUsername", UserController.getUserByGitHubUsername);
router.get("/email/:gitHubUsername", UserController.getUserByEmail);

export default router;