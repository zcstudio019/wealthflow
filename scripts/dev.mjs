import { spawn } from "node:child_process";

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("无法定位 npm CLI");

const children = ["dev:backend", "dev:frontend"].map((script) =>
  spawn(process.execPath, [npmCli, "run", script], { stdio: "inherit", env: process.env }),
);

function stop(signal) {
  for (const child of children) child.kill(signal);
}
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

const exitCode = await Promise.race(children.map((child) => new Promise((resolve) => {
  child.once("exit", (code) => resolve(code ?? 1));
})));
stop("SIGTERM");
process.exit(Number(exitCode));