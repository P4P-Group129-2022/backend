import express from "express";
import UserController from "../controllers/UserController";

const router = express();

router.get("/:gitHubUsername", UserController.getUserByGitHubUsername);
router.post("/create", UserController.createUser);

export default router;