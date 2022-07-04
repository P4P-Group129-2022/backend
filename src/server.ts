import express from "express";
import routes from "./routes";
import Logger from "./utils/Logger";
import mongoose from "mongoose";
import {config} from "./config/config";

const app = express();
const port = process.env.PORT || 8080;

/** Connect to Mongo */
mongoose
    .connect(config.mongo.url, {retryWrites: true, w: 'majority'})
    .then(() => {
        Logger.info('Mongo DB connected successfully.');
        StartServer();
    })
    .catch((error) => Logger.error(error));

/** Only Start Server if Mongoose Connects */
const StartServer = () => {
    /** Log the request */
    app.use((req, res, next) => {
        /** Log the req as it arrives */
        Logger.info(
            `Incoming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`
        );

        res.on("finish", () => {
            /** Log the res when it finishes */
            Logger.info(
                `Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`
            );
        });

        next();
    });

    /** Rules of our API */
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );

        if (req.method == "OPTIONS") {
            res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
            return res.status(200).json({});
        }

        next();
    });

    /** Routes */
    app.use("/api", routes);

    /** Health check */
    app.get("/ping", (_, res) => res.status(200).send("pong"));

    /** Error Handling */
    app.use((_, res) => {
        const error = new Error("Not found");

        Logger.error(error);
        res.status(404).json({
            message: error.message,
        });
    });

// Start server
    app.listen(port, () => Logger.info(`Server is running on port ${port}`));
};