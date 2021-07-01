import esbuild from "esbuild";
import consola from "consola";
import crypto from "crypto";
import fs from "fs-extra";
import path from "path";
import { Client } from "./client";
import chokidar from "chokidar";

consola.wrapAll();
const commands = new Map<string, string>();
const client = new Client(await fetchOptions());

async function fetchOptions() {
  const optionsModule = await import(path.join(process.cwd(), "./diskyrc.js"));
  return optionsModule.default;
}

function hash(str: string) {
  return crypto.createHash("sha1").update(str).digest("hex");
}

function findEntryPoints() {
  const dir = path.join(process.cwd(), "src", "commands");
  return fs.readdirSync(dir).map((file) => path.join(dir, file));
}

function fileToCommand(file: string) {
  const ext = path.extname(file);
  return path.basename(file, ext);
}

async function findExternal() {
  const proj = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
  );
  const deps = Object.keys(proj.dependencies);
  const devDeps = Object.keys(proj.dependencies);
  return [...deps, ...devDeps];
}

async function updateCommands(entryPoints) {
  for (const file of entryPoints) {
    const command = fileToCommand(file);
    const content = fs.readFileSync(file, "utf8");
    const contentHash = hash(content);
    if (commands.get(command) !== contentHash) {
      commands.set(command, contentHash);
      const commandModule = await import(
        path.join(process.cwd(), ".disky", `${command}.js?t=${Date.now()}`)
      );
      client.setListener(command, commandModule.default.command);
    }
  }
}

const external = await findExternal();
async function build() {
  await fs.emptyDir(".disky");
  const entryPoints = await findEntryPoints();
  const build = await esbuild.build({
    entryPoints,
    format: "esm",
    outdir: ".disky",
    bundle: true,
    external,
    incremental: true,
  });
  await updateCommands(entryPoints);
  consola.success("Built!");
  return build;
}
let result = await build();

chokidar
  .watch("./src", { ignoreInitial: true })
  .on("all", async (event, path) => {
    if (["add", "unlink"].includes(event) && path.startsWith("src/commands/")) {
      result = await build();
    } else {
      await result.rebuild();
      consola.success("Rebuilt!");
    }
  });
