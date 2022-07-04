import express from "express";
import ColleagueController from "../controllers/ColleagueController";

const router = express();

router.get("/", (_, res) => {
    res.json({ message: "You are connected to backend colleague api" });
});
router.get("/:name", ColleagueController.getColleagueByName);

export default router;
