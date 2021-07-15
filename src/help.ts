import { CommandContext } from "./command";

export function help({ msg, prefix }: CommandContext, commands) {
  const lines = [];
  commands.forEach((command) => {
    let line = `**${prefix}${command.usage}** - ${command.description}`;
    if (command.example) {
      line += ` *(ex. ${prefix}${command.example})*`;
    }
    lines.push(line);
  });
  msg.channel.send(`\n${lines.join("\n")}`);
}
