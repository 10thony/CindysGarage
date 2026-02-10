import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";
import type { OurFileRouter } from "./uploadthing-router";

// Configure UploadThing URL
// In development, use the proxy URL
// In production, this will use the Netlify function URL
const uploadthingUrl = "/api/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: uploadthingUrl,
});

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: uploadthingUrl,
});

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>({
    url: uploadthingUrl,
  });
