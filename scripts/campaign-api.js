const fs = require('fs');
const path = require('path');
const { parseJson } = require('./server-utils');
const { studioFetch, forwardOrder, queueOrder, flushQueue, fetchStatuses } = require('./studio-bridge');

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'campaign-settings.json');
const COOLDOWN_MS = 60 * 1000;
const rateLimitMap = new Map();

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  return res.end(JSON.stringify(body));
};
const str = (v, max = 160) => String(v ?? '').trim().slice(0, max);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function getClientKey(req, visitorId) {
  const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = fwd || req.socket?.remoteAddress || 'unknown';
  return `${ip}|${visitorId || 'anon'}`;
}

function checkRateLimit(req, visitorId) {
  const now = Date.now(), ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'ip';
  for (const [k, ts] of rateLimitMap.entries()) { if (now - ts > COOLDOWN_MS) rateLimitMap.delete(k); }
  const lastTs = Math.max(rateLimitMap.get(ip) || 0, visitorId ? (rateLimitMap.get(visitorId) || 0) : 0);
  if (now - lastTs < COOLDOWN_MS) return Math.ceil((COOLDOWN_MS - (now - lastTs)) / 1000);
  rateLimitMap.set(ip, now);
  if (visitorId) rateLimitMap.set(visitorId, now);
  return 0;
}

async function handleOrderSubmission(req, res) {
  const body = await parseJson(req);
  const customerName = str(body.customerName, 80), visitorId = str(body.visitorId, 60);
  if (!customerName || !body.platform) return sendJson(res, 400, { success: false, error: 'Missing required fields' });
  const waitSec = checkRateLimit(req, visitorId);
  if (waitSec > 0) return sendJson(res, 429, { success: false, error: 'Cooldown active', cooldownRemaining: waitSec });

  const order = {
    id: /^PUB-[A-Z0-9-]{4,36}$/.test(String(body.id || '')) ? body.id : 'PUB-' + Date.now().toString(36).toUpperCase(),
    customerName,
    customerPhone: str(body.customerPhone, 30).replace(/[^+0-9]/g, ''),
    visitorId,
    platform: str(body.platform, 40),
    targetAudience: 'General Audience',
    currency: str(body.currency, 6), currencySymbol: str(body.currencySymbol, 6), rate: num(body.rate),
    markupPercent: num(body.markupPercent), vatPercent: num(body.vatPercent),
    dailyBudget: num(body.dailyBudget), totalAmount: num(body.totalAmount), baseBDT: num(body.baseBDT), totalBDT: num(body.totalBDT),
    budgetUSD: num(body.budgetUSD) || 10,
    durationDays: num(body.durationDays) || 4,
    pageOrPostUrl: '',
    notes: str(body.notes, 300),
    userAgent: str(req.headers['user-agent'], 200),
    lang: str(body.lang, 4),
    createdAt: str(body.createdAt, 40) || new Date().toISOString(),
    source: 'public_portal'
  };
  const saved = await forwardOrder(order);
  if (saved) {
    flushQueue().catch(() => {});
    return sendJson(res, 200, { success: true, synced: true, cooldownSec: 60, order: { ...order, ...saved } });
  }
  queueOrder(order);
  return sendJson(res, 200, { success: true, synced: false, queued: true, cooldownSec: 60, order: { ...order, status: 'pending' } });
}

async function handleOrderStatus(req, res) {
  const query = new URL(req.url, 'http://localhost').searchParams;
  const ids = String(query.get('ids') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 60);
  if (!ids.length) return sendJson(res, 200, { success: true, statuses: {} });
  const result = await fetchStatuses(ids);
  return sendJson(res, 200, { ...result, checkedAt: new Date().toISOString() });
}

async function handleGetSettings(req, res) {
  let settings = null;
  try { if (fs.existsSync(SETTINGS_FILE)) settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (_) {}
  if (!settings) {
    const remote = await studioFetch('/api/campaign-settings');
    if (remote?.settings) settings = remote.settings;
  }
  return sendJson(res, 200, { success: true, settings: settings || {} });
}

module.exports = { handleOrderSubmission, handleOrderStatus, handleGetSettings };
