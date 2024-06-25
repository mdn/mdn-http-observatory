#!/usr/bin/env node
import * as esbuild from "esbuild";
import { polyfillNode } from "esbuild-plugin-polyfill-node";
import path from "node:path";
import fs from "fs";

async function build() {
  const outputDir = "dist";
  const publicDir = "assets";
  const localeDir = "_locales";
  const popupEntry = "popup.js";
  const popupHtml = "popup.html";
  const backgroundEntry = "background.js";
  const manifest = "manifest.json";

  const plugins = [polyfillNode({})];
  const entryPoints = [
    path.resolve("src", popupEntry),
    path.resolve("src", backgroundEntry),
  ];

  await esbuild.build({
    entryPoints: entryPoints,
    plugins: plugins,
    outdir: outputDir,
    bundle: true,
    minify: false,
    external: ["deasync"],
    format: "esm",
    sourcemap: true,
  });
  await fs.promises.copyFile(
    path.resolve("src", popupHtml),
    path.resolve(outputDir, popupHtml)
  );
  await fs.promises.copyFile(
    path.resolve("src", manifest),
    path.resolve(outputDir, manifest)
  );
  await fs.promises.cp(publicDir, outputDir, { recursive: true });
  await fs.promises.cp(localeDir, path.resolve(outputDir, localeDir), {
    recursive: true,
  });
}

build().catch((err) => {
  console.log(err);
  process.exit(1);
});
