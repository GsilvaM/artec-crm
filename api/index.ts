import type { IncomingMessage, ServerResponse } from "node:http";
import type { FastifyInstance } from "fastify";
import { buildCrmServer } from "../server/bootstrap.js";

let appPromise: Promise<FastifyInstance> | null = null;

function getApp(): Promise<FastifyInstance> {
  appPromise ??= (async () => {
    const app = buildCrmServer();
    await app.ready();
    return app;
  })();

  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  app.server.emit("request", req, res);
}
