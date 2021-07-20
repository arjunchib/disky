import { Command, CommandContext } from "./command";

export function help(
  { msg, prefix }: CommandContext,
  commands: Map<string, Command>
) {
  const lines = [];
  commands.forEach((command) => {
    let line = `**${prefix}${command.meta?.usage}** - ${command.meta?.description}`;
    if (command.meta?.example) {
      line += ` *(ex. ${prefix}${command.meta.example})*`;
    }
    lines.push(line);
  });
  msg.channel.send(`\n${lines.join("\n")}`);
}
