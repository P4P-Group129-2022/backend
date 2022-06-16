import express from "express";
import Logger from "../utils/Logger";
import GitActionsRoutes from "./GitActionsRoutes";

const router = express();

router.use("/git", GitActionsRoutes);

export default router;
