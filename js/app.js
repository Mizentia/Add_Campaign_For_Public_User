document.addEventListener('DOMContentLoaded', async () => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let currentLang = localStorage.getItem('nl_camp_lang') || 'bn', currentTheme = localStorage.getItem('nl_camp_theme') || 'light', menuDismissed = false;
  let platforms = (window.DEFAULT_CAMPAIGN_PLATFORMS || []).filter(p => p.enabled !== false && p.forPublic !== false), activePlat = platforms[0];
  let currencies = (window.DEFAULT_CAMPAIGN_CURRENCIES || []).filter(c => c.enabled !== false && c.forPublic !== false), activeCurr = currencies[0];
  const supportInfo = { phone: '+880 1700-000000', fb: 'https://facebook.com/nokshalab', email: 'support@nokshalab.com' };
  const toEnNum = (s) => String(s ?? '').replace(/[০-৯]/g, d => bnDigits.indexOf(d)), toLocNum = (s, lang = currentLang) => lang === 'bn' ? String(s).replace(/[0-9]/g, d => bnDigits[d]) : toEnNum(s);
  const tr = (key) => (window.CAMPAIGN_I18N?.[currentLang]?.[key]) || key, bound = (n, min, max, hasLim) => Math.max(min, hasLim !== false ? Math.min(max, n) : n);
  const savePref = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const hasBdtLim = (c) => c.hasLimit !== false && !c.unlimitedBudget, hasDayLim = (c) => c.hasLimit !== false && !c.unlimitedDays;
  const budgetInput = document.getElementById('budgetUSD'), budgetSlider = document.getElementById('budgetSlider'), budgetWarn = document.getElementById('budgetWarnMsg');
  const durationInput = document.getElementById('durationDays'), durationSlider = document.getElementById('durationSlider'), durationWarn = document.getElementById('durationWarnMsg');
  const form = document.getElementById('campaignForm'), modal = document.getElementById('orderModal'), modalBody = document.getElementById('modalBody'), modalTitle = document.getElementById('modalTitle');
  const menuDropdown = document.getElementById('headerMenuDropdown'), menuToggleBtn = document.getElementById('menuToggleBtn');
  const platGrid = document.getElementById('platformSelect'), currRow = document.getElementById('currencySelect'), currDropBtn = document.getElementById('currDropBtn'), currDropMenu = document.getElementById('currDropMenu');
  const getFlag = (c) => { try { return typeof window.getCurrencyFlagHtml === 'function' ? window.getCurrencyFlagHtml(c) : ''; } catch (_) { return ''; } }, getName = (c) => currentLang === 'bn' ? (c.nameBn || c.code) : (c.nameEn || c.nameBn || c.code);
  const getPlatName = (p) => currentLang === 'bn' ? (p.nameBn || p.id) : (p.nameEn || p.nameBn || p.id), getPlatLogo = (p) => typeof window.getPlatformLogoHtml === 'function' ? window.getPlatformLogoHtml(p) : '';
  const closeCurrDrop = () => { currDropMenu?.classList.add('hidden'); currDropBtn?.classList.remove('open'); };
  const closeModal = () => { modal.classList.add('hidden'); window.CampaignOrders?.markModalClosed?.(); };
  document.querySelectorAll('.slider-box').forEach(box => box.addEventListener('pointerdown', () => { document.querySelectorAll('.slider-box').forEach(b => b.classList.remove('active-box')); box.classList.add('active-box'); }));
  const restorePlatState = (list) => { platforms = list; const saved = localStorage.getItem('nl_camp_plat'); activePlat = platforms.find(p => p.id === saved) || platforms[0]; };
  const renderPlatforms = () => {
    if (!platGrid || !platforms.length) return;
    platGrid.innerHTML = platforms.map(p => `<button type="button" class="plat-btn ${p.id === activePlat?.id ? 'active' : ''}" data-plat="${p.id}">${getPlatLogo(p)}<span>${getPlatName(p)}</span></button>`).join('');
    platGrid.querySelectorAll('.plat-btn').forEach(btn => btn.addEventListener('click', () => { const found = platforms.find(x => x.id === btn.dataset.plat); if (!found) return; activePlat = found; savePref('nl_camp_plat', activePlat.id); renderPlatforms(); updateCalc(); }));
  };
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
  document.addEventListener('pointerdown', (e) => {
    if (menuDropdown && !menuDropdown.classList.contains('hidden') && !menuDropdown.contains(e.target) && !menuToggleBtn?.contains(e.target)) { menuDropdown.classList.add('hidden'); menuDismissed = true; e.preventDefault(); e.stopPropagation(); return; }
    if (currDropMenu && !currDropMenu.classList.contains('hidden') && !currDropMenu.contains(e.target) && !currDropBtn?.contains(e.target)) closeCurrDrop();
    if (!e.target.closest?.('.slider-box')) document.querySelectorAll('.slider-box').forEach(b => b.classList.remove('active-box'));
  }, true);
  document.addEventListener('click', (e) => {
    if (menuDismissed || (menuDropdown && !menuDropdown.classList.contains('hidden') && !menuDropdown.contains(e.target) && !menuToggleBtn?.contains(e.target))) { menuDismissed = false; menuDropdown?.classList.add('hidden'); e.preventDefault(); e.stopPropagation(); }
  }, true);
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
    const stepVal = activeCurr.code === 'BDT' ? 50 : 1, bVal = bound(suggestedBudget ?? (Number(toEnNum(budgetInput.value)) || activeCurr.minBudget), activeCurr.minBudget, activeCurr.maxBudget, hasBdtLim(activeCurr)), dVal = bound(Number(toEnNum(durationInput.value)) || activeCurr.minDays, activeCurr.minDays, activeCurr.maxDays, hasDayLim(activeCurr));
    budgetSlider.min = activeCurr.minBudget; budgetSlider.max = activeCurr.maxBudget; budgetSlider.step = stepVal; budgetSlider.dataset.step = String(stepVal);
    durationSlider.min = activeCurr.minDays; durationSlider.max = activeCurr.maxDays; durationSlider.dataset.step = '1';
    budgetInput.value = toLocNum(bVal); durationInput.value = toLocNum(dVal); budgetWarn?.classList.remove('show'); durationWarn?.classList.remove('show');
    window.CalcUI?.animateSlider(budgetSlider, Math.min(activeCurr.maxBudget, bVal)); window.CalcUI?.animateSlider(durationSlider, Math.min(activeCurr.maxDays, dVal)); updateCalc();
  };
  const computeTotals = () => {
    const bLim = hasBdtLim(activeCurr), dLim = hasDayLim(activeCurr);
    const dailyVal = bound(Number(toEnNum(budgetInput.value).replace(/[^0-9.]/g, '')) || activeCurr.minBudget, activeCurr.minBudget, activeCurr.maxBudget, bLim), days = bound(Number(toEnNum(durationInput.value).replace(/[^0-9]/g, '')) || activeCurr.minDays, activeCurr.minDays, activeCurr.maxDays, dLim);
    const totalCurr = +(dailyVal * days).toFixed(2), baseBdt = totalCurr * activeCurr.rate, vatPct = Number(activePlat?.vatPercent) || 0, markupPct = Number(activeCurr?.markupPercent) || 0;
    return { dailyVal, days, totalCurr, baseBdt: Math.round(baseBdt), vatPct, markupPct, totalBdtNum: Math.round(baseBdt * (1 + (vatPct + markupPct) / 100)), bLim, dLim };
  };
  const updateCalc = () => {
    const { code, sym } = activeCurr, totals = computeTotals();
    savePref('nl_camp_budget', String(totals.dailyVal)); savePref('nl_camp_days', String(totals.days));
    document.getElementById('budgetUnitPrefix').textContent = sym; document.getElementById('lblBudgetTitle').textContent = `${tr('lbl_budget_prefix')} (${code} ${sym})`;
    window.CalcUI?.renderCalcUI({ activeCurr, activePlat, totals, tr, toLocNum, getPlatName, isBn: currentLang === 'bn' });
  };
  budgetSlider?.addEventListener('input', () => { budgetWarn?.classList.remove('show'); const v = Math.round(Number(budgetSlider.value)); budgetInput.value = toLocNum(v); window.CalcUI?.setSliderPct(budgetSlider, v); updateCalc(); });
  durationSlider?.addEventListener('input', () => { durationWarn?.classList.remove('show'); const v = Math.round(Number(durationSlider.value)); durationInput.value = toLocNum(v); window.CalcUI?.setSliderPct(durationSlider, v); updateCalc(); });
  window.CalcUI?.bindValidatedInput(budgetInput, budgetSlider, budgetWarn, () => ({ min: activeCurr.minBudget, max: activeCurr.maxBudget, hasLim: hasBdtLim(activeCurr), sym: activeCurr.sym, tr, toLocNum, toEnNum }), updateCalc);
  window.CalcUI?.bindValidatedInput(durationInput, durationSlider, durationWarn, () => ({ min: activeCurr.minDays, max: activeCurr.maxDays, hasLim: hasDayLim(activeCurr), unit: tr('lbl_days'), tr, toLocNum, toEnNum }), updateCalc);
  const applyTheme = (theme) => { currentTheme = theme; savePref('nl_camp_theme', theme); document.documentElement.setAttribute('data-theme', theme); document.getElementById('themeIco').textContent = theme === 'dark' ? '☀️' : '🌙'; document.getElementById('themeLbl').textContent = theme === 'dark' ? tr('theme_light') : tr('theme_dark'); };
  const applyLanguage = (lang) => { currentLang = lang; savePref('nl_camp_lang', lang); document.documentElement.lang = lang; document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.getAttribute('data-i18n')); }); document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = tr(el.getAttribute('data-i18n-title')); el.setAttribute('aria-label', el.title); }); document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = tr(el.getAttribute('data-i18n-placeholder')); }); [budgetInput, durationInput].forEach(inp => { if (inp?.value) inp.value = toLocNum(toEnNum(inp.value), lang); }); document.getElementById('langIco').textContent = tr('lang_ico'); document.getElementById('langLbl').textContent = tr('lang_lbl'); renderPlatforms(); renderCurrencies(); applyTheme(currentTheme); updateCalc(); window.CampaignOrders?.refreshIfOpen?.(); };
  document.getElementById('themeToggleBtn')?.addEventListener('click', () => { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); menuDropdown?.classList.add('hidden'); });
  document.getElementById('langToggleBtn')?.addEventListener('click', () => { applyLanguage(currentLang === 'bn' ? 'en' : 'bn'); menuDropdown?.classList.add('hidden'); });
  const showModal = (title, html) => { modalTitle.textContent = title; modalBody.innerHTML = html; modal.classList.remove('hidden'); menuDropdown?.classList.add('hidden'); closeCurrDrop(); };
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModal); modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.getElementById('aboutHelpBtn')?.addEventListener('click', () => { window.CampaignOrders?.markModalClosed?.(); const cleanTel = toEnNum(supportInfo.phone).replace(/[^+0-9]/g, ''); showModal(tr('about_title'), `<p style="color:var(--text-muted);margin-bottom:12px;">${tr('about_desc')}</p><div class="order-pill"><strong>${tr('about_helpline')}</strong><div style="margin-top:4px;"><a class="help-link" href="tel:${cleanTel}">${toLocNum(supportInfo.phone)}</a></div></div><div class="order-pill"><strong>${tr('about_fb')}</strong><div style="margin-top:4px;"><a class="help-link" href="${supportInfo.fb}" target="_blank" rel="noopener">${supportInfo.fb}</a></div></div><div class="order-pill"><strong>${tr('about_email')}</strong><div style="margin-top:4px;"><a class="help-link" href="mailto:${supportInfo.email}">${supportInfo.email}</a></div></div><p style="font-size:0.8rem;color:var(--hint-color);text-align:center;margin-top:8px;">${toLocNum(tr('about_hours'))}</p>`); });
  form.addEventListener('submit', async (e) => { e.preventDefault(); const { dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum } = computeTotals(); await window.CampaignOrders?.submitInstantOrder({ platform: activePlat?.id || 'Facebook', activePlat, activeCurr, dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum, totalUsd: +(totalBdtNum / 125).toFixed(2) }); });
  document.getElementById('viewOrdersBtn')?.addEventListener('click', () => window.CampaignOrders?.openOrdersModal());
  const savedB = Number(localStorage.getItem('nl_camp_budget')), savedD = Number(localStorage.getItem('nl_camp_days'));
  if (savedD) durationInput.value = toLocNum(savedD);
  restorePlatState(platforms); restoreCurrState(currencies); applyLanguage(currentLang); syncSliderBounds(savedB || undefined);
  window.CampaignOrders?.init({ tr, toLocNum, toEnNum, showModal, getLang: () => currentLang });
  const remoteCfg = await window.fetchStudioCampaignConfig(), activePlats = window.normalizeCampaignPlatforms(remoteCfg?.platforms).filter(p => p && p.id && p.enabled !== false && p.forPublic !== false), activeList = (Array.isArray(remoteCfg?.currencies) ? remoteCfg.currencies : []).filter(c => c && c.code && c.enabled !== false && c.forPublic !== false);
  if (activePlats.length) { restorePlatState(activePlats); renderPlatforms(); }
  if (activeList.length) { restoreCurrState(activeList); renderCurrencies(); syncSliderBounds(Number(localStorage.getItem('nl_camp_budget')) || undefined); } else updateCalc();
});