import express from "express";
import { createUploadApp } from "../server/uploadthing.js";

const { app, port } = createUploadApp(express);
app.listen(Number(port), () => {
  console.log(`UploadThing server running on http://localhost:${port}`);
});
