import { Client } from "./client";
import esbuild from "esbuild";
import path from "path";
import fs from "fs-extra";
import consola from "consola";
import { fileToCommand, hash } from "./util";
import chokidar from "chokidar";

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
    consola.wrapAll();
  }

  async run() {
    if (!this.client) {
      this.client = new Client(await this.#fetchClientOptions());
    }
    this.result = await this.#build();
    if (this.watch) {
      this.#watch();
    }
  }

  async #build() {
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
    this.#updateListeners();
    consola.success("Built!");
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
          this.#updateListeners();
          consola.success("Built!");
        }
      });
  }

  async #updateListeners() {
    for (const entryPoint of this.entryPoints) {
      const oldHash = this.entryPointCache.get(entryPoint);
      const newHash = hash(fs.readFileSync(entryPoint, "utf8"));
      if (oldHash !== newHash) {
        const command = fileToCommand(entryPoint);
        const listener = (
          await import(
            path.join(
              process.cwd(),
              ".disky",
              "commands",
              `${command}.js?=${Date.now()}`
            )
          )
        ).default.fn;
        this.client?.setListener(command, listener);
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
