import express from "express";

const router = express();

router.get("/", (_, res) => {
  res.send("Git Actions");
});

export default router;
