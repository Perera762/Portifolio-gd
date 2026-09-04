import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

let writeQueue = Promise.resolve();

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(MESSAGES_FILE);
  } catch {
    await fs.writeFile(MESSAGES_FILE, "[]\n", "utf8");
  }
}

async function readMessages() {
  await ensureStore();
  const raw = await fs.readFile(MESSAGES_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeMessages(messages) {
  await ensureStore();
  const payload = `${JSON.stringify(messages, null, 2)}\n`;
  const tmp = `${MESSAGES_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, payload, "utf8");
  await fs.rename(tmp, MESSAGES_FILE);
}

export function enqueueWrite(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export async function addMessage(entry) {
  return enqueueWrite(async () => {
    const messages = await readMessages();
    messages.push(entry);
    await writeMessages(messages);
    return entry;
  });
}

export async function listMessages() {
  const messages = await readMessages();
  return messages.map(({ ip, userAgent, ...safe }) => safe);
}

export async function stats() {
  const messages = await readMessages();
  const byStatus = messages.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  return {
    total: messages.length,
    byStatus,
    lastReceivedAt: messages.at(-1)?.createdAt ?? null,
  };
}
