/**
 * Remotion configuration for video generation
 * @see https://www.remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";
import path from "path";

Config.setConcurrency(1);
Config.setVideoImageFormat("png");
Config.setOverwriteOutput(true);

// Set the public directory to backend/ directory
// This is where the videos/ folder is located
const publicDir =
  "/Users/cpuser/Cherrypicks/Source/elmtree-askmo/hyperion/backend";
Config.setPublicDir(publicDir);

console.log("Remotion public directory set to:", publicDir);
