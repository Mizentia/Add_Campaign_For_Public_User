(function () {
  const rafMap = new WeakMap(), warnTimers = new WeakMap(), typeTimers = new WeakMap(); let lastSubmitLabel = '';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  function setSliderPct(slider, val) {
    if (!slider) return;
    const min = Number(slider.min) || 0, max = Number(slider.max) || 100, v = Number(val ?? slider.value) || min;
    slider.style.setProperty('--pct', Math.max(0, Math.min(100, ((v - min) / Math.max(0.0001, max - min)) * 100)).toFixed(2) + '%');
  }
  function animateSlider(slider, targetVal) {
    if (!slider) return;
    const prevRaf = rafMap.get(slider); if (prevRaf) cancelAnimationFrame(prevRaf);
    const min = Number(slider.min) || 0, max = Number(slider.max) || 100, dest = Math.max(min, Math.min(max, Number(targetVal) || min));
    const start = Number(slider.value) || min, diff = dest - start; slider.step = 'any';
    if (Math.abs(diff) < 0.005) { slider.value = dest; setSliderPct(slider, dest); return; }
    const t0 = performance.now(), dur = 240, stepFn = (now) => {
      const p = Math.min(1, (now - t0) / dur), cur = start + diff * (1 - Math.pow(1 - p, 3));
      slider.value = p < 1 ? cur : dest; setSliderPct(slider, p < 1 ? cur : dest);
      if (p < 1) rafMap.set(slider, requestAnimationFrame(stepFn)); else { slider.value = dest; setSliderPct(slider, dest); }
    };
    rafMap.set(slider, requestAnimationFrame(stepFn));
  }
  function triggerShakeWarn(inp, warnEl, msgText) {
    const box = inp?.closest('.slider-box'), wrap = inp?.closest('.input-unit-wrap'); wrap?.classList.remove('is-pending-val');
    [box, wrap].forEach((el, i) => { if (!el) return; const cls = i === 0 ? 'box-shake-err' : 'input-shake-err'; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); });
    if (warnEl) { warnEl.textContent = msgText; warnEl.classList.add('show'); }
    clearTimeout(warnTimers.get(inp)); warnTimers.set(inp, setTimeout(() => { box?.classList.remove('box-shake-err'); wrap?.classList.remove('input-shake-err'); warnEl?.classList.remove('show'); }, 3000));
  }
  function sanitizeRaw(val, allowDec, toEnNum) {
    const en = String(toEnNum(val ?? '')).replace(/।/g, allowDec ? '.' : '');
    if (!allowDec) return en.split('.')[0].replace(/[^0-9]/g, '');
    const clean = en.replace(/[^0-9.]/g, ''), parts = clean.split('.');
    return parts.length === 1 ? parts[0] : `${parts[0] || '0'}.${parts.slice(1).join('').slice(0, 2)}`;
  }
  function bindValidatedInput(inp, slider, warnEl, getMeta, onValidChange) {
    if (!inp || !slider) return;
    const wrap = inp.closest('.input-unit-wrap'), unlockInp = () => { inp.readOnly = false; }, lockBlurInp = () => { inp.readOnly = true; if (document.activeElement === inp) inp.blur(); };
    inp.readOnly = true; ['pointerdown', 'touchstart', 'mousedown'].forEach(ev => (wrap || inp).addEventListener(ev, unlockInp, { passive: true }));
    wrap?.addEventListener('click', (e) => { inp.readOnly = false; if (e.target !== inp) inp.focus(); });
    ['pointerdown', 'touchstart', 'input'].forEach(ev => slider.addEventListener(ev, lockBlurInp, { passive: true }));
    const clampToBound = (isMax) => {
      const { min, max, sym, unit, tr, toLocNum } = getMeta(), target = isMax ? max : min, disp = sym ? `${sym} ${toLocNum(target)}` : `${toLocNum(target)} ${unit || ''}`.trim();
      inp.value = toLocNum(target); animateSlider(slider, target);
      triggerShakeWarn(inp, warnEl, tr(isMax ? 'warn_above_max' : 'warn_below_min').replace(isMax ? '{max}' : '{min}', disp).replace('{min}', disp)); onValidChange();
    };
    inp.addEventListener('input', () => {
      clearTimeout(typeTimers.get(inp)); const { min, max, hasLim, allowDec, toEnNum, toLocNum } = getMeta();
      const sel = inp.selectionStart, prevLen = inp.value.length, raw = sanitizeRaw(inp.value, allowDec, toEnNum), loc = toLocNum(raw);
      if (inp.value !== loc) { inp.value = loc; try { const pos = Math.max(0, (sel ?? loc.length) + (loc.length - prevLen)); inp.setSelectionRange(pos, pos); } catch (_) {} }
      if (raw === '' || raw === '.') { wrap?.classList.add('is-pending-val'); typeTimers.set(inp, setTimeout(() => { if (sanitizeRaw(inp.value, allowDec, toEnNum) === '') clampToBound(false); }, 2800)); return; }
      const num = Number(raw);
      if (hasLim && num > max) { wrap?.classList.add('is-pending-val'); typeTimers.set(inp, setTimeout(() => { const c = Number(sanitizeRaw(inp.value, allowDec, toEnNum) || 0); if (hasLim && c > max) clampToBound(true); }, 750)); return; }
      if (num < min) { wrap?.classList.add('is-pending-val'); typeTimers.set(inp, setTimeout(() => { const s = sanitizeRaw(inp.value, allowDec, toEnNum), c = Number(s || 0); if (s === '' || c < min) clampToBound(false); }, 2200)); return; }
      wrap?.classList.remove('is-pending-val'); warnEl?.classList.remove('show'); animateSlider(slider, Math.min(max, num)); onValidChange();
    });
    inp.addEventListener('blur', () => {
      inp.readOnly = true; clearTimeout(typeTimers.get(inp)); wrap?.classList.remove('is-pending-val');
      const { min, max, hasLim, allowDec, toEnNum, toLocNum } = getMeta(), raw = sanitizeRaw(inp.value, allowDec, toEnNum), num = Number(raw);
      if (raw === '' || !Number.isFinite(num) || num < min) return clampToBound(false);
      if (hasLim && num > max) return clampToBound(true);
      const [iP, dP = ''] = raw.split('.'), fmt = allowDec && raw.includes('.') && dP.length ? `${Number(iP)}.${dP.slice(0, 2)}` : String(allowDec ? +num.toFixed(2) : Math.round(num));
      inp.value = toLocNum(fmt); animateSlider(slider, Math.min(max, Number(fmt))); onValidChange();
    });
    inp.addEventListener('keydown', (e) => {
      if (!getMeta().allowDec && ['.', ',', '।', '-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    });
  }
  function fitBillRows(box = document.getElementById('calcBreakdown')) {
    if (!box) return;
    box.querySelectorAll('.bill-row, .bill-total-row').forEach(row => {
      row.dataset.step = '0';
      const txt = row.querySelector('.bill-txt'), ico = row.querySelector('.bill-ico'), daily = row.querySelector('.bf-daily'), tag = row.querySelector('.bf-days, .bill-tag');
      [txt, ico, daily, tag].forEach(el => el?.classList.remove('is-shrinking'));
      const checkFit = (el, minW) => { if (!el || el.clientWidth <= minW || row.scrollWidth > row.clientWidth + 1) return false; if (el.clientWidth < el.scrollWidth - 2) el.classList.add('is-shrinking'); return true; };
      if (checkFit(txt, 10)) return;
      row.dataset.step = '1'; if (checkFit(ico, 8)) return;
      row.dataset.step = daily ? '2' : '3'; if (daily && checkFit(daily, 14)) return;
      row.dataset.step = '3'; if (checkFit(tag, 12)) return;
      row.dataset.step = '4';
    });
  }
  function renderCalcUI({ activeCurr, activePlat, totals, tr, toLocNum, getPlatName }) {
    const { code, sym, rate, minBudget, maxBudget, minDays, maxDays } = activeCurr;
    const { dailyVal, dailyDisp, days, totalCurr, baseBdt, vatPct, markupPct, vatBdt, markupBdt, totalBdtNum, bLim, dLim } = totals, currSymChip = `<span class="sym-chip">${esc(sym)}</span>`;
    document.getElementById('minBudgetTick').innerHTML = `<span class="tick-badge">${currSymChip}<span class="num-chip">${toLocNum(minBudget)}</span></span>`;
    document.getElementById('maxBudgetTick').innerHTML = `<span class="tick-badge">${currSymChip}<span class="num-chip">${toLocNum(maxBudget)}${!bLim ? '+' : ''}</span></span>`;
    document.getElementById('minDaysTick').innerHTML = `<span class="tick-badge"><span class="num-chip">${toLocNum(minDays)}</span><span class="unit-chip">${esc(tr('lbl_days'))}</span></span>`;
    document.getElementById('maxDaysTick').innerHTML = `<span class="tick-badge"><span class="num-chip">${toLocNum(maxDays)}${!dLim ? '+' : ''}</span><span class="unit-chip">${esc(tr('lbl_days'))}</span></span>`;
    const fmtNum = (n, maxF = 2) => toLocNum(Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: maxF })), platName = esc(getPlatName(activePlat));
    const currPill = (val) => `<span class="curr-pill"><span class="cp-sym">${esc(sym)}</span><span class="cp-num">${fmtNum(val)}</span></span>`, bdtPill = (val, cls = '', maxF = 2) => `<span class="bdt-pill ${cls}"><span class="bdt-sym">৳</span><span class="bdt-num">${fmtNum(val, maxF)}</span></span>`;
    const formulaBadge = `<span class="bill-formula"><span class="bf-daily"><span class="bf-sym">${esc(sym)}</span><span class="bf-num">${toLocNum(dailyDisp ?? dailyVal)}</span><span class="bf-mul">×</span></span><span class="bf-days">${toLocNum(days)} ${esc(tr('lbl_days'))}</span></span>`, box = document.getElementById('calcBreakdown');
    if (box) { box.innerHTML = `<div class="bill-row"><span class="bill-lbl"><span class="bill-ico">💱</span><strong class="bill-txt">${tr('bill_rate_lbl')}</strong><span class="bill-tag">${esc(code)}</span></span><span class="bill-val">${currPill(1)}<span class="bill-op">=</span>${bdtPill(rate, '', 4)}</span></div><div class="bill-row"><span class="bill-lbl"><span class="bill-ico">📊</span><strong class="bill-txt">${tr('bill_base_lbl')}</strong>${formulaBadge}</span><span class="bill-val">${code !== 'BDT' ? currPill(totalCurr) : ''}${bdtPill(baseBdt)}</span></div><div class="bill-row"><span class="bill-lbl"><span class="bill-ico">🏛️</span><strong class="bill-txt">${esc(code)} ${tr('bill_vat_lbl')}</strong><span class="bill-tag">${toLocNum(vatPct)}%</span></span><span class="bill-val"><span class="bill-op">+</span>${bdtPill(vatBdt)}</span></div><div class="bill-row"><span class="bill-lbl"><span class="bill-ico">🏦</span><strong class="bill-txt">${esc(code)} ${tr('bill_markup_lbl')}</strong><span class="bill-tag">${toLocNum(markupPct)}%</span></span><span class="bill-val"><span class="bill-op">+</span>${bdtPill(markupBdt)}</span></div><div class="bill-total-row"><span class="bill-lbl bill-total-lbl"><span class="bill-ico">🧾</span><strong class="bill-txt">${tr('bill_total_lbl')}</strong></span><span class="bill-total-val">${code !== 'BDT' ? currPill(totalCurr) : ''}${bdtPill(totalBdtNum, 'is-total')}</span></div>`; fitBillRows(box); if (!box._ro && window.ResizeObserver) { box._ro = new ResizeObserver(() => fitBillRows(box)); box._ro.observe(box); } }
    lastSubmitLabel = tr('btn_submit_with_total').replace('{total}', fmtNum(totalBdtNum));
    const btn = document.getElementById('submitBtn'); if (btn && !btn.classList.contains('is-cooldown') && !btn.classList.contains('is-loading')) btn.textContent = lastSubmitLabel;
  }
  window.addEventListener('resize', () => fitBillRows());
  window.CalcUI = { setSliderPct, animateSlider, bindValidatedInput, renderCalcUI, fitBillRows, getReadySubmitLabel: () => lastSubmitLabel };
})();