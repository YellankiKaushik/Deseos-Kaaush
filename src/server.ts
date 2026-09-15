import {
  createStartHandler,
  defaultStreamHandler,
  type RequestHandler,
} from "@tanstack/react-start/server";
import type { Register } from "@tanstack/react-router";

const fetch = createStartHandler(defaultStreamHandler);

type ServerEntry = { fetch: RequestHandler<Register> };

function createServerEntry(entry: ServerEntry): ServerEntry {
  return {
    async fetch(...args) {
      try {
        return await entry.fetch(...args);
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  };
}

export default createServerEntry({ fetch });
