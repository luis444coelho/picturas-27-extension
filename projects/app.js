var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose");

const { router: projectsRouter, process_msg } = require("./routes/projects");
const videosRouter = require("./routes/videos");
const videoVisualRouter = require("./routes/videoVisual");
const videoCompositionRouter = require("./routes/videoComposition");

// Run Docker
const mongoDB = "mongodb://projects_mongoDB:27018/project";

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Error connecting to Mongodb"));
db.once("open", () => {
  console.log("Mongodb connection successful");
});

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
// Only visual video previews accept a bounded JPEG frame in JSON.
for (const suffix of ["preview", "watermark-preview", "chain/watermark-preview"])
  app.use(`/:user/:project/videos/:video/${suffix}`, express.json({ limit: "3mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", videoVisualRouter);
app.use("/", videoCompositionRouter);
app.use("/", videosRouter);
app.use("/", projectsRouter);

// Start the message processing
process_msg();
require("./video").start();
require("./video/taskModule").start();
require("./video/watermarkCleanup").start();

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).jsonp(err);
});

module.exports = app;
