import { getRouterManifest } from "@tanstack/react-start/router-manifest";
import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { createRouter } from './router';

/* allows us to know what routes and loaders we need to execute when the user hits a given route. */
export default createStartHandler({
    createRouter,
    getRouterManifest,
})(defaultStreamHandler)