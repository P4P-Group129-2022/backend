import express from "express";
import FileController from "../controllers/FileController";

const router = express();

router.get("/retrieve", FileController.retrieve);
router.post("/modify", FileController.modify);

export default router;
