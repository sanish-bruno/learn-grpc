const { spawn } = require("node:child_process");
const path = require("node:path");

const SUPPORTED_MODES = ["insecure", "tls", "mtls"];

function parseMode() {
  const args = process.argv.slice(2);
  let mode = process.env.SERVER_MODE;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--mode" || arg === "-m") {
      mode = args[i + 1];
      i++;
    } else if (arg.startsWith("--mode=")) {
      mode = arg.slice("--mode=".length);
    } else if (SUPPORTED_MODES.includes(arg)) {
      mode = arg;
    }
  }

  mode = (mode || "tls").toLowerCase();

  if (!SUPPORTED_MODES.includes(mode)) {
    console.error(
      `Invalid mode "${mode}". Supported modes: ${SUPPORTED_MODES.join(", ")}`
    );
    process.exit(1);
  }

  return mode;
}

const mode = parseMode();
const rootDir = path.resolve(__dirname, "..");

const services = [
  { name: "grpc", script: "server.js", color: "\x1b[36m" },
  { name: "http", script: "http-server.js", color: "\x1b[35m" },
  { name: "ws", script: "ws-server.js", color: "\x1b[33m" },
];

const RESET = "\x1b[0m";
const children = [];
let shuttingDown = false;

function pipeOutput(child, label, color) {
  const prefix = `${color}[${label}]${RESET} `;
  const forward = (stream, target) => {
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) target.write(`${prefix}${line}\n`);
    });
    stream.on("end", () => {
      if (buffer) target.write(`${prefix}${buffer}\n`);
    });
  };
  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 200);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log(`Starting all servers in ${mode.toUpperCase()} mode...`);

for (const service of services) {
  const child = spawn(
    process.execPath,
    [path.join(rootDir, service.script), "--mode", mode],
    {
      cwd: rootDir,
      env: { ...process.env, SERVER_MODE: mode },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  pipeOutput(child, service.name, service.color);

  child.on("exit", (code, signal) => {
    console.log(
      `${service.color}[${service.name}]${RESET} exited (code=${code}, signal=${signal})`
    );
    if (!shuttingDown) shutdown(code ?? 1);
  });

  children.push(child);
}
