import express from "express";
// import routes from "./routes";
import Logger from "./utils/Logger";

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// app.use("/", routes);

app.listen(port, () => {
  Logger.info(`Server is running on port ${port}`);
});
