const express = require("express");
const uploadRoutes = require("./route/upload");
const imageRoutes = require("./route/images");
const deleteRoutes = require("./route/delete");
const copyRoutes = require("./route/copy"); 
const videoRoutes = require("./route/video");

const app = express();

app.use("/upload", uploadRoutes);
app.use("/image", imageRoutes);
app.use("/delete", deleteRoutes);
app.use("/copy", copyRoutes); 
app.use("/video", videoRoutes);

const PORT = process.env.PORT || 11000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
