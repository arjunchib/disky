import consola from "consola";
import Discord from "discord.js";

interface ClientOptions {
  prefix: string;
  token: string;
}

export class Client {
  options: ClientOptions;
  client: Discord.Client;
  listeners = new Map<string, (any) => void>();

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

  setListener(command: string, fn: (any) => void) {
    this.listeners.set(command, fn);
  }

  #onReady() {
    consola.info(`Logged in as ${this.client.user.tag}!`);
  }

  async #onMessage(msg) {
    if (!msg.content.startsWith(this.options.prefix)) return;
    const command = msg.content
      .replace(this.options.prefix, "")
      .trim()
      .split(" ")[0];
    if (this.listeners.has(command)) {
      return await this.listeners.get(command)({ msg });
    } else if (this.listeners.has("_default")) {
      return await this.listeners.get("_default")({ msg });
    }
  }
}
