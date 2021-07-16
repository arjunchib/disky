import { Client } from "./client";
import esbuild from "esbuild";
import path from "path";
import fs from "fs-extra";
import consola from "consola";
import { fileToCommand, hash } from "./util";
import chokidar from "chokidar";
import boxen from "boxen";
import { rainbow } from "./util";

interface ServerOptions {
  src?: string;
  watch?: boolean;
}

export class Server {
  src = "./src";
  watch = false;
  commandsDir: string;
  client: Client;
  entryPoints: string[];
  external: string[];
  entryPointCache = new Map<string, string>();
  result;

  constructor(options: ServerOptions = {}) {
    if (options.src) this.src = options.src;
    if (options.watch) this.watch = options.watch;
    this.commandsDir = path.join(this.src, "commands");
    this.#updateEntryPoints();
    this.#updateExternal();
  }

  async run() {
    this.#printBanner();
    consola.wrapAll();
    if (!this.client) {
      this.client = new Client(await this.#fetchClientOptions());
    }
    this.result = await this.#build(false);
    if (this.watch) {
      this.#watch();
    }
  }

  #printBanner() {
    process.stdout.write(
      boxen(rainbow(`Disky @ 0.0.0`), {
        padding: 1,
        margin: { top: 0, bottom: 2, left: 0, right: 0 },
        borderStyle: "round",
        borderColor: "#418be5",
      })
    );
  }

  async #build(shouldLog = true) {
    await this.#updateEntryPoints();
    await this.#updateExternal();
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
        if (
          ["add", "unlink"].includes(event) &&
          path.startsWith("src/commands")
        ) {
          this.result = await this.#build();
        } else {
          await this.result.rebuild();
          this.#updateCommands();
        }
      });
  }

  async #updateCommands(shouldLog = true) {
    for (const entryPoint of this.entryPoints) {
      const oldHash = this.entryPointCache.get(entryPoint);
      const newHash = hash(fs.readFileSync(entryPoint, "utf8"));
      if (oldHash !== newHash) {
        this.entryPointCache.set(entryPoint, newHash);
        const name = fileToCommand(entryPoint);
        const command = (
          await import(
            path.join(
              process.cwd(),
              ".disky",
              "commands",
              `${name}.js?=${Date.now()}`
            )
          )
        ).default;
        this.client?.setCommand(name, command);
        if (shouldLog) consola.success(`Updated ${name}`);
      }
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
