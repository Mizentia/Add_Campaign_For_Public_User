(function () {
  const VISITOR_KEY = 'nl_camp_visitor', ORDERS_KEY = 'nl_camp_orders';
  let ordersModalOpen = false, askClearConfirm = false, justClearedMsg = false, submitting = false, ctxRef = null;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const getVisitor = () => { try { return JSON.parse(localStorage.getItem(VISITOR_KEY) || 'null'); } catch (_) { return null; } };
  const saveVisitor = (v) => { try { localStorage.setItem(VISITOR_KEY, JSON.stringify(v)); } catch (_) {} return v; };
  const getOrders = () => { try { const a = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (_) { return []; } };
  const saveOrders = (list, skipBadge = false) => { try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); } catch (_) {} if (!skipBadge) window.OrderAnim?.updateBadge(list.length, false); };

  const formatBdTime = (iso, lang = 'bn') => { try { return iso ? new Date(iso).toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''; } catch (_) { return ''; } };

  function ensureEntryGate(onReady, forceEdit = false) {
    const gate = document.getElementById('entryGateModal'), form = document.getElementById('entryGateForm'), cancelBtn = document.getElementById('gateCancelBtn');
    const nameInp = document.getElementById('gateNameInput'), phoneInp = document.getElementById('gatePhoneInput'), errEl = document.getElementById('gateNameErr');
    const titleEl = document.getElementById('gateModalTitle'), subBtn = document.getElementById('gateSubmitBtn'), existing = getVisitor();
    if (!forceEdit && existing?.name?.trim()) { gate?.classList.add('hidden'); return onReady?.(existing); }
    if (ctxRef) { if (titleEl) titleEl.textContent = ctxRef.tr(existing?.name ? 'gate_edit_title' : 'gate_title'); if (subBtn) subBtn.textContent = ctxRef.tr(existing?.name ? 'btn_save_profile' : 'btn_enter_portal'); }
    if (nameInp) nameInp.value = existing?.name || ''; if (phoneInp) phoneInp.value = existing?.phone ? (ctxRef ? ctxRef.toLocNum(existing.phone) : existing.phone) : '';
    cancelBtn?.classList.toggle('hidden', !existing?.name?.trim()); errEl?.classList.remove('show'); gate?.classList.remove('hidden'); setTimeout(() => nameInp?.focus(), 60);
    if (form) form._onReady = onReady; if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1'; nameInp?.addEventListener('input', () => errEl?.classList.remove('show'));
    cancelBtn?.addEventListener('click', () => { if (getVisitor()?.name?.trim()) gate?.classList.add('hidden'); });
    form.addEventListener('submit', (e) => {
      e.preventDefault(); const cur = getVisitor(), name = String(nameInp?.value || '').trim();
      if (!name) { errEl?.classList.add('show'); nameInp?.focus(); return; }
      const rawPhone = ctxRef ? ctxRef.toEnNum(phoneInp?.value || '').trim() : String(phoneInp?.value || '').trim();
      const visitor = saveVisitor({ visitorId: cur?.visitorId || ('VIS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()), name, phone: rawPhone.replace(/[^+0-9]/g, ''), enteredAt: cur?.enteredAt || new Date().toISOString() });
      gate?.classList.add('hidden'); if (ordersModalOpen) renderOrdersModal(); form._onReady?.(visitor); form._onReady = null;
    });
  }
  async function syncOrderStatuses() {
    const list = getOrders(); if (!list.length) return list;
    const ids = list.map(o => o.id).filter(Boolean).slice(0, 60).join(',');
    let data = await fetch(`./api/order-status?ids=${encodeURIComponent(ids)}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null);
    if (!data?.success) data = await window.cloudFetchStatuses?.(ids); if (!data?.success || !data.statuses) return list;
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
    const { tr, toLocNum, getLang } = ctxRef, lang = getLang(), list = getOrders(), vis = getVisitor(); ordersModalOpen = true;
    const editBtn = `<button type="button" id="editVisitorModalBtn" class="btn-edit-profile">${tr('btn_profile_edit')}</button>`, clearBtn = list.length ? `<button type="button" id="clearLocalOrdersBtn" class="btn-clear-local">${tr('btn_clear_history')}</button>` : '';
    const toolbar = `<div class="orders-toolbar"><div class="orders-hint-bar"><span class="live-dot"></span><span>${tr('orders_local_hint')}</span></div><div class="orders-toolbar-btns">${editBtn}${clearBtn}</div></div>`;
    const confirmBox = (askClearConfirm && list.length) ? `<div class="clear-confirm-box"><div class="clear-confirm-title">${tr('clear_warn_title')}</div><div class="clear-confirm-desc">${tr('clear_warn_desc')}</div><div class="clear-confirm-actions"><button type="button" id="confirmClearNoBtn" class="btn-confirm-no">${tr('btn_clear_no')}</button><button type="button" id="confirmClearYesBtn" class="btn-confirm-yes">${tr('btn_clear_yes')}</button></div></div>` : '';
    const clearedToast = justClearedMsg ? `<div class="order-toast-banner">${tr('msg_history_cleared')}</div>` : '';
    const cards = list.map(o => {
      const st = o.status || 'pending', sym = o.currencySymbol || '$', curr = o.currency || 'USD', dailyTxt = o.dailyBudget ? `${esc(sym)}${toLocNum(o.dailyBudget)} × ${toLocNum(o.durationDays)} ${tr('lbl_days')} = ` : '';
      const totalAmt = o.totalAmount ? `${esc(sym)}${toLocNum(o.totalAmount)} ${esc(curr)}` : `$${toLocNum(o.budgetUSD)}`, bdtPart = curr !== 'BDT' && o.totalBDT ? ` (৳${toLocNum(Number(o.totalBDT).toLocaleString('en-IN'))})` : '';
      const phoneRaw = o.customerPhone || vis?.phone || '', phoneTxt = phoneRaw ? esc(toLocNum(phoneRaw)) : tr('lbl_no_phone');
      const linkHtml = o.pageOrPostUrl ? `<div class="order-link-row"><strong>${tr('lbl_post_link')}</strong> <span>${esc(o.pageOrPostUrl)}</span></div>` : '', noteHtml = o.publicNote ? `<div class="order-admin-note"><strong>${tr('lbl_admin_note')}</strong> ${esc(o.publicNote)}</div>` : '';
      const waMsg = `Hello Noksha Lab, Order ID: ${o.id} | Platform: ${o.platform} | Total: ${sym}${o.totalAmount || o.budgetUSD} ${curr} (৳${o.totalBDT || ''}) | Name: ${o.customerName}`;
      return `<div class="order-pill ${st === 'deleted' ? 'is-deleted' : ''}"><div class="order-head-row"><div class="order-id-wrap"><strong>${esc(o.id)}</strong><button type="button" class="btn-copy-id" data-copy="${esc(o.id)}">${tr('btn_copy_id')}</button></div><span class="status-badge ${esc(st)}">${tr('status_' + st) || esc(st)}</span></div><div style="font-weight:700;">${esc(o.platform)} • ${dailyTxt}${totalAmt}${bdtPart}</div>${linkHtml}<div class="order-meta-row"><span>${tr('lbl_customer')} ${esc(o.customerName)} (${phoneTxt}) • ${formatBdTime(o.createdAt, lang)}</span><a class="help-wa-chip" href="https://wa.me/8801703582125?text=${encodeURIComponent(waMsg)}" target="_blank" rel="noopener">${tr('btn_wa_confirm')}</a></div><div class="order-status-desc">${tr('status_desc_' + st) || ''}</div>${noteHtml}</div>`;
    }).join('');
    const emptyHtml = `<p style="padding:14px 6px;text-align:center;color:var(--text-muted);">${tr('modal_empty')}</p>`;
    ctxRef.showModal(`${tr('modal_orders_title')} (${list.length > 99 ? toLocNum('99+') : toLocNum(list.length)})`, `${toolbar}${clearedToast}${confirmBox}${list.length ? `<div id="ordersListWrap">${cards}</div>` : emptyHtml}`);
    document.getElementById('editVisitorModalBtn')?.addEventListener('click', () => ensureEntryGate(null, true));
    document.getElementById('clearLocalOrdersBtn')?.addEventListener('click', () => { askClearConfirm = !askClearConfirm; renderOrdersModal(); });
    document.getElementById('confirmClearNoBtn')?.addEventListener('click', () => { askClearConfirm = false; renderOrdersModal(); });
    document.getElementById('confirmClearYesBtn')?.addEventListener('click', () => { document.getElementById('ordersListWrap')?.classList.add('order-list-sweep'); setTimeout(() => { askClearConfirm = false; justClearedMsg = true; saveOrders([]); window.OrderAnim?.updateBadge(0, true); renderOrdersModal(); }, 340); });
    document.querySelectorAll('.btn-copy-id').forEach(b => b.addEventListener('click', () => { navigator.clipboard?.writeText(b.dataset.copy || ''); b.textContent = tr('btn_copied'); setTimeout(() => { b.textContent = tr('btn_copy_id'); }, 1500); }));
  }
  async function submitInstantOrder({ platform, activeCurr, dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum, totalUsd, pageOrPostUrl }) {
    if (submitting) return;
    const rem = window.OrderAnim?.getRemainingSec?.() || 0;
    if (rem > 0) return window.OrderAnim?.showFloatingToast(ctxRef.tr('toast_cooldown_warn').replace('{s}', ctxRef.toLocNum(rem)), '', 1600);
    const visitor = getVisitor();
    if (!visitor?.name?.trim()) return ensureEntryGate(() => submitInstantOrder({ platform, activeCurr, dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum, totalUsd, pageOrPostUrl }));
    submitting = true; const btn = document.getElementById('submitBtn'), cleanLink = String(pageOrPostUrl || '').trim();
    if (btn) { btn.disabled = true; btn.classList.add('is-loading'); btn.textContent = ctxRef.tr('btn_submitting'); }
    const id = 'PUB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase();
    const payload = { id, visitorId: visitor.visitorId, customerName: visitor.name, customerPhone: visitor.phone || '', platform, currency: activeCurr.code, currencySymbol: activeCurr.sym, rate: activeCurr.rate, markupPercent: markupPct || 0, vatPercent: vatPct || 0, dailyBudget: dailyVal, totalAmount: totalCurr, baseBDT: baseBdt || totalBdtNum, totalBDT: totalBdtNum, budgetUSD: totalUsd, durationDays: days, pageOrPostUrl: cleanLink, status: 'pending', createdAt: new Date().toISOString(), lang: ctxRef?.getLang?.() || 'bn', source: 'public_portal', notes: `Currency: ${activeCurr.code} (${activeCurr.sym}${dailyVal}/day x ${days} days = ${activeCurr.sym}${totalCurr} | VAT: ${vatPct || 0}% | Markup: ${markupPct || 0}%)${cleanLink ? ' | Link/Note: ' + cleanLink : ''}` };
    await new Promise(r => setTimeout(r, 480));
    const res = await fetch('./api/submit-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(async r => ({ status: r.status, body: await r.json().catch(() => ({})) })).catch(() => null);
    submitting = false; if (res?.status === 429) { window.OrderAnim?.markCooldownStart(res.body?.cooldownRemaining || 60); return; }
    if (!res?.body?.success) await window.cloudSubmitOrder?.(payload);
    const linkInp = document.getElementById('pageOrPostUrl'); if (linkInp) linkInp.value = '';
    const localList = getOrders(), prevCount = localList.length; localList.unshift(payload); saveOrders(localList, true);
    window.OrderAnim?.markCooldownStart(60); window.OrderAnim?.playOrderSuccessSequence(id, prevCount, localList.length); syncOrderStatuses();
  }
  window.CampaignOrders = {
    init(ctx) { ctxRef = ctx; window.OrderAnim?.init(ctx); window.OrderAnim?.updateBadge(getOrders().length, false); ensureEntryGate(); syncOrderStatuses(); setInterval(() => { if (!document.hidden) syncOrderStatuses(); }, 4000); document.addEventListener('visibilitychange', () => { if (!document.hidden) syncOrderStatuses(); }); },
    openOrdersModal() { askClearConfirm = false; justClearedMsg = false; renderOrdersModal(); syncOrderStatuses(); },
    openProfileEdit() { ensureEntryGate(null, true); },
    markModalClosed() { ordersModalOpen = false; askClearConfirm = false; justClearedMsg = false; },
    refreshIfOpen() { window.OrderAnim?.syncCooldownButton?.(); window.OrderAnim?.updateBadge(getOrders().length, false); if (ordersModalOpen) renderOrdersModal(); }, submitInstantOrder
  };
})();