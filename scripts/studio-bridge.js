// Bridge between the public portal server and NL Admin Studio.
// The public portal never keeps its own order database: orders are forwarded to the Studio.
// If the Studio is unreachable, orders wait in a small retry queue (data/pending-orders.json) until delivered.
const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '..', 'data', 'pending-orders.json');
const TIMEOUT_MS = 6000;

function studioUrls() {
  const list = [process.env.ADMIN_STUDIO_URL, 'http://127.0.0.1:3001', 'http://localhost:3001'];
  return [...new Set(list.filter(Boolean).map(u => u.replace(/\/+$/, '')))];
}

function readQueue() {
  try { return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8') || '[]'); } catch (_) { return []; }
}

function writeQueue(list) {
  try {
    fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true });
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(list.slice(-500), null, 2), 'utf8');
  } catch (_) {}
}

async function studioFetch(route, options = {}) {
  for (const base of studioUrls()) {
    try {
      const res = await fetch(`${base}${route}`, { ...options, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.ok) return await res.json();
    } catch (_) {}
  }
  return null;
}

async function forwardOrder(order) {
  const data = await studioFetch('/api/campaign-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Source': 'public-portal' },
    body: JSON.stringify(order)
  });
  return data?.success ? data.order : null;
}

function queueOrder(order) {
  const queue = readQueue().filter(o => o.id !== order.id);
  queue.push(order);
  writeQueue(queue);
}

let flushing = false;
async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const queue = readQueue();
    if (!queue.length) return;
    const remaining = [];
    for (const order of queue) {
      if (!(await forwardOrder(order))) remaining.push(order);
    }
    writeQueue(remaining);
  } finally { flushing = false; }
}

// Returns { success, statuses } — orders still waiting in the queue are reported as pending.
async function fetchStatuses(ids) {
  const queuedIds = new Set(readQueue().map(o => o.id));
  const remoteIds = ids.filter(id => !queuedIds.has(id));
  const statuses = {};
  ids.filter(id => queuedIds.has(id)).forEach(id => { statuses[id] = { found: true, status: 'pending', queued: true }; });
  if (!remoteIds.length) return { success: true, statuses };
  const data = await studioFetch(`/api/campaign-orders/status?ids=${encodeURIComponent(remoteIds.join(','))}`);
  if (!data?.success) return { success: false, statuses };
  return { success: true, statuses: { ...data.statuses, ...statuses } };
}

setInterval(() => { flushQueue().catch(() => {}); }, 30000).unref();

module.exports = { studioFetch, forwardOrder, queueOrder, flushQueue, fetchStatuses };
