document.addEventListener('DOMContentLoaded', async () => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let currentLang = localStorage.getItem('nl_camp_lang') || 'bn', currentTheme = localStorage.getItem('nl_camp_theme') || 'light', menuDismissed = false;
  const normCurr = (c) => ({ ...c, rate: Number(c.rate) || 1, markupPercent: Number(c.markupPercent) || 0, minBudget: Number(c.minBudget) || 1, maxBudget: Number(c.maxBudget) || 100, minDays: Math.max(1, Math.round(Number(c.minDays) || 4)), maxDays: Math.max(1, Math.round(Number(c.maxDays) || 100)) });
  let platforms = (window.DEFAULT_CAMPAIGN_PLATFORMS || []).filter(p => p.enabled !== false && p.forPublic !== false), activePlat = platforms[0];
  let currencies = (window.DEFAULT_CAMPAIGN_CURRENCIES || []).filter(c => c.enabled !== false && c.forPublic !== false).map(normCurr), activeCurr = currencies[0];
  const supportInfo = { phone: '8801703582125', fb: 'https://www.facebook.com/NokshaLab/', email: 'NokshaLab@gmail.com' };
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
  const restoreCurrState = (list) => { const normed = list.map(normCurr); try { const ord = JSON.parse(localStorage.getItem('nl_camp_curr_order') || '[]'); if (ord.length) normed.sort((a, b) => (ord.indexOf(a.code) < 0 ? 999 : ord.indexOf(a.code)) - (ord.indexOf(b.code) < 0 ? 999 : ord.indexOf(b.code))); } catch (_) {} currencies = normed; const savedCode = localStorage.getItem('nl_camp_curr'); activeCurr = currencies.find(c => c.code === savedCode) || currencies[0]; };
  const syncDropdown = () => {
    if (!currRow || !currDropMenu) return; if (!currDropMenu.classList.contains('hidden')) return; currDropBtn?.classList.remove('hidden'); const r = currRow.getBoundingClientRect(), overflow = [];
    currRow.querySelectorAll('.curr-btn').forEach(btn => { const b = btn.getBoundingClientRect(); if (b.left < r.left - 2 || b.right > r.right + 2) overflow.push(btn.dataset.curr); });
    currDropBtn?.classList.toggle('hidden', !overflow.length); if (!overflow.length) return closeCurrDrop();
    window.CurrDrop?.render({ menu: currDropMenu, list: currencies, overflowCodes: overflow, tr, getFlag, getName, onPick: (code) => selectCurrency(code, true) });
  };
  menuToggleBtn?.addEventListener('click', (e) => { e.stopPropagation(); menuDropdown?.classList.toggle('hidden'); closeCurrDrop(); });
  currDropBtn?.addEventListener('click', (e) => { e.stopPropagation(); syncDropdown(); const isHid = currDropMenu?.classList.toggle('hidden'); currDropBtn.classList.toggle('open', !isHid); menuDropdown?.classList.add('hidden'); if (!isHid) setTimeout(() => document.getElementById('currSearchInp')?.focus(), 40); });
  currRow?.addEventListener('scroll', syncDropdown, { passive: true }); window.addEventListener('resize', syncDropdown);
  const blurOutsideInputs = (t) => { [budgetInput, durationInput].forEach(el => { if (el && t !== el && !el.closest('.input-unit-wrap')?.contains(t)) { el.readOnly = true; if (document.activeElement === el) el.blur(); } }); };
  document.addEventListener('touchstart', (e) => blurOutsideInputs(e.target), { capture: true, passive: true });
  document.addEventListener('pointerdown', (e) => {
    blurOutsideInputs(e.target);
    if (menuDropdown && !menuDropdown.classList.contains('hidden') && !menuDropdown.contains(e.target) && !menuToggleBtn?.contains(e.target)) { menuDropdown.classList.add('hidden'); menuDismissed = true; e.preventDefault(); e.stopPropagation(); return; }
    if (currDropMenu && !currDropMenu.classList.contains('hidden') && !currDropMenu.contains(e.target) && !currDropBtn?.contains(e.target)) closeCurrDrop();
    if (!e.target.closest?.('.slider-box')) document.querySelectorAll('.slider-box').forEach(b => b.classList.remove('active-box'));
  }, true);
  document.addEventListener('click', (e) => { if (menuDismissed || (menuDropdown && !menuDropdown.classList.contains('hidden') && !menuDropdown.contains(e.target) && !menuToggleBtn?.contains(e.target))) { menuDismissed = false; menuDropdown?.classList.add('hidden'); e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCurrDrop(); menuDropdown?.classList.add('hidden'); if (!modal?.classList.contains('hidden')) closeModal(); document.getElementById('gateCancelBtn')?.click(); } });
  const selectCurrency = (code, fromDrop = false) => {
    const idx = currencies.findIndex(c => c.code === code); if (idx === -1) return;
    const next = currencies[idx], changed = next.code !== activeCurr.code;
    if (fromDrop) { currencies = [next, ...currencies.filter(c => c.code !== code)]; savePref('nl_camp_curr_order', JSON.stringify(currencies.map(c => c.code))); }
    activeCurr = next; savePref('nl_camp_curr', activeCurr.code); closeCurrDrop(); renderCurrencies(fromDrop); if (changed) syncSliderBounds(activeCurr.minBudget, activeCurr.minDays);
  };
  const renderCurrencies = (resetScroll = false) => {
    if (!currRow) return; currRow.innerHTML = currencies.map(c => `<button type="button" class="curr-btn ${c.code === activeCurr.code ? 'active' : ''}" data-curr="${c.code}">${getFlag(c)}<span class="curr-sym">${c.sym}</span><span class="curr-code">${c.code}</span><span class="curr-full">• ${getName(c)}</span></button>`).join('');
    currRow.querySelectorAll('.curr-btn').forEach(btn => btn.addEventListener('click', () => selectCurrency(btn.dataset.curr, false))); if (resetScroll) currRow.scrollLeft = 0;
    const actBtn = currRow.querySelector('.curr-btn.active');
    if (actBtn && !resetScroll) { const r = currRow.getBoundingClientRect(), b = actBtn.getBoundingClientRect(); if (b.right > r.right + 2 || b.left < r.left - 2) { currencies = [activeCurr, ...currencies.filter(c => c.code !== activeCurr.code)]; savePref('nl_camp_curr_order', JSON.stringify(currencies.map(c => c.code))); return renderCurrencies(true); } }
    syncDropdown();
  };
  const syncSliderBounds = (suggestedBudget, suggestedDays) => {
    const bVal = +bound(suggestedBudget ?? activeCurr.minBudget, activeCurr.minBudget, activeCurr.maxBudget, hasBdtLim(activeCurr)).toFixed(2), dVal = Math.round(bound(suggestedDays ?? (parseInt(toEnNum(durationInput.value).replace(/[^0-9]/g, ''), 10) || activeCurr.minDays), activeCurr.minDays, activeCurr.maxDays, hasDayLim(activeCurr)));
    budgetSlider.min = activeCurr.minBudget; budgetSlider.max = activeCurr.maxBudget; budgetSlider.step = 'any'; durationSlider.min = activeCurr.minDays; durationSlider.max = activeCurr.maxDays; durationSlider.step = '1'; durationSlider.dataset.step = '1';
    budgetInput.value = toLocNum(bVal); durationInput.value = toLocNum(dVal); budgetWarn?.classList.remove('show'); durationWarn?.classList.remove('show');
    window.CalcUI?.animateSlider(budgetSlider, Math.min(activeCurr.maxBudget, bVal)); window.CalcUI?.animateSlider(durationSlider, Math.min(activeCurr.maxDays, dVal)); updateCalc();
  };
  const computeTotals = () => {
    const bLim = hasBdtLim(activeCurr), dLim = hasDayLim(activeCurr), rawB = toEnNum(budgetInput.value).replace(/।/g, '.').replace(/[^0-9.]/g, ''), parsedB = parseFloat(rawB);
    const dailyVal = +bound(Number.isFinite(parsedB) && parsedB > 0 ? parsedB : activeCurr.minBudget, activeCurr.minBudget, activeCurr.maxBudget, bLim).toFixed(2);
    const [iP, dP = ''] = rawB.split('.'), dailyDisp = (parsedB === dailyVal && rawB.includes('.') && dP.length) ? `${Number(iP)}.${dP.slice(0, 2)}` : String(dailyVal), days = Math.round(bound(parseInt(toEnNum(durationInput.value).replace(/[^0-9]/g, ''), 10) || activeCurr.minDays, activeCurr.minDays, activeCurr.maxDays, dLim));
    const totalCurr = +(dailyVal * days).toFixed(2), baseBdt = +(totalCurr * activeCurr.rate).toFixed(2), vatPct = Number(activePlat?.vatPercent) || 0, markupPct = Number(activeCurr?.markupPercent) || 0, vatBdt = +(baseBdt * (vatPct / 100)).toFixed(2), markupBdt = +(baseBdt * (markupPct / 100)).toFixed(2);
    return { dailyVal, dailyDisp, days, totalCurr, baseBdt, vatPct, markupPct, vatBdt, markupBdt, totalBdtNum: +(baseBdt + vatBdt + markupBdt).toFixed(2), bLim, dLim };
  };
  const updateCalc = () => {
    const { code, sym } = activeCurr, totals = computeTotals(), bTxt = document.getElementById('lblBudgetTxt'), bChip = document.getElementById('lblBudgetChip');
    document.getElementById('budgetUnitPrefix').textContent = sym; if (bTxt) bTxt.textContent = tr('lbl_budget_prefix'); if (bChip) bChip.innerHTML = `<span class="chip-code">${code}</span><span class="chip-sym">${sym}</span>`;
    window.CalcUI?.renderCalcUI({ activeCurr, activePlat, totals, tr, toLocNum, getPlatName, isBn: currentLang === 'bn' });
  };
  budgetSlider?.addEventListener('input', () => { blurOutsideInputs(budgetSlider); budgetWarn?.classList.remove('show'); const raw = Number(budgetSlider.value), minB = activeCurr.minBudget, maxB = activeCurr.maxBudget, span = maxB - minB, st = (span <= 20 || !Number.isInteger(minB) || !Number.isInteger(maxB)) ? (((minB * 10) % 1 !== 0 || (maxB * 10) % 1 !== 0 || span <= 2) ? 0.01 : 0.1) : 1; const v = raw <= minB + st * 0.25 ? minB : (raw >= maxB - st * 0.25 ? maxB : +(Math.round(raw / st) * st).toFixed(2)); budgetInput.value = toLocNum(v); window.CalcUI?.setSliderPct(budgetSlider, v); updateCalc(); });
  durationSlider?.addEventListener('input', () => { blurOutsideInputs(durationSlider); durationWarn?.classList.remove('show'); const v = Math.round(Number(durationSlider.value)); durationInput.value = toLocNum(v); window.CalcUI?.setSliderPct(durationSlider, v); updateCalc(); });
  window.CalcUI?.bindValidatedInput(budgetInput, budgetSlider, budgetWarn, () => ({ min: activeCurr.minBudget, max: activeCurr.maxBudget, hasLim: hasBdtLim(activeCurr), allowDec: true, sym: activeCurr.sym, tr, toLocNum, toEnNum }), updateCalc);
  window.CalcUI?.bindValidatedInput(durationInput, durationSlider, durationWarn, () => ({ min: activeCurr.minDays, max: activeCurr.maxDays, hasLim: hasDayLim(activeCurr), allowDec: false, unit: tr('lbl_days'), tr, toLocNum, toEnNum }), updateCalc);
  const applyTheme = (theme) => { currentTheme = theme; savePref('nl_camp_theme', theme); document.documentElement.setAttribute('data-theme', theme); document.body?.setAttribute('data-theme', theme); document.getElementById('themeIco').textContent = theme === 'dark' ? '☀️' : '🌙'; document.getElementById('themeLbl').textContent = theme === 'dark' ? tr('theme_light') : tr('theme_dark'); };
  const applyLanguage = (lang) => { currentLang = lang; savePref('nl_camp_lang', lang); document.documentElement.lang = lang; document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.getAttribute('data-i18n')); }); document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = tr(el.getAttribute('data-i18n-title')); el.setAttribute('aria-label', el.title); }); document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = tr(el.getAttribute('data-i18n-placeholder')); }); [budgetInput, durationInput].forEach(inp => { if (inp?.value) inp.value = toLocNum(toEnNum(inp.value), lang); }); document.getElementById('langIco').textContent = tr('lang_ico'); document.getElementById('langLbl').textContent = tr('lang_lbl'); renderPlatforms(); renderCurrencies(); applyTheme(currentTheme); updateCalc(); window.CampaignOrders?.refreshIfOpen?.(); };
  document.getElementById('themeToggleBtn')?.addEventListener('click', () => { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); menuDropdown?.classList.add('hidden'); });
  document.getElementById('langToggleBtn')?.addEventListener('click', () => { applyLanguage(currentLang === 'bn' ? 'en' : 'bn'); menuDropdown?.classList.add('hidden'); });
  const showModal = (title, html) => { modalTitle.textContent = title; modalBody.innerHTML = html; modal.classList.remove('hidden'); menuDropdown?.classList.add('hidden'); closeCurrDrop(); };
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModal); modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.getElementById('aboutHelpBtn')?.addEventListener('click', () => { window.CampaignOrders?.markModalClosed?.(); const cleanTel = toEnNum(supportInfo.phone).replace(/[^0-9]/g, ''); showModal(tr('about_title'), `<p style="color:var(--text-muted);margin-bottom:12px;line-height:1.5;">${tr('about_desc')}</p><div class="order-pill"><strong>${tr('about_helpline')}</strong><div class="help-row-wrap"><a class="help-link" href="tel:+${cleanTel}">${toLocNum(supportInfo.phone)}</a><a class="help-wa-chip" href="https://wa.me/${cleanTel}" target="_blank" rel="noopener">💬 WhatsApp</a></div></div><div class="order-pill"><strong>${tr('about_fb')}</strong><div style="margin-top:5px;"><a class="help-link" href="${supportInfo.fb}" target="_blank" rel="noopener">${supportInfo.fb}</a></div></div><div class="order-pill"><strong>${tr('about_email')}</strong><div style="margin-top:5px;"><a class="help-link" href="mailto:${supportInfo.email}">${supportInfo.email}</a></div></div><p style="font-size:0.8rem;color:var(--hint-color);text-align:center;margin-top:10px;font-weight:700;">${toLocNum(tr('about_hours'))}</p>`); });
  form.addEventListener('submit', async (e) => { e.preventDefault(); budgetInput?.blur(); durationInput?.blur(); const { dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum } = computeTotals(), usdRate = Number(currencies.find(c => c.code === 'USD')?.rate) || 125; await window.CampaignOrders?.submitInstantOrder({ platform: activePlat?.id || 'Facebook', activePlat, activeCurr, dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum, totalUsd: +(activeCurr.code === 'USD' ? totalCurr : (baseBdt / usdRate)).toFixed(2) }); });
  document.getElementById('viewOrdersBtn')?.addEventListener('click', () => window.CampaignOrders?.openOrdersModal());
  restorePlatState(platforms); restoreCurrState(currencies); applyLanguage(currentLang); syncSliderBounds(activeCurr.minBudget, activeCurr.minDays); window.CampaignOrders?.init({ tr, toLocNum, toEnNum, showModal, getLang: () => currentLang });
  const remoteCfg = await window.fetchStudioCampaignConfig(), activePlats = window.normalizeCampaignPlatforms(remoteCfg?.platforms).filter(p => p && p.id && p.enabled !== false && p.forPublic !== false), activeList = (Array.isArray(remoteCfg?.currencies) ? remoteCfg.currencies : []).filter(c => c && c.code && c.enabled !== false && c.forPublic !== false);
  if (activePlats.length) { restorePlatState(activePlats); renderPlatforms(); }
  if (activeList.length) { restoreCurrState(activeList); renderCurrencies(); syncSliderBounds(activeCurr.minBudget, activeCurr.minDays); } else updateCalc();
});