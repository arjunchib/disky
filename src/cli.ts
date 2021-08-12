import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Server } from "./server";
import process from "process";

let server: Server;

async function onExit(signal) {
  if (server) await server.onExit(signal);
  process.kill(process.pid, signal);
  process.exit();
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
