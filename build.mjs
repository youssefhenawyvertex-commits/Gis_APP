import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("index.html", "dist/index.html");
await cp("rejection-alert.mp3", "dist/rejection-alert.mp3");

console.log("Static site prepared in dist/");
