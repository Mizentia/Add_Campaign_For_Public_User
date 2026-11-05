document.addEventListener('DOMContentLoaded', async () => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let currentLang = localStorage.getItem('nl_camp_lang') || 'bn', currentTheme = localStorage.getItem('nl_camp_theme') || 'dark';
  let selectedPlatform = 'Facebook', currencies = window.DEFAULT_CAMPAIGN_CURRENCIES, activeCurr = currencies[0];
  const supportInfo = { phone: '+880 1700-000000', fb: 'https://facebook.com/nokshalab', email: 'support@nokshalab.com' };

  const toEnNum = (s) => String(s ?? '').replace(/[০-৯]/g, d => bnDigits.indexOf(d));
  const toLocNum = (s, lang = currentLang) => lang === 'bn' ? String(s).replace(/[0-9]/g, d => bnDigits[d]) : toEnNum(s);
  const tr = (key) => (window.CAMPAIGN_I18N?.[currentLang]?.[key]) || key;
  const bound = (n, min, max, hasLim) => Math.max(min, hasLim !== false ? Math.min(max, n) : n);

  const budgetInput = document.getElementById('budgetUSD'), budgetSlider = document.getElementById('budgetSlider');
  const durationInput = document.getElementById('durationDays'), durationSlider = document.getElementById('durationSlider');
  const bdtEstimate = document.getElementById('bdtEstimate'), bdtRateHint = document.getElementById('bdtRateHint');
  const form = document.getElementById('campaignForm'), modal = document.getElementById('orderModal');
  const modalBody = document.getElementById('modalBody'), modalTitle = document.getElementById('modalTitle');
  const menuDropdown = document.getElementById('headerMenuDropdown'), menuToggleBtn = document.getElementById('menuToggleBtn');

  menuToggleBtn?.addEventListener('click', (e) => { e.stopPropagation(); menuDropdown?.classList.toggle('hidden'); });
  document.addEventListener('click', (e) => { if (!menuDropdown?.contains(e.target) && e.target !== menuToggleBtn) menuDropdown?.classList.add('hidden'); });

  const renderCurrencies = () => {
    const row = document.getElementById('currencySelect');
    if (!row) return;
    row.innerHTML = currencies.map(c => {
      const flag = window.CURRENCY_FLAGS[c.code] || window.CURRENCY_FLAGS.DEFAULT;
      const fullName = currentLang === 'bn' ? (c.nameBn || c.code) : (c.nameEn || c.nameBn || c.code);
      return `<button type="button" class="curr-btn ${c.code === activeCurr.code ? 'active' : ''}" data-curr="${c.code}">${flag}<span class="curr-sym">${c.sym}</span><span class="curr-code">${c.code}</span><span class="curr-full">• ${fullName}</span></button>`;
    }).join('');
    row.querySelectorAll('.curr-btn').forEach(btn => btn.addEventListener('click', () => {
      const next = currencies.find(c => c.code === btn.dataset.curr);
      if (!next || next.code === activeCurr.code) return;
      const prevBdt = (Number(toEnNum(budgetInput.value).replace(/[^0-9.]/g, '')) || activeCurr.minBudget) * activeCurr.rate;
      activeCurr = next; renderCurrencies(); syncSliderBounds(Math.round(prevBdt / activeCurr.rate));
    }));
  };

  const syncSliderBounds = (suggestedBudget) => {
    budgetSlider.min = activeCurr.minBudget; budgetSlider.max = activeCurr.maxBudget; budgetSlider.step = activeCurr.code === 'BDT' ? 50 : 1;
    durationSlider.min = activeCurr.minDays; durationSlider.max = activeCurr.maxDays;
    const bVal = bound(suggestedBudget ?? (Number(toEnNum(budgetInput.value)) || activeCurr.minBudget), activeCurr.minBudget, activeCurr.maxBudget, activeCurr.hasLimit);
    const dVal = bound(Number(toEnNum(durationInput.value)) || activeCurr.minDays, activeCurr.minDays, activeCurr.maxDays, activeCurr.hasLimit);
    budgetSlider.value = Math.min(activeCurr.maxBudget, bVal); budgetInput.value = toLocNum(bVal);
    durationSlider.value = Math.min(activeCurr.maxDays, dVal); durationInput.value = toLocNum(dVal);
    updateCalc();
  };

  const updateCalc = () => {
    const { code, sym, rate, minBudget, maxBudget, minDays, maxDays, hasLimit } = activeCurr;
    const dailyVal = bound(Number(toEnNum(budgetInput.value).replace(/[^0-9.]/g, '')) || minBudget, minBudget, maxBudget, hasLimit);
    const days = bound(Number(toEnNum(durationInput.value).replace(/[^0-9]/g, '')) || minDays, minDays, maxDays, hasLimit);
    const totalCurr = +(dailyVal * days).toFixed(2), totalBdt = Math.round(totalCurr * rate).toLocaleString('en-IN'), maxSuf = hasLimit === false ? '+' : '';
    document.getElementById('budgetUnitPrefix').textContent = sym;
    document.getElementById('lblBudgetTitle').textContent = `${tr('lbl_budget_prefix')} (${code} ${sym})`;
    if (currentLang === 'bn') {
      bdtEstimate.textContent = code === 'BDT' ? `মোট বাজেট: ৳${toLocNum(totalBdt, 'bn')} টাকা` : `মোট বাজেট: ${sym}${toLocNum(totalCurr, 'bn')} ${code} = ${toLocNum(totalBdt, 'bn')} টাকা`;
      bdtRateHint.textContent = code === 'BDT' ? `দৈনিক ৳${toLocNum(dailyVal, 'bn')} × ${toLocNum(days, 'bn')} দিন` : `দৈনিক ${sym}${toLocNum(dailyVal, 'bn')} × ${toLocNum(days, 'bn')} দিন (১ ${code} = ${toLocNum(rate, 'bn')} ৳)`;
      document.getElementById('minBudgetTick').textContent = `${sym}${toLocNum(minBudget, 'bn')}`;
      document.getElementById('maxBudgetTick').textContent = `${sym}${toLocNum(maxBudget, 'bn')}${maxSuf}`;
      document.getElementById('minDaysTick').textContent = `${toLocNum(minDays, 'bn')} দিন`;
      document.getElementById('maxDaysTick').textContent = `${toLocNum(maxDays, 'bn')}${maxSuf} দিন`;
    } else {
      bdtEstimate.textContent = code === 'BDT' ? `Total Budget: ৳${totalBdt} BDT` : `Total Budget: ${sym}${totalCurr} ${code} = ${totalBdt} BDT`;
      bdtRateHint.textContent = code === 'BDT' ? `Daily ৳${dailyVal} × ${days} Days` : `Daily ${sym}${dailyVal} × ${days} Days (1 ${code} = ${rate} BDT)`;
      document.getElementById('minBudgetTick').textContent = `${sym}${minBudget}`;
      document.getElementById('maxBudgetTick').textContent = `${sym}${maxBudget}${maxSuf}`;
      document.getElementById('minDaysTick').textContent = `${minDays} Days`;
      document.getElementById('maxDaysTick').textContent = `${maxDays}${maxSuf} Days`;
    }
  };

  budgetSlider?.addEventListener('input', () => { budgetInput.value = toLocNum(budgetSlider.value); updateCalc(); });
  durationSlider?.addEventListener('input', () => { durationInput.value = toLocNum(durationSlider.value); updateCalc(); });
  const bindInput = (inp, slider, getLim) => {
    inp?.addEventListener('input', () => { const [min, max, hasL] = getLim(), raw = toEnNum(inp.value).replace(/[^0-9]/g, ''); inp.value = toLocNum(raw); if (raw !== '') slider.value = Math.min(max, bound(Number(raw), min, max, hasL)); updateCalc(); });
    inp?.addEventListener('blur', () => { const [min, max, hasL] = getLim(), val = bound(Number(toEnNum(inp.value).replace(/[^0-9]/g, '')) || min, min, max, hasL); slider.value = Math.min(max, val); inp.value = toLocNum(val); updateCalc(); });
  };
  bindInput(budgetInput, budgetSlider, () => [activeCurr.minBudget, activeCurr.maxBudget, activeCurr.hasLimit]);
  bindInput(durationInput, durationSlider, () => [activeCurr.minDays, activeCurr.maxDays, activeCurr.hasLimit]);

  const applyTheme = (theme) => { currentTheme = theme; localStorage.setItem('nl_camp_theme', theme); document.documentElement.setAttribute('data-theme', theme); document.getElementById('themeIco').textContent = theme === 'dark' ? '☀️' : '🌙'; document.getElementById('themeLbl').textContent = theme === 'dark' ? tr('theme_light') : tr('theme_dark'); };
  const applyLanguage = (lang) => { currentLang = lang; localStorage.setItem('nl_camp_lang', lang); document.documentElement.lang = lang; document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.getAttribute('data-i18n')); }); [budgetInput, durationInput].forEach(inp => { if (inp?.value) inp.value = toLocNum(toEnNum(inp.value), lang); }); document.getElementById('langIco').textContent = tr('lang_ico'); document.getElementById('langLbl').textContent = tr('lang_lbl'); renderCurrencies(); applyTheme(currentTheme); updateCalc(); };

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); menuDropdown?.classList.add('hidden'); });
  document.getElementById('langToggleBtn')?.addEventListener('click', () => { applyLanguage(currentLang === 'bn' ? 'en' : 'bn'); menuDropdown?.classList.add('hidden'); });
  document.querySelectorAll('.plat-btn').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.plat-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedPlatform = btn.dataset.plat; }));
  const showModal = (title, html) => { modalTitle.textContent = title; modalBody.innerHTML = html; modal.classList.remove('hidden'); menuDropdown?.classList.add('hidden'); };
  document.getElementById('closeModalBtn')?.addEventListener('click', () => modal.classList.add('hidden'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  document.getElementById('aboutHelpBtn')?.addEventListener('click', () => { const cleanTel = toEnNum(supportInfo.phone).replace(/[^+0-9]/g, ''); showModal(tr('about_title'), `<p style="color:var(--text-muted);margin-bottom:12px;">${tr('about_desc')}</p><div class="order-pill"><strong>${tr('about_helpline')}</strong><div style="margin-top:4px;"><a class="help-link" href="tel:${cleanTel}">${toLocNum(supportInfo.phone)}</a></div></div><div class="order-pill"><strong>${tr('about_fb')}</strong><div style="margin-top:4px;"><a class="help-link" href="${supportInfo.fb}" target="_blank" rel="noopener">${supportInfo.fb}</a></div></div><div class="order-pill"><strong>${tr('about_email')}</strong><div style="margin-top:4px;"><a class="help-link" href="mailto:${supportInfo.email}">${supportInfo.email}</a></div></div><p style="font-size:0.8rem;color:var(--hint-color);text-align:center;margin-top:8px;">${toLocNum(tr('about_hours'))}</p>`); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dailyVal = bound(Number(toEnNum(budgetInput.value)) || activeCurr.minBudget, activeCurr.minBudget, activeCurr.maxBudget, activeCurr.hasLimit), days = bound(Number(toEnNum(durationInput.value)) || activeCurr.minDays, activeCurr.minDays, activeCurr.maxDays, activeCurr.hasLimit), totalUsd = +(((dailyVal * activeCurr.rate) / 125) * days).toFixed(2);
    showModal(`${selectedPlatform} — ${bdtEstimate.textContent}`, `<form id="confirmOrderForm" style="display:flex;flex-direction:column;gap:10px;"><input type="text" id="cName" class="input-ctrl" placeholder="${tr('ph_name')}" required><input type="tel" id="cPhone" class="input-ctrl" placeholder="${tr('ph_phone')}" required><input type="url" id="cUrl" class="input-ctrl" placeholder="${tr('ph_url')}"><button type="submit" class="btn-submit">${tr('btn_confirm_order')}</button></form>`);
    document.getElementById('confirmOrderForm')?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const payload = { platform: selectedPlatform, budgetUSD: totalUsd, durationDays: days, customerName: document.getElementById('cName').value, customerPhone: toEnNum(document.getElementById('cPhone').value), pageOrPostUrl: document.getElementById('cUrl').value, notes: `Currency: ${activeCurr.code} (${activeCurr.sym}${dailyVal}/day x ${days} days)` };
      const res = await fetch('/api/submit-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()).catch(() => ({}));
      if (res.success) showModal(tr('order_success_title'), `<div style="text-align:center;padding:10px;"><p>${tr('order_id_lbl')} <strong>${toLocNum(res.order.id)}</strong></p><p style="margin:8px 0;color:var(--text-muted);">${res.order.platform} | ${activeCurr.sym}${toLocNum(dailyVal * days)} ${activeCurr.code} (${toLocNum(days)} ${tr('lbl_days')})</p><p style="color:var(--success);">${tr('order_team_msg')}</p></div>`);
      else alert(res.error || tr('err_submit'));
    });
  });

  document.getElementById('viewOrdersBtn')?.addEventListener('click', async () => {
    showModal(tr('modal_loading'), `<p style="padding:10px;">${tr('modal_loading_desc')}</p>`);
    const data = await fetch('/api/orders').then(r => r.json()).catch(() => null), list = data?.orders || [];
    if (!list.length) return showModal(tr('modal_orders_title'), `<p style="padding:10px;color:var(--text-muted);">${tr('modal_empty')}</p>`);
    showModal(tr('modal_orders_title'), list.map(o => `<div class="order-pill"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><strong>${toLocNum(o.id)}</strong><span class="status-badge ${o.status}">${tr('status_' + o.status) || o.status}</span></div><div>${o.platform} - $${toLocNum(o.budgetUSD)} (${toLocNum(o.durationDays)} ${tr('lbl_days')})</div><small style="color:var(--text-muted);">${tr('lbl_customer')} ${o.customerName} | ${toLocNum(o.customerPhone)}</small></div>`).join(''));
  });

  const remoteList = await window.fetchStudioCampaignCurrencies(), activeList = remoteList.filter(c => c.enabled !== false);
  if (activeList.length) { currencies = activeList; activeCurr = currencies[0]; }
  applyLanguage(currentLang); syncSliderBounds();
});
