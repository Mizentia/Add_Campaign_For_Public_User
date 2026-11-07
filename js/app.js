document.addEventListener('DOMContentLoaded', async () => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let currentLang = localStorage.getItem('nl_camp_lang') || 'bn', currentTheme = localStorage.getItem('nl_camp_theme') || 'dark';
  let selectedPlatform = localStorage.getItem('nl_camp_plat') || 'Facebook', currencies = (window.DEFAULT_CAMPAIGN_CURRENCIES || []).filter(c => c.enabled !== false && c.forPublic !== false), activeCurr = currencies[0];
  const supportInfo = { phone: '+880 1700-000000', fb: 'https://facebook.com/nokshalab', email: 'support@nokshalab.com' };
  const toEnNum = (s) => String(s ?? '').replace(/[০-৯]/g, d => bnDigits.indexOf(d)), toLocNum = (s, lang = currentLang) => lang === 'bn' ? String(s).replace(/[0-9]/g, d => bnDigits[d]) : toEnNum(s);
  const tr = (key) => (window.CAMPAIGN_I18N?.[currentLang]?.[key]) || key, bound = (n, min, max, hasLim) => Math.max(min, hasLim !== false ? Math.min(max, n) : n);
  const getLocalOrders = () => { try { return JSON.parse(localStorage.getItem('nl_camp_orders') || '[]'); } catch (_) { return []; } }, savePref = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const budgetInput = document.getElementById('budgetUSD'), budgetSlider = document.getElementById('budgetSlider');
  const durationInput = document.getElementById('durationDays'), durationSlider = document.getElementById('durationSlider');
  const bdtEstimate = document.getElementById('bdtEstimate'), bdtRateHint = document.getElementById('bdtRateHint');
  const form = document.getElementById('campaignForm'), modal = document.getElementById('orderModal'), modalBody = document.getElementById('modalBody'), modalTitle = document.getElementById('modalTitle');
  const menuDropdown = document.getElementById('headerMenuDropdown'), menuToggleBtn = document.getElementById('menuToggleBtn');
  const currRow = document.getElementById('currencySelect'), currDropBtn = document.getElementById('currDropBtn'), currDropMenu = document.getElementById('currDropMenu');
  const getFlag = (c) => { try { if (typeof window.getCurrencyFlagHtml === 'function') return window.getCurrencyFlagHtml(c); const F = window.CURRENCY_FLAGS || {}; return F[c.code] || F.DEFAULT || ''; } catch (_) { return ''; } }, getName = (c) => currentLang === 'bn' ? (c.nameBn || c.code) : (c.nameEn || c.nameBn || c.code);
  const closeCurrDrop = () => { currDropMenu?.classList.add('hidden'); currDropBtn?.classList.remove('open'); };
  document.querySelectorAll('.slider-box').forEach(box => box.addEventListener('pointerdown', () => { document.querySelectorAll('.slider-box').forEach(b => b.classList.remove('active-box')); box.classList.add('active-box'); }));
  const restoreCurrState = (list) => { try { const ord = JSON.parse(localStorage.getItem('nl_camp_curr_order') || '[]'); if (ord.length) list.sort((a, b) => (ord.indexOf(a.code) < 0 ? 999 : ord.indexOf(a.code)) - (ord.indexOf(b.code) < 0 ? 999 : ord.indexOf(b.code))); } catch (_) {} currencies = list; const savedCode = localStorage.getItem('nl_camp_curr'); activeCurr = currencies.find(c => c.code === savedCode) || currencies[0]; };
  const syncDropdown = () => {
    if (!currRow || !currDropMenu) return; currDropBtn?.classList.remove('hidden'); const r = currRow.getBoundingClientRect(), overflow = [];
    currRow.querySelectorAll('.curr-btn').forEach(btn => { const b = btn.getBoundingClientRect(); if (b.left < r.left - 2 || b.right > r.right + 2) { const c = currencies.find(x => x.code === btn.dataset.curr); if (c) overflow.push(c); } });
    currDropBtn?.classList.toggle('hidden', !overflow.length); if (!overflow.length) return closeCurrDrop();
    currDropMenu.innerHTML = overflow.map(c => `<button type="button" class="curr-btn" data-curr="${c.code}">${getFlag(c)}<span class="curr-sym">${c.sym}</span><span class="curr-code">${c.code}</span></button>`).join('');
    currDropMenu.querySelectorAll('.curr-btn').forEach(btn => btn.addEventListener('click', () => selectCurrency(btn.dataset.curr, true)));
  };
  menuToggleBtn?.addEventListener('click', (e) => { e.stopPropagation(); menuDropdown?.classList.toggle('hidden'); closeCurrDrop(); });
  currDropBtn?.addEventListener('click', (e) => { e.stopPropagation(); syncDropdown(); const isHid = currDropMenu?.classList.toggle('hidden'); currDropBtn.classList.toggle('open', !isHid); menuDropdown?.classList.add('hidden'); });
  currRow?.addEventListener('scroll', syncDropdown, { passive: true }); window.addEventListener('resize', syncDropdown);
  document.addEventListener('click', (e) => { if (!menuDropdown?.contains(e.target) && e.target !== menuToggleBtn) menuDropdown?.classList.add('hidden'); if (!currDropMenu?.contains(e.target) && !currDropBtn?.contains(e.target)) closeCurrDrop(); if (!e.target.closest?.('.slider-box')) document.querySelectorAll('.slider-box').forEach(b => b.classList.remove('active-box')); });
  const selectCurrency = (code, fromDrop = false) => {
    const idx = currencies.findIndex(c => c.code === code); if (idx === -1) return;
    const next = currencies[idx], prevBdt = (Number(toEnNum(budgetInput.value).replace(/[^0-9.]/g, '')) || activeCurr.minBudget) * activeCurr.rate, changed = next.code !== activeCurr.code;
    if (fromDrop) { currencies = [next, ...currencies.filter(c => c.code !== code)]; savePref('nl_camp_curr_order', JSON.stringify(currencies.map(c => c.code))); }
    activeCurr = next; savePref('nl_camp_curr', activeCurr.code); closeCurrDrop(); renderCurrencies(fromDrop); if (changed) syncSliderBounds(Math.round(prevBdt / activeCurr.rate));
  };
  const renderCurrencies = (resetScroll = false) => {
    if (!currRow) return; currRow.innerHTML = currencies.map(c => `<button type="button" class="curr-btn ${c.code === activeCurr.code ? 'active' : ''}" data-curr="${c.code}">${getFlag(c)}<span class="curr-sym">${c.sym}</span><span class="curr-code">${c.code}</span><span class="curr-full">• ${getName(c)}</span></button>`).join('');
    currRow.querySelectorAll('.curr-btn').forEach(btn => btn.addEventListener('click', () => selectCurrency(btn.dataset.curr, false))); if (resetScroll) currRow.scrollLeft = 0;
    const actBtn = currRow.querySelector('.curr-btn.active');
    if (actBtn && !resetScroll) { const r = currRow.getBoundingClientRect(), b = actBtn.getBoundingClientRect(); if (b.right > r.right + 2 || b.left < r.left - 2) { currencies = [activeCurr, ...currencies.filter(c => c.code !== activeCurr.code)]; savePref('nl_camp_curr_order', JSON.stringify(currencies.map(c => c.code))); return renderCurrencies(true); } }
    syncDropdown();
  };
  const syncSliderBounds = (suggestedBudget) => {
    budgetSlider.min = activeCurr.minBudget; budgetSlider.max = activeCurr.maxBudget; budgetSlider.step = activeCurr.code === 'BDT' ? 50 : 1;
    durationSlider.min = activeCurr.minDays; durationSlider.max = activeCurr.maxDays;
    const bVal = bound(suggestedBudget ?? (Number(toEnNum(budgetInput.value)) || activeCurr.minBudget), activeCurr.minBudget, activeCurr.maxBudget, activeCurr.hasLimit), dVal = bound(Number(toEnNum(durationInput.value)) || activeCurr.minDays, activeCurr.minDays, activeCurr.maxDays, activeCurr.hasLimit);
    budgetSlider.value = Math.min(activeCurr.maxBudget, bVal); budgetInput.value = toLocNum(bVal); durationSlider.value = Math.min(activeCurr.maxDays, dVal); durationInput.value = toLocNum(dVal); updateCalc();
  };
  const updateCalc = () => {
    const { code, sym, rate, minBudget, maxBudget, minDays, maxDays, hasLimit } = activeCurr, dailyVal = bound(Number(toEnNum(budgetInput.value).replace(/[^0-9.]/g, '')) || minBudget, minBudget, maxBudget, hasLimit), days = bound(Number(toEnNum(durationInput.value).replace(/[^0-9]/g, '')) || minDays, minDays, maxDays, hasLimit);
    savePref('nl_camp_budget', String(dailyVal)); savePref('nl_camp_days', String(days));
    [budgetSlider, durationSlider].forEach(s => s?.style.setProperty('--pct', (((s.value - s.min) / Math.max(1, s.max - s.min)) * 100).toFixed(1) + '%'));
    const totalCurr = +(dailyVal * days).toFixed(2), totalBdt = Math.round(totalCurr * rate).toLocaleString('en-IN'), maxSuf = hasLimit === false ? '+' : '', isBn = currentLang === 'bn';
    document.getElementById('budgetUnitPrefix').textContent = sym; document.getElementById('lblBudgetTitle').textContent = `${tr('lbl_budget_prefix')} (${code} ${sym})`;
    bdtEstimate.textContent = isBn ? (code === 'BDT' ? `মোট বাজেট: ৳${toLocNum(totalBdt, 'bn')} টাকা` : `মোট বাজেট: ${sym}${toLocNum(totalCurr, 'bn')} ${code} = ${toLocNum(totalBdt, 'bn')} টাকা`) : (code === 'BDT' ? `Total Budget: ৳${totalBdt} BDT` : `Total Budget: ${sym}${totalCurr} ${code} = ${totalBdt} BDT`);
    bdtRateHint.textContent = isBn ? (code === 'BDT' ? `দৈনিক ৳${toLocNum(dailyVal, 'bn')} × ${toLocNum(days, 'bn')} দিন` : `দৈনিক ${sym}${toLocNum(dailyVal, 'bn')} × ${toLocNum(days, 'bn')} দিন (১ ${code} = ${toLocNum(rate, 'bn')} ৳)`) : (code === 'BDT' ? `Daily ৳${dailyVal} × ${days} Days` : `Daily ${sym}${dailyVal} × ${days} Days (1 ${code} = ${rate} BDT)`);
    document.getElementById('minBudgetTick').textContent = `${sym}${toLocNum(minBudget)}`; document.getElementById('maxBudgetTick').textContent = `${sym}${toLocNum(maxBudget)}${maxSuf}`;
    document.getElementById('minDaysTick').textContent = `${toLocNum(minDays)} ${tr('lbl_days')}`; document.getElementById('maxDaysTick').textContent = `${toLocNum(maxDays)}${maxSuf} ${tr('lbl_days')}`;
  };
  budgetSlider?.addEventListener('input', () => { budgetInput.value = toLocNum(budgetSlider.value); updateCalc(); });
  durationSlider?.addEventListener('input', () => { durationInput.value = toLocNum(durationSlider.value); updateCalc(); });
  const bindInput = (inp, slider, getLim) => {
    inp?.addEventListener('input', () => { const [min, max, hasL] = getLim(), raw = toEnNum(inp.value).replace(/[^0-9]/g, ''); inp.value = toLocNum(raw); if (raw !== '') slider.value = Math.min(max, bound(Number(raw), min, max, hasL)); updateCalc(); });
    inp?.addEventListener('blur', () => { const [min, max, hasL] = getLim(), val = bound(Number(toEnNum(inp.value).replace(/[^0-9]/g, '')) || min, min, max, hasL); slider.value = Math.min(max, val); inp.value = toLocNum(val); updateCalc(); });
  };
  bindInput(budgetInput, budgetSlider, () => [activeCurr.minBudget, activeCurr.maxBudget, activeCurr.hasLimit]); bindInput(durationInput, durationSlider, () => [activeCurr.minDays, activeCurr.maxDays, activeCurr.hasLimit]);
  const applyTheme = (theme) => { currentTheme = theme; savePref('nl_camp_theme', theme); document.documentElement.setAttribute('data-theme', theme); document.getElementById('themeIco').textContent = theme === 'dark' ? '☀️' : '🌙'; document.getElementById('themeLbl').textContent = theme === 'dark' ? tr('theme_light') : tr('theme_dark'); };
  const applyLanguage = (lang) => { currentLang = lang; savePref('nl_camp_lang', lang); document.documentElement.lang = lang; document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.getAttribute('data-i18n')); }); document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = tr(el.getAttribute('data-i18n-title')); el.setAttribute('aria-label', el.title); }); [budgetInput, durationInput].forEach(inp => { if (inp?.value) inp.value = toLocNum(toEnNum(inp.value), lang); }); document.getElementById('langIco').textContent = tr('lang_ico'); document.getElementById('langLbl').textContent = tr('lang_lbl'); renderCurrencies(); applyTheme(currentTheme); updateCalc(); };
  document.getElementById('themeToggleBtn')?.addEventListener('click', () => { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); menuDropdown?.classList.add('hidden'); });
  document.getElementById('langToggleBtn')?.addEventListener('click', () => { applyLanguage(currentLang === 'bn' ? 'en' : 'bn'); menuDropdown?.classList.add('hidden'); });
  document.querySelectorAll('.plat-btn').forEach(btn => { btn.classList.toggle('active', btn.dataset.plat === selectedPlatform); btn.addEventListener('click', () => { document.querySelectorAll('.plat-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedPlatform = btn.dataset.plat; savePref('nl_camp_plat', selectedPlatform); }); });
  const showModal = (title, html) => { modalTitle.textContent = title; modalBody.innerHTML = html; modal.classList.remove('hidden'); menuDropdown?.classList.add('hidden'); closeCurrDrop(); };
  document.getElementById('closeModalBtn')?.addEventListener('click', () => modal.classList.add('hidden')); modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  document.getElementById('aboutHelpBtn')?.addEventListener('click', () => { const cleanTel = toEnNum(supportInfo.phone).replace(/[^+0-9]/g, ''); showModal(tr('about_title'), `<p style="color:var(--text-muted);margin-bottom:12px;">${tr('about_desc')}</p><div class="order-pill"><strong>${tr('about_helpline')}</strong><div style="margin-top:4px;"><a class="help-link" href="tel:${cleanTel}">${toLocNum(supportInfo.phone)}</a></div></div><div class="order-pill"><strong>${tr('about_fb')}</strong><div style="margin-top:4px;"><a class="help-link" href="${supportInfo.fb}" target="_blank" rel="noopener">${supportInfo.fb}</a></div></div><div class="order-pill"><strong>${tr('about_email')}</strong><div style="margin-top:4px;"><a class="help-link" href="mailto:${supportInfo.email}">${supportInfo.email}</a></div></div><p style="font-size:0.8rem;color:var(--hint-color);text-align:center;margin-top:8px;">${toLocNum(tr('about_hours'))}</p>`); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dailyVal = bound(Number(toEnNum(budgetInput.value)) || activeCurr.minBudget, activeCurr.minBudget, activeCurr.maxBudget, activeCurr.hasLimit), days = bound(Number(toEnNum(durationInput.value)) || activeCurr.minDays, activeCurr.minDays, activeCurr.maxDays, activeCurr.hasLimit), totalUsd = +(((dailyVal * activeCurr.rate) / 125) * days).toFixed(2);
    showModal(`${selectedPlatform} — ${bdtEstimate.textContent}`, `<form id="confirmOrderForm" style="display:flex;flex-direction:column;gap:10px;"><input type="text" id="cName" class="input-ctrl" placeholder="${tr('ph_name')}" required><input type="tel" id="cPhone" class="input-ctrl" placeholder="${tr('ph_phone')}" required><input type="url" id="cUrl" class="input-ctrl" placeholder="${tr('ph_url')}"><button type="submit" class="btn-submit">${tr('btn_confirm_order')}</button></form>`);
    document.getElementById('confirmOrderForm')?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const payload = { id: 'PUB-CAMP-' + Date.now().toString(36).toUpperCase(), platform: selectedPlatform, budgetUSD: totalUsd, durationDays: days, customerName: document.getElementById('cName').value, customerPhone: toEnNum(document.getElementById('cPhone').value), pageOrPostUrl: document.getElementById('cUrl').value, status: 'pending', notes: `Currency: ${activeCurr.code} (${activeCurr.sym}${dailyVal}/day x ${days} days)` };
      const res = await fetch('./api/submit-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.ok ? r.json() : null).catch(() => null), savedOrder = res?.order || payload;
      const localList = getLocalOrders(); localList.unshift(savedOrder); savePref('nl_camp_orders', JSON.stringify(localList.slice(0, 50)));
      showModal(tr('order_success_title'), `<div style="text-align:center;padding:10px;"><p>${tr('order_id_lbl')} <strong>${toLocNum(savedOrder.id)}</strong></p><p style="margin:8px 0;color:var(--text-muted);">${savedOrder.platform} | ${activeCurr.sym}${toLocNum(dailyVal * days)} ${activeCurr.code} (${toLocNum(days)} ${tr('lbl_days')})</p><p style="color:var(--success);">${tr('order_team_msg')}</p></div>`);
    });
  });
  document.getElementById('viewOrdersBtn')?.addEventListener('click', async () => {
    showModal(tr('modal_loading'), `<p style="padding:10px;">${tr('modal_loading_desc')}</p>`);
    const data = await fetch('./api/orders').then(r => r.ok ? r.json() : null).catch(() => null), list = data?.orders?.length ? data.orders : getLocalOrders();
    if (!list.length) return showModal(tr('modal_orders_title'), `<p style="padding:10px;color:var(--text-muted);">${tr('modal_empty')}</p>`);
    showModal(tr('modal_orders_title'), list.map(o => `<div class="order-pill"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><strong>${toLocNum(o.id)}</strong><span class="status-badge ${o.status}">${tr('status_' + o.status) || o.status}</span></div><div>${o.platform} - $${toLocNum(o.budgetUSD)} (${toLocNum(o.durationDays)} ${tr('lbl_days')})</div><small style="color:var(--text-muted);">${tr('lbl_customer')} ${o.customerName} | ${toLocNum(o.customerPhone)}</small></div>`).join(''));
  });
  const savedB = Number(localStorage.getItem('nl_camp_budget')), savedD = Number(localStorage.getItem('nl_camp_days'));
  if (savedD) durationInput.value = toLocNum(savedD);
  restoreCurrState(currencies); applyLanguage(currentLang); syncSliderBounds(savedB || undefined);
  const remoteList = await window.fetchStudioCampaignCurrencies(), activeList = (Array.isArray(remoteList) ? remoteList : []).filter(c => c && c.code && c.enabled !== false && c.forPublic !== false);
  if (activeList.length) { restoreCurrState(activeList); renderCurrencies(); syncSliderBounds(Number(localStorage.getItem('nl_camp_budget')) || undefined); }
});