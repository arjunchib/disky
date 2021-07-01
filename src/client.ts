import consola from "consola";
import Discord from "discord.js";

interface ClientOptions {
  prefix: string;
  token: string;
}

export class Client {
  client: Discord.Client;
  listeners = new Map<string, (any) => void>();

  constructor(options: ClientOptions) {
    this.client = new Discord.Client();
    this.client.on("ready", () => {
      this.#onReady();
    });
    this.client.on("message", async (msg) => {
      if (!msg.content.startsWith(options.prefix)) return;
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
    const fns = [...this.listeners.values()];
    return Promise.all(fns.map((fn) => fn({ msg })));
  }
}
