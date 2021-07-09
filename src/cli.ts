import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Server } from "./server";

yargs(hideBin(process.argv))
  .command({
    command: "develop",
    aliases: ["$0"],
    describe: "Start the dev server",
    handler() {
      const server = new Server({ watch: true });
      server.run();
    },
  })
  .command({
    command: "serve",
    describe: "Start the server",
    handler() {
      const server = new Server({ watch: true });
      server.run();
    },
  }).argv;
