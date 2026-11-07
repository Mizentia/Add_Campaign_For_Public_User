(function () {
  const VISITOR_KEY = 'nl_camp_visitor', ORDERS_KEY = 'nl_camp_orders';
  let ordersModalOpen = false, askClearConfirm = false, justClearedMsg = false, submitting = false, ctxRef = null;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const getVisitor = () => { try { return JSON.parse(localStorage.getItem(VISITOR_KEY) || 'null'); } catch (_) { return null; } };
  const saveVisitor = (v) => { try { localStorage.setItem(VISITOR_KEY, JSON.stringify(v)); } catch (_) {} return v; };
  const getOrders = () => { try { const a = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (_) { return []; } };
  const saveOrders = (list, skipBadge = false) => { try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); } catch (_) {} if (!skipBadge) window.OrderAnim?.updateBadge(list.length, false); };

  function formatBdTime(iso, lang = 'bn') {
    try { return iso ? new Date(iso).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; } catch (_) { return ''; }
  }

  function ensureEntryGate(onReady) {
    const gate = document.getElementById('entryGateModal'), form = document.getElementById('entryGateForm');
    const nameInp = document.getElementById('gateNameInput'), phoneInp = document.getElementById('gatePhoneInput'), errEl = document.getElementById('gateNameErr');
    const existing = getVisitor();
    if (existing?.name?.trim()) { gate?.classList.add('hidden'); return onReady?.(existing); }
    gate?.classList.remove('hidden'); setTimeout(() => nameInp?.focus(), 60);
    if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1'; nameInp?.addEventListener('input', () => errEl?.classList.remove('show'));
    form.addEventListener('submit', (e) => {
      e.preventDefault(); const name = String(nameInp?.value || '').trim();
      if (!name) { errEl?.classList.add('show'); nameInp?.focus(); return; }
      const rawPhone = ctxRef ? ctxRef.toEnNum(phoneInp?.value || '').trim() : String(phoneInp?.value || '').trim();
      const visitor = saveVisitor({ visitorId: existing?.visitorId || ('VIS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()), name, phone: rawPhone.replace(/[^+0-9]/g, ''), enteredAt: new Date().toISOString() });
      gate?.classList.add('hidden'); onReady?.(visitor);
    });
  }

  async function syncOrderStatuses() {
    const list = getOrders();
    if (!list.length) return list;
    const ids = list.map(o => o.id).filter(Boolean).slice(0, 60).join(',');
    let data = await fetch(`./api/order-status?ids=${encodeURIComponent(ids)}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
    if (!data?.success) data = await fetch(`http://localhost:3001/api/campaign-orders/status?ids=${encodeURIComponent(ids)}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
    if (!data?.success || !data.statuses) return list;
    let changed = false;
    const updated = list.map(o => {
      const st = data.statuses[o.id]; if (!st) return o;
      const nextStatus = st.found === false ? 'deleted' : (st.status || o.status || 'pending'), nextNote = typeof st.publicNote === 'string' ? st.publicNote : (o.publicNote || '');
      if (nextStatus !== o.status || nextNote !== (o.publicNote || '')) { changed = true; return { ...o, status: nextStatus, publicNote: nextNote, updatedAt: st.updatedAt || o.updatedAt }; }
      return o;
    });
    if (changed) { saveOrders(updated); if (ordersModalOpen) renderOrdersModal(); }
    return updated;
  }

  function renderOrdersModal() {
    if (!ctxRef) return;
    const { tr, toLocNum, getLang } = ctxRef, lang = getLang(), list = getOrders();
    ordersModalOpen = true;
    const clearBtn = list.length ? `<button type="button" id="clearLocalOrdersBtn" class="btn-clear-local">${tr('btn_clear_history')}</button>` : '';
    const toolbar = `<div class="orders-toolbar"><div class="orders-hint-bar"><span class="live-dot"></span><span>${tr('orders_local_hint')}</span></div>${clearBtn}</div>`;
    const confirmBox = (askClearConfirm && list.length) ? `<div class="clear-confirm-box"><div class="clear-confirm-title">${tr('clear_warn_title')}</div><div class="clear-confirm-desc">${tr('clear_warn_desc')}</div><div class="clear-confirm-actions"><button type="button" id="confirmClearNoBtn" class="btn-confirm-no">${tr('btn_clear_no')}</button><button type="button" id="confirmClearYesBtn" class="btn-confirm-yes">${tr('btn_clear_yes')}</button></div></div>` : '';
    const clearedToast = justClearedMsg ? `<div class="order-toast-banner">${tr('msg_history_cleared')}</div>` : '';
    if (!list.length) return ctxRef.showModal(`${tr('modal_orders_title')} (${toLocNum(0)})`, `${toolbar}${clearedToast}<p style="padding:14px 6px;text-align:center;color:var(--text-muted);">${tr('modal_empty')}</p>`);
    const cards = list.map(o => {
      const st = o.status || 'pending', sym = o.currencySymbol || '$', curr = o.currency || 'USD';
      const totalAmt = o.totalAmount ? `${esc(sym)}${toLocNum(o.totalAmount)} ${esc(curr)}` : `$${toLocNum(o.budgetUSD)}`;
      const bdtPart = curr !== 'BDT' && o.totalBDT ? ` (৳${toLocNum(Number(o.totalBDT).toLocaleString('en-IN'))})` : '';
      const phoneTxt = o.customerPhone ? esc(toLocNum(o.customerPhone)) : tr('lbl_no_phone');
      const noteHtml = o.publicNote ? `<div class="order-admin-note"><strong>${tr('lbl_admin_note')}</strong> ${esc(o.publicNote)}</div>` : '';
      return `<div class="order-pill ${st === 'deleted' ? 'is-deleted' : ''}"><div class="order-head-row"><strong>${esc(toLocNum(o.id))}</strong><span class="status-badge ${esc(st)}">${tr('status_' + st) || esc(st)}</span></div><div style="font-weight:700;">${esc(o.platform)} • ${totalAmt}${bdtPart} (${toLocNum(o.durationDays)} ${tr('lbl_days')})</div><div class="order-meta-row"><span>${tr('lbl_customer')} ${esc(o.customerName)} (${phoneTxt})</span><span>${formatBdTime(o.createdAt, lang)}</span></div><div class="order-status-desc">${tr('status_desc_' + st) || ''}</div>${noteHtml}</div>`;
    }).join('');
    ctxRef.showModal(`${tr('modal_orders_title')} (${list.length > 99 ? toLocNum('99+') : toLocNum(list.length)})`, `${toolbar}${confirmBox}<div id="ordersListWrap">${cards}</div>`);
    document.getElementById('clearLocalOrdersBtn')?.addEventListener('click', () => { askClearConfirm = !askClearConfirm; renderOrdersModal(); });
    document.getElementById('confirmClearNoBtn')?.addEventListener('click', () => { askClearConfirm = false; renderOrdersModal(); });
    document.getElementById('confirmClearYesBtn')?.addEventListener('click', () => { document.getElementById('ordersListWrap')?.classList.add('order-list-sweep'); setTimeout(() => { askClearConfirm = false; justClearedMsg = true; saveOrders([]); window.OrderAnim?.updateBadge(0, true); renderOrdersModal(); }, 340); });
  }

  async function submitInstantOrder({ platform, activeCurr, dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum, totalUsd }) {
    if (submitting) return;
    const rem = window.OrderAnim?.getRemainingSec?.() || 0;
    if (rem > 0) return window.OrderAnim?.showFloatingToast(ctxRef.tr('toast_cooldown_warn').replace('{s}', ctxRef.toLocNum(rem)), '', 1600);
    const visitor = getVisitor();
    if (!visitor?.name?.trim()) return ensureEntryGate(() => submitInstantOrder({ platform, activeCurr, dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum, totalUsd }));
    submitting = true;
    const btn = document.getElementById('submitBtn');
    if (btn) { btn.disabled = true; btn.classList.add('is-loading'); btn.textContent = ctxRef.tr('btn_submitting'); }
    const id = 'PUB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
    const payload = { id, visitorId: visitor.visitorId, customerName: visitor.name, customerPhone: visitor.phone || '', platform, currency: activeCurr.code, currencySymbol: activeCurr.sym, rate: activeCurr.rate, markupPercent: markupPct || 0, vatPercent: vatPct || 0, dailyBudget: dailyVal, totalAmount: totalCurr, baseBDT: baseBdt || totalBdtNum, totalBDT: totalBdtNum, budgetUSD: totalUsd, durationDays: days, status: 'pending', createdAt: new Date().toISOString(), lang: ctxRef?.getLang?.() || 'bn', source: 'public_portal', notes: `Currency: ${activeCurr.code} (${activeCurr.sym}${dailyVal}/day x ${days} days = ${activeCurr.sym}${totalCurr} | VAT: ${vatPct || 0}% | Markup: ${markupPct || 0}%)` };
    await new Promise(r => setTimeout(r, 480));
    const res = await fetch('./api/submit-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) })).catch(() => null);
    submitting = false;
    if (res?.status === 429) { window.OrderAnim?.markCooldownStart(res.body?.cooldownRemaining || 60); return; }
    if (!res || res.status >= 400) await fetch('http://localhost:3001/api/campaign-orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Source': 'public-portal' }, body: JSON.stringify(payload) }).catch(() => null);
    const localList = getOrders(), prevCount = localList.length;
    localList.unshift(payload); saveOrders(localList, true);
    window.OrderAnim?.markCooldownStart(60); window.OrderAnim?.playOrderSuccessSequence(id, prevCount, localList.length); syncOrderStatuses();
  }

  window.CampaignOrders = {
    init(ctx) { ctxRef = ctx; window.OrderAnim?.init(ctx); window.OrderAnim?.updateBadge(getOrders().length, false); ensureEntryGate(); syncOrderStatuses(); setInterval(() => { if (!document.hidden) syncOrderStatuses(); }, 4000); document.addEventListener('visibilitychange', () => { if (!document.hidden) syncOrderStatuses(); }); },
    openOrdersModal() { askClearConfirm = false; justClearedMsg = false; renderOrdersModal(); syncOrderStatuses(); },
    markModalClosed() { ordersModalOpen = false; askClearConfirm = false; justClearedMsg = false; },
    refreshIfOpen() { window.OrderAnim?.syncCooldownButton?.(); window.OrderAnim?.updateBadge(getOrders().length, false); if (ordersModalOpen) renderOrdersModal(); }, submitInstantOrder
  };
})();