import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Server } from "./server.js";
import process from "process";
import fs from "fs";

fs.readFileSync(".env", "utf8")
  .split("\n")
  .map((line) => {
    const [name, variable] = line.split("=").map((str: string) => str.trim());
    process.env[name] = variable;
  });

let server: Server;

async function onExit(signal) {
  if (server) await server.onExit(signal);
  process.removeListener("SIGINT", onExit);
  process.removeListener("SIGTERM", onExit);
  process.kill(process.pid, signal);
}

process.on("SIGINT", onExit);
process.on("SIGTERM", onExit);

yargs(hideBin(process.argv))
  .command({
    command: "develop",
    aliases: ["$0"],
    describe: "Start the dev server",
    handler() {
      server = new Server({ watch: true, logging: true });
      server.run();
    },
  })
  .command({
    command: "serve",
    describe: "Start the server",
    handler() {
      server = new Server();
      server.run();
    },
  }).argv;
