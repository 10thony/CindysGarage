import { createRouteHandler } from "uploadthing/server";
import { uploadRouter } from "./uploadthing-router.js";

export function createUploadApp(express: {
  (): { use: (fn: unknown) => void; listen: (port: number, cb: () => void) => void };
  json: () => (req: unknown, res: unknown, next: () => void) => void;
}) {
  const app = express();

  // CORS middleware for development
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Middleware
  app.use(express.json());

  // UploadThing route handler
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router: uploadRouter,
      config: {
        token: process.env.UPLOADTHING_TOKEN,
        logLevel: "info",
      },
    })
  );

  return { app, port: process.env.PORT || 3001 };
}
