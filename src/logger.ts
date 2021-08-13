import readline from "readline";
import chalk from "chalk";
import { rainbow } from "./util/index.js";

export class Logger {
  lastMsg: string | undefined = undefined;
  repeatCount = 1;
  dirty = false;

  runCommand(cmd) {
    this.clearScreen();
    this.write("running", cmd, chalk.magenta);
  }

  updateCommand(cmd) {
    this.clearScreen();
    this.write("command update", cmd, chalk.green);
  }

  banner(invite) {
    if (this.dirty) return;
    this.clearScreen();
    const uptime = Math.ceil(process.uptime() * 1000);
    console.log(`
  ${rainbow(`Disky @ 0.0.0`)}

  > Invite bot with:
  > ${invite}
  
  ${chalk.cyan(`Ready in ${uptime}ms.`)}
`);
  }

  error(e) {
    this.clearScreen();
    this.write("error", "", chalk.redBright);
    console.error(e);
  }

  private clearScreen() {
    const repeatCount = process.stdout.rows - 2;
    const blank = repeatCount > 0 ? "\n".repeat(repeatCount) : "";
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }

  private write(primary, secondary, color) {
    this.dirty = true;
    const time = chalk.dim(new Date().toLocaleTimeString());
    const framework = chalk.cyan("[disky]");
    const msg = `${color(primary)} ${chalk.dim(secondary)}`;
    const line = [time, framework, msg];
    this.updateRepeatCount(msg);
    if (this.repeatCount >= 2) {
      line.push(chalk.yellow(`(x${this.repeatCount})`));
    }
    console.log(line.join(" "));
  }

  private updateRepeatCount(msg) {
    if (this.lastMsg === msg) {
      this.repeatCount += 1;
    } else {
      this.repeatCount = 1;
    }
    this.lastMsg = msg;
  }
}
