import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

// Define the file router
export const uploadRouter = {
  imageUploader: f({ image: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(async () => {
      // Authentication can be added here if needed
      // For now, we'll allow uploads (can be restricted later)
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      // File uploaded successfully
      console.log("File uploaded:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;
