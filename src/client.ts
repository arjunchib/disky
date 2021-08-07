import Discord, { BitFieldResolvable } from "discord.js";
import { help } from "./help";
import type { Command, CommandContext } from "./command";
import { Logger } from "./logger";

export interface ClientOptions {
  prefix: string;
  token: string;
  intents: BitFieldResolvable<any>;
}

export class Client {
  options: ClientOptions;
  client: Discord.Client;
  commands = new Map<string, Command>();
  logger: Logger | undefined;

  constructor(options: ClientOptions, logger: Logger | undefined) {
    this.options = options;
    this.logger = logger;
    this.client = new Discord.Client({
      ws: { intents: ["GUILDS", "GUILD_MESSAGES", ...options.intents] },
    });
    this.client.on("ready", async () => {
      this.#onReady();
    });
    this.client.on("message", async (msg) => {
      await this.#onMessage(msg);
    });
    this.client.login(options.token);
    this.client
      .generateInvite({ permissions: ["SEND_MESSAGES"] })
      .then((invite) => this.logger?.banner(invite));
  }

  setCommand(name: string, command: Command) {
    this.commands.set(name, command);
  }

  #onReady() {
    this.logger.ready();
  }

  async #onMessage(msg) {
    if (!msg.content.startsWith(this.options.prefix)) return;
    const name = msg.content
      .replace(this.options.prefix, "")
      .trim()
      .split(" ")[0];
    const context: CommandContext = {
      msg,
      client: this.client,
      prefix: this.options.prefix,
    };
    try {
      this.logger?.runCommand(name);
      if (this.commands.has(name)) {
        return await this.commands.get(name).run(context);
      } else if (name === "help") {
        return help(context, this.commands);
      } else if (this.commands.has("_default")) {
        return await this.commands.get("_default").run(context);
      }
    } catch (e) {
      console.error(e);
    }
  }
}
