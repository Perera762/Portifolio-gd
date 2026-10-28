import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const DATA_DIR = isServerless ? "/tmp" : path.resolve(__dirname, "../data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");

const inMemoryMessages = [];
let writeQueue = Promise.resolve();

async function ensureStore() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(MESSAGES_FILE);
  } catch {
    try {
      await fs.writeFile(MESSAGES_FILE, "[]\n", "utf8");
    } catch (err) {
      // In read-only or restricted environments, suppress write failure
    }
  }
}

async function readMessages() {
  try {
    await ensureStore();
    const raw = await fs.readFile(MESSAGES_FILE, "utf8");
    const parsed = JSON.parse(raw);
    const diskList = Array.isArray(parsed) ? parsed : [];
    const seen = new Set(diskList.map((m) => m.id));
    return [...diskList, ...inMemoryMessages.filter((m) => !seen.has(m.id))];
  } catch {
    return [...inMemoryMessages];
  }
}

async function writeMessages(messages) {
  try {
    await ensureStore();
    const payload = `${JSON.stringify(messages, null, 2)}\n`;
    const tmp = `${MESSAGES_FILE}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, payload, "utf8");
    await fs.rename(tmp, MESSAGES_FILE);
  } catch (err) {
    console.warn("[store] Falha ao persistir em disco (ambiente read-only / serverless):", err.message);
  }
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
    inMemoryMessages.push(entry);
    const messages = await readMessages();
    if (!messages.some((m) => m.id === entry.id)) {
      messages.push(entry);
    }
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

