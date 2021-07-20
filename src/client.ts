import consola from "consola";
import Discord, { BitFieldResolvable } from "discord.js";
import { help } from "./help";
import type { Command, CommandContext } from "./command";

export interface ClientOptions {
  prefix: string;
  token: string;
  intents: BitFieldResolvable<any>;
}

export class Client {
  options: ClientOptions;
  client: Discord.Client;
  commands = new Map<string, Command>();

  constructor(options: ClientOptions) {
    this.options = options;
    this.client = new Discord.Client({
      ws: { intents: ["GUILDS", "GUILD_MESSAGES", ...options.intents] },
    });
    this.client.on("ready", async () => {
      await this.#onReady();
    });
    this.client.on("message", async (msg) => {
      await this.#onMessage(msg);
    });
    this.client.login(options.token);
  }

  setCommand(name: string, command: Command) {
    this.commands.set(name, command);
  }

  async #onReady() {
    const invite = await this.client.generateInvite({
      permissions: ["SEND_MESSAGES"],
    });
    consola.info(`Invite: ${invite}`);
    consola.success(`Logged in as ${this.client.user?.tag}!`);
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
      if (this.commands.has(name)) {
        return await this.commands.get(name).run(context);
      } else if (name === "help") {
        return help(context, this.commands);
      } else if (this.commands.has("_default")) {
        return await this.commands.get("_default").run(context);
      }
    } catch (e) {
      consola.error(e);
    }
  }
}
