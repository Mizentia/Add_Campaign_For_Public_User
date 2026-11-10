// Bridge between the public portal server and NL Admin Studio / Cloud Firestore.
const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '..', 'data', 'pending-orders.json');
const FS_ORDERS_BASE = 'https://firestore.googleapis.com/v1/projects/metaaccountmanager/databases/(default)/documents/campaign_orders';
const TIMEOUT_MS = 6000;

function studioUrls() {
  const list = [process.env.ADMIN_STUDIO_URL, 'http://127.0.0.1:3001', 'http://localhost:3001', 'https://nl-admin-studio.vercel.app'];
  return [...new Set(list.filter(Boolean).map(u => u.replace(/\/+$/, '')))];
}

const toFsVal = (v) => typeof v === 'boolean' ? { booleanValue: v } : (typeof v === 'number' && Number.isFinite(v) ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : { stringValue: String(v ?? '') });
const fromFsFields = (f = {}) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, 'stringValue' in v ? v.stringValue : ('integerValue' in v ? Number(v.integerValue) : ('doubleValue' in v ? Number(v.doubleValue) : ('booleanValue' in v ? Boolean(v.booleanValue) : null)))]));

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
  if (data?.success) return data.order;
  try {
    const fields = Object.fromEntries(Object.entries(order).map(([k, v]) => [k, toFsVal(v)]));
    const fsRes = await fetch(`${FS_ORDERS_BASE}/${encodeURIComponent(order.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }), signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (fsRes.ok) return order;
  } catch (_) {}
  return null;
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
    for (const order of queue) { if (!(await forwardOrder(order))) remaining.push(order); }
    writeQueue(remaining);
  } finally { flushing = false; }
}

async function fetchStatuses(ids) {
  const queuedIds = new Set(readQueue().map(o => o.id)), remoteIds = ids.filter(id => !queuedIds.has(id)), statuses = {};
  ids.filter(id => queuedIds.has(id)).forEach(id => { statuses[id] = { found: true, status: 'pending', queued: true }; });
  if (!remoteIds.length) return { success: true, statuses };
  const data = await studioFetch(`/api/campaign-orders/status?ids=${encodeURIComponent(remoteIds.join(','))}`);
  if (data?.success) return { success: true, statuses: { ...data.statuses, ...statuses } };
  await Promise.all(remoteIds.slice(0, 20).map(async id => {
    try {
      const r = await fetch(`${FS_ORDERS_BASE}/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(3500) });
      if (r.ok) { const d = fromFsFields((await r.json()).fields); statuses[id] = { found: true, status: d.status || 'pending', publicNote: d.publicNote || '', updatedAt: d.updatedAt }; }
      else if (r.status === 404) statuses[id] = { found: false, status: 'deleted' };
    } catch (_) {}
  }));
  return { success: Object.keys(statuses).length > 0, statuses };
}

setInterval(() => { flushQueue().catch(() => {}); }, 30000).unref();

module.exports = { studioFetch, forwardOrder, queueOrder, flushQueue, fetchStatuses };
