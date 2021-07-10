import consola from "consola";
import Discord from "discord.js";
import { help } from "./help";
import type { Command, CommandContext } from "./command";

interface ClientOptions {
  prefix: string;
  token: string;
}

export class Client {
  options: ClientOptions;
  client: Discord.Client;
  commands = new Map<string, Command>();

  constructor(options: ClientOptions) {
    this.options = options;
    this.client = new Discord.Client();
    this.client.on("ready", () => {
      this.#onReady();
    });
    this.client.on("message", async (msg) => {
      await this.#onMessage(msg);
    });
    this.client.login(options.token);
  }

  setCommand(name: string, command: Command) {
    this.commands.set(name, command);
  }

  #onReady() {
    consola.info(`Logged in as ${this.client.user?.tag}!`);
  }

  async #onMessage(msg) {
    if (!msg.content.startsWith(this.options.prefix)) return;
    const name = msg.content
      .replace(this.options.prefix, "")
      .trim()
      .split(" ")[0];
    const context: CommandContext = { msg, client: this.client };
    if (this.commands.has(name)) {
      return await this.commands.get(name).fn(context);
    } else if (name === "help") {
      return help(context, this.commands);
    } else if (this.commands.has("_default")) {
      return await this.commands.get("_default").fn(context);
    }
  }
}
