import chalk from "chalk";

/**
 * Following codes have been copied from a previous project we've participated.
 * Permission to use the code excerpts is granted by the author.
 */
const info = (args: any) =>
  console.log(
    chalk.blue(`[${new Date().toLocaleString()}] [INFO]`),
    typeof args === "string" ? chalk.blueBright(args) : args
  );
const warning = (args: any) =>
  console.log(
    chalk.yellow(`[${new Date().toLocaleString()}] [WARN]`),
    typeof args === "string" ? chalk.yellowBright(args) : args
  );
const error = (args: any) =>
  console.log(
    chalk.red(`[${new Date().toLocaleString()}] [ERROR]`),
    typeof args === "string" ? chalk.redBright(args) : args
  );

export default { info, warning, error };
