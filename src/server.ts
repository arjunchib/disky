import { Client } from "./client";
import esbuild from "esbuild";
import path from "path";
import fs from "fs-extra";
import { fileToCommand, hash } from "./util";
import chokidar from "chokidar";
import { Logger } from "./logger";

interface ServerOptions {
  src?: string;
  watch?: boolean;
  logging?: boolean;
}

export class Server {
  src = "./src";
  watch = false;
  commandsDir: string;
  client: Client;
  entryPoints: string[];
  external: string[];
  entryPointCache = new Map<string, string>();
  builder: esbuild.BuildIncremental | undefined;
  logger: Logger | undefined;

  constructor(options: ServerOptions = {}) {
    if (options.src) this.src = options.src;
    if (options.watch) this.watch = options.watch;
    if (options.logging) this.logger = new Logger();
    this.commandsDir = path.join(this.src, "commands");
    this.#updateEntryPoints();
    this.#updateExternal();
  }

  async run() {
    if (!this.client) {
      this.client = new Client(await this.#fetchClientOptions(), this.logger);
    }
    this.builder = await this.#build(false);
    if (this.watch) this.#watch();
  }

  async #build(shouldLog = true) {
    this.#updateEntryPoints();
    this.#updateExternal();
    const build = await esbuild.build({
      entryPoints: this.entryPoints,
      format: "esm",
      outdir: ".disky/commands",
      bundle: true,
      external: this.external,
      incremental: true,
    });
    this.#updateCommands(shouldLog);
    return build;
  }

  #watch() {
    chokidar
      .watch(this.src, { ignoreInitial: true })
      .on("all", async (event, path) => {
        try {
          if (
            ["add", "unlink"].includes(event) &&
            path.startsWith("src/commands")
          ) {
            this.builder = await this.#build();
          } else {
            await this.builder.rebuild();
            this.#updateCommands();
          }
        } catch (e) {
          this.logger.error(e);
        }
      });
  }

  async #updateCommands(shouldLog = true) {
    const files = this.entryPoints.map((file) => {
      const basename = path.basename(file, ".ts");
      return path.join(process.cwd(), ".disky", "commands", `${basename}.js`);
    });
    const updatedCommands = [];
    for (const file of files) {
      const oldHash = this.entryPointCache.get(file);
      const newHash = hash(fs.readFileSync(file, "utf8"));
      if (oldHash !== newHash) {
        this.entryPointCache.set(file, newHash);
        const name = fileToCommand(file);
        const command = (await import(`${file}?=${Date.now()}`)).default;
        this.client?.setCommand(name, new command());
        updatedCommands.push(name);
      }
    }
    if (updatedCommands.length <= 0) return;
    this.client.updateSlashCommands();
    if (shouldLog) {
      this.logger.updateCommand(updatedCommands.join(", "));
    }
  }

  async #fetchClientOptions() {
    const optionsModule = await import(
      path.join(process.cwd(), "./diskyrc.js")
    );
    return optionsModule.default;
  }

  #updateEntryPoints() {
    this.entryPoints = fs
      .readdirSync(this.commandsDir)
      .map((file) => path.join(this.commandsDir, file));
  }

  #updateExternal() {
    const proj = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    const deps = Object.keys(proj.dependencies);
    const devDeps = Object.keys(proj.dependencies);
    this.external = [...deps, ...devDeps];
  }
}
