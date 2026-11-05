document.addEventListener('DOMContentLoaded', () => {
  const MIN_UNIT = 2, MAX_UNIT = 100, MIN_DAYS = 4, MAX_DAYS = 100;
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let currentLang = localStorage.getItem('nl_camp_lang') || 'bn', currentTheme = localStorage.getItem('nl_camp_theme') || 'dark';
  let selectedPlatform = 'Facebook', currentCurr = 'USD', currentSym = '$', currentRate = 125;
  const supportInfo = { phone: '+880 1700-000000', fb: 'https://facebook.com/nokshalab', email: 'support@nokshalab.com' };
  const toEnNum = (s) => String(s ?? '').replace(/[০-৯]/g, d => bnDigits.indexOf(d));
  const toLocNum = (s, lang = currentLang) => lang === 'bn' ? String(s).replace(/[0-9]/g, d => bnDigits[d]) : toEnNum(s);
  const tr = (key) => (window.CAMPAIGN_I18N?.[currentLang]?.[key]) || key;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const getBounds = () => currentCurr === 'BDT' ? [250, 12500, 50] : [MIN_UNIT, MAX_UNIT, 1];

  const budgetInput = document.getElementById('budgetUSD'), budgetSlider = document.getElementById('budgetSlider');
  const durationInput = document.getElementById('durationDays'), durationSlider = document.getElementById('durationSlider');
  const bdtEstimate = document.getElementById('bdtEstimate'), bdtRateHint = document.getElementById('bdtRateHint');
  const form = document.getElementById('campaignForm'), modal = document.getElementById('orderModal');
  const modalBody = document.getElementById('modalBody'), modalTitle = document.getElementById('modalTitle');
  const menuDropdown = document.getElementById('headerMenuDropdown'), menuToggleBtn = document.getElementById('menuToggleBtn');

  menuToggleBtn?.addEventListener('click', (e) => { e.stopPropagation(); menuDropdown?.classList.toggle('hidden'); });
  document.addEventListener('click', (e) => { if (!menuDropdown?.contains(e.target) && e.target !== menuToggleBtn) menuDropdown?.classList.add('hidden'); });

  const updateCalc = () => {
    const [minB, maxB] = getBounds();
    const dailyVal = clamp(Number(toEnNum(budgetInput.value).replace(/[^0-9.]/g, '')) || minB, minB, maxB);
    const days = clamp(Number(toEnNum(durationInput.value).replace(/[^0-9]/g, '')) || MIN_DAYS, MIN_DAYS, MAX_DAYS);
    const totalCurr = +(dailyVal * days).toFixed(2), totalBdt = Math.round(totalCurr * currentRate).toLocaleString('en-IN');
    document.getElementById('budgetUnitPrefix').textContent = currentSym;
    document.getElementById('lblBudgetTitle').textContent = `${tr('lbl_budget_prefix')} (${currentCurr} ${currentSym})`;
    if (currentLang === 'bn') {
      bdtEstimate.textContent = currentCurr === 'BDT' ? `মোট বাজেট: ৳${toLocNum(totalBdt, 'bn')} টাকা` : `মোট বাজেট: ${currentSym}${toLocNum(totalCurr, 'bn')} ${currentCurr} = ${toLocNum(totalBdt, 'bn')} টাকা`;
      bdtRateHint.textContent = currentCurr === 'BDT' ? `দৈনিক ৳${toLocNum(dailyVal, 'bn')} × ${toLocNum(days, 'bn')} দিন` : `দৈনিক ${currentSym}${toLocNum(dailyVal, 'bn')} × ${toLocNum(days, 'bn')} দিন (১ ${currentCurr} = ${toLocNum(currentRate, 'bn')} ৳)`;
      document.getElementById('minBudgetTick').textContent = `${currentSym}${toLocNum(minB, 'bn')}`;
      document.getElementById('maxBudgetTick').textContent = `${currentSym}${toLocNum(maxB, 'bn')}`;
      document.getElementById('minDaysTick').textContent = `${toLocNum(MIN_DAYS, 'bn')} দিন`;
      document.getElementById('maxDaysTick').textContent = `${toLocNum(MAX_DAYS, 'bn')} দিন`;
    } else {
      bdtEstimate.textContent = currentCurr === 'BDT' ? `Total Budget: ৳${totalBdt} BDT` : `Total Budget: ${currentSym}${totalCurr} ${currentCurr} = ${totalBdt} BDT`;
      bdtRateHint.textContent = currentCurr === 'BDT' ? `Daily ৳${dailyVal} × ${days} Days` : `Daily ${currentSym}${dailyVal} × ${days} Days (1 ${currentCurr} = ${currentRate} BDT)`;
      document.getElementById('minBudgetTick').textContent = `${currentSym}${minB}`;
      document.getElementById('maxBudgetTick').textContent = `${currentSym}${maxB}`;
      document.getElementById('minDaysTick').textContent = `${MIN_DAYS} Days`;
      document.getElementById('maxDaysTick').textContent = `${MAX_DAYS} Days`;
    }
  };

  document.querySelectorAll('.curr-btn').forEach(btn => btn.addEventListener('click', () => {
    if (btn.dataset.curr === currentCurr) return;
    const prevBdt = (Number(toEnNum(budgetInput.value).replace(/[^0-9.]/g, '')) || MIN_UNIT) * currentRate;
    currentCurr = btn.dataset.curr; currentSym = btn.dataset.sym; currentRate = Number(btn.dataset.rate) || 125;
    document.querySelectorAll('.curr-btn').forEach(b => b.classList.toggle('active', b === btn));
    const [minB, maxB, stepB] = getBounds(), nextVal = clamp(Math.round(prevBdt / currentRate), minB, maxB);
    budgetSlider.min = minB; budgetSlider.max = maxB; budgetSlider.step = stepB;
    budgetSlider.value = nextVal; budgetInput.value = toLocNum(nextVal); updateCalc();
  }));
  budgetSlider?.addEventListener('input', () => { budgetInput.value = toLocNum(budgetSlider.value); updateCalc(); });
  durationSlider?.addEventListener('input', () => { durationInput.value = toLocNum(durationSlider.value); updateCalc(); });

  const bindInput = (inp, slider, getMinMax) => {
    inp?.addEventListener('input', () => { const [min, max] = getMinMax(), raw = toEnNum(inp.value).replace(/[^0-9]/g, ''); inp.value = toLocNum(raw); if (raw !== '') slider.value = clamp(Number(raw), min, max); updateCalc(); });
    inp?.addEventListener('blur', () => { const [min, max] = getMinMax(), val = clamp(Number(toEnNum(inp.value).replace(/[^0-9]/g, '')) || min, min, max); slider.value = val; inp.value = toLocNum(val); updateCalc(); });
  };
  bindInput(budgetInput, budgetSlider, getBounds); bindInput(durationInput, durationSlider, () => [MIN_DAYS, MAX_DAYS]);

  const applyTheme = (theme) => {
    currentTheme = theme; localStorage.setItem('nl_camp_theme', theme); document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeIco').textContent = theme === 'dark' ? '☀️' : '🌙';
    document.getElementById('themeLbl').textContent = theme === 'dark' ? tr('theme_light') : tr('theme_dark');
  };
  const applyLanguage = (lang) => {
    currentLang = lang; localStorage.setItem('nl_camp_lang', lang); document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = tr(el.getAttribute('data-i18n')); });
    [budgetInput, durationInput].forEach(inp => { if (inp?.value) inp.value = toLocNum(toEnNum(inp.value), lang); });
    document.getElementById('langIco').textContent = tr('lang_ico'); document.getElementById('langLbl').textContent = tr('lang_lbl');
    applyTheme(currentTheme); updateCalc();
  };

  document.getElementById('themeToggleBtn')?.addEventListener('click', () => { applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); menuDropdown?.classList.add('hidden'); });
  document.getElementById('langToggleBtn')?.addEventListener('click', () => { applyLanguage(currentLang === 'bn' ? 'en' : 'bn'); menuDropdown?.classList.add('hidden'); });
  document.querySelectorAll('.plat-btn').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.plat-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); selectedPlatform = btn.dataset.plat; }));
  const showModal = (title, html) => { modalTitle.textContent = title; modalBody.innerHTML = html; modal.classList.remove('hidden'); menuDropdown?.classList.add('hidden'); };
  document.getElementById('closeModalBtn')?.addEventListener('click', () => modal.classList.add('hidden'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  document.getElementById('aboutHelpBtn')?.addEventListener('click', () => { const cleanTel = toEnNum(supportInfo.phone).replace(/[^+0-9]/g, ''); showModal(tr('about_title'), `<p style="color:var(--text-muted);margin-bottom:12px;">${tr('about_desc')}</p><div class="order-pill"><strong>${tr('about_helpline')}</strong><div style="margin-top:4px;"><a class="help-link" href="tel:${cleanTel}">${toLocNum(supportInfo.phone)}</a></div></div><div class="order-pill"><strong>${tr('about_fb')}</strong><div style="margin-top:4px;"><a class="help-link" href="${supportInfo.fb}" target="_blank" rel="noopener">${supportInfo.fb}</a></div></div><div class="order-pill"><strong>${tr('about_email')}</strong><div style="margin-top:4px;"><a class="help-link" href="mailto:${supportInfo.email}">${supportInfo.email}</a></div></div><p style="font-size:0.8rem;color:var(--hint-color);text-align:center;margin-top:8px;">${toLocNum(tr('about_hours'))}</p>`); });

  form.addEventListener('submit', (e) => {
    e.preventDefault(); const [minB, maxB] = getBounds();
    const dailyVal = clamp(Number(toEnNum(budgetInput.value)) || minB, minB, maxB), days = clamp(Number(toEnNum(durationInput.value)) || MIN_DAYS, MIN_DAYS, MAX_DAYS), totalUsd = +(((dailyVal * currentRate) / 125) * days).toFixed(2);
    showModal(`${selectedPlatform} — ${bdtEstimate.textContent}`, `<form id="confirmOrderForm" style="display:flex;flex-direction:column;gap:10px;"><input type="text" id="cName" class="input-ctrl" placeholder="${tr('ph_name')}" required><input type="tel" id="cPhone" class="input-ctrl" placeholder="${tr('ph_phone')}" required><input type="url" id="cUrl" class="input-ctrl" placeholder="${tr('ph_url')}"><button type="submit" class="btn-submit">${tr('btn_confirm_order')}</button></form>`);
    document.getElementById('confirmOrderForm')?.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const payload = { platform: selectedPlatform, budgetUSD: totalUsd, durationDays: days, customerName: document.getElementById('cName').value, customerPhone: toEnNum(document.getElementById('cPhone').value), pageOrPostUrl: document.getElementById('cUrl').value, notes: `Currency: ${currentCurr} (${currentSym}${dailyVal}/day x ${days} days)` };
      const res = await fetch('/api/submit-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()).catch(() => ({}));
      if (res.success) showModal(tr('order_success_title'), `<div style="text-align:center;padding:10px;"><p>${tr('order_id_lbl')} <strong>${toLocNum(res.order.id)}</strong></p><p style="margin:8px 0;color:var(--text-muted);">${res.order.platform} | ${currentSym}${toLocNum(dailyVal * days)} ${currentCurr} (${toLocNum(days)} ${tr('lbl_days')})</p><p style="color:var(--success);">${tr('order_team_msg')}</p></div>`);
      else alert(res.error || tr('err_submit'));
    });
  });

  document.getElementById('viewOrdersBtn')?.addEventListener('click', async () => {
    showModal(tr('modal_loading'), `<p style="padding:10px;">${tr('modal_loading_desc')}</p>`);
    const data = await fetch('/api/orders').then(r => r.json()).catch(() => null), list = data?.orders || [];
    if (!list.length) return showModal(tr('modal_orders_title'), `<p style="padding:10px;color:var(--text-muted);">${tr('modal_empty')}</p>`);
    showModal(tr('modal_orders_title'), list.map(o => `<div class="order-pill"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><strong>${toLocNum(o.id)}</strong><span class="status-badge ${o.status}">${tr('status_' + o.status) || o.status}</span></div><div>${o.platform} - $${toLocNum(o.budgetUSD)} (${toLocNum(o.durationDays)} ${tr('lbl_days')})</div><small style="color:var(--text-muted);">${tr('lbl_customer')} ${o.customerName} | ${toLocNum(o.customerPhone)}</small></div>`).join(''));
  });
  applyLanguage(currentLang);
});