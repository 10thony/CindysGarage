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

// Netlify Function handler
import { createRouteHandler } from "uploadthing/server";

const routeHandler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
    logLevel: "info",
  },
});

export const handler = async (event: any, context: any) => {
  // Convert Netlify event to standard request/response
  const url = new URL(event.rawUrl || `https://${event.headers.host}${event.path}`);
  const request = new Request(url, {
    method: event.httpMethod,
    headers: new Headers(event.headers),
    body: event.body ? event.body : undefined,
  });

  const response = await routeHandler(request);
  
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: await response.text(),
  };
};
