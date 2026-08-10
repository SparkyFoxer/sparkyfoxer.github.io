import gameWorker from "./index.js";
import { handleMusicRequest, updateMusicHistory } from "./music.js";
import { handleArtwork } from "./artwork.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/artwork") {
      return handleArtwork(request, ctx);
    }

    if (url.pathname === "/music-history" || url.pathname === "/music-history/import") {
      return handleMusicRequest(request, env);
    }

    return gameWorker.fetch(request, env, ctx);
  },

  async scheduled(controller, env, ctx) {
    gameWorker.scheduled(controller, env, ctx);
    ctx.waitUntil(updateMusicHistory(env, controller.scheduledTime));
  }
};
