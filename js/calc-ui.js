(function () {
  const rafMap = new WeakMap(), warnTimers = new WeakMap(), typeTimers = new WeakMap();
  let lastSubmitLabel = '';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  function setSliderPct(slider, val) {
    if (!slider) return;
    const min = Number(slider.min) || 0, max = Number(slider.max) || 100, v = Number(val ?? slider.value) || min;
    const pct = Math.max(0, Math.min(100, ((v - min) / Math.max(1, max - min)) * 100));
    slider.style.setProperty('--pct', pct.toFixed(2) + '%');
  }

  function animateSlider(slider, targetVal) {
    if (!slider) return;
    const prevRaf = rafMap.get(slider);
    if (prevRaf) cancelAnimationFrame(prevRaf);
    const min = Number(slider.min) || 0, max = Number(slider.max) || 100;
    const dest = Math.max(min, Math.min(max, Number(targetVal) || min));
    const start = Number(slider.value) || min, diff = dest - start;
    if (Math.abs(diff) < 0.05) { slider.value = dest; setSliderPct(slider, dest); return; }
    slider.step = 'any';
    const t0 = performance.now(), dur = 260;
    const stepFn = (now) => {
      const p = Math.min(1, (now - t0) / dur), ease = 1 - Math.pow(1 - p, 3), cur = start + diff * ease;
      slider.value = p < 1 ? cur : dest;
      setSliderPct(slider, p < 1 ? cur : dest);
      if (p < 1) rafMap.set(slider, requestAnimationFrame(stepFn));
      else { slider.step = slider.dataset.step || '1'; slider.value = dest; setSliderPct(slider, dest); }
    };
    rafMap.set(slider, requestAnimationFrame(stepFn));
  }

  function triggerShakeWarn(inp, warnEl, msgText) {
    const box = inp?.closest('.slider-box'), wrap = inp?.closest('.input-unit-wrap');
    [box, wrap].forEach((el, i) => { if (!el) return; const cls = i === 0 ? 'box-shake-err' : 'input-shake-err'; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); });
    if (warnEl) { warnEl.textContent = msgText; warnEl.classList.add('show'); }
    clearTimeout(warnTimers.get(inp));
    warnTimers.set(inp, setTimeout(() => { box?.classList.remove('box-shake-err'); wrap?.classList.remove('input-shake-err'); warnEl?.classList.remove('show'); }, 2600));
  }

  function bindValidatedInput(inp, slider, warnEl, getMeta, onValidChange) {
    if (!inp || !slider) return;
    const resetToMin = (reasonKey) => {
      const { min, sym, unit, tr, toLocNum } = getMeta();
      const dispMin = sym ? `${sym} ${toLocNum(min)}` : `${toLocNum(min)} ${unit || ''}`.trim();
      inp.value = toLocNum(min);
      animateSlider(slider, min);
      triggerShakeWarn(inp, warnEl, tr(reasonKey).replace('{min}', dispMin));
      onValidChange();
    };
    inp.addEventListener('input', () => {
      clearTimeout(typeTimers.get(inp));
      const { min, max, hasLim, toEnNum, toLocNum } = getMeta();
      const raw = toEnNum(inp.value).replace(/[^0-9]/g, '');
      inp.value = toLocNum(raw);
      if (raw === '') { typeTimers.set(inp, setTimeout(() => { if (toEnNum(inp.value).replace(/[^0-9]/g, '') === '') resetToMin('warn_below_min'); }, 850)); return; }
      const num = Number(raw);
      if (hasLim && num > max) { resetToMin('warn_above_max'); return; }
      if (num < min) { typeTimers.set(inp, setTimeout(() => { const cur = Number(toEnNum(inp.value).replace(/[^0-9]/g, '') || 0); if (cur < min) resetToMin('warn_below_min'); }, 750)); return; }
      warnEl?.classList.remove('show');
      animateSlider(slider, Math.min(max, num));
      onValidChange();
    });
    inp.addEventListener('blur', () => {
      clearTimeout(typeTimers.get(inp));
      const { min, max, hasLim, toEnNum, toLocNum } = getMeta();
      const raw = toEnNum(inp.value).replace(/[^0-9]/g, ''), num = Number(raw);
      if (raw === '' || num < min) return resetToMin('warn_below_min');
      if (hasLim && num > max) return resetToMin('warn_above_max');
      inp.value = toLocNum(num); animateSlider(slider, Math.min(max, num)); onValidChange();
    });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
  }

  function renderCalcUI({ activeCurr, activePlat, totals, tr, toLocNum, getPlatName, isBn }) {
    const { code, sym, rate, minBudget, maxBudget, minDays, maxDays } = activeCurr;
    const { dailyVal, days, totalCurr, baseBdt, vatPct, markupPct, totalBdtNum, bLim, dLim } = totals;
    const bdtChip = `<span class="bdt-sym">৳</span>`, currSymChip = `<span class="sym-chip">${esc(sym)}</span>`;
    document.getElementById('minBudgetTick').innerHTML = `<span class="tick-badge">${currSymChip}<span class="num-chip">${toLocNum(minBudget)}</span></span>`;
    document.getElementById('maxBudgetTick').innerHTML = `<span class="tick-badge">${currSymChip}<span class="num-chip">${toLocNum(maxBudget)}${!bLim ? '+' : ''}</span></span>`;
    document.getElementById('minDaysTick').innerHTML = `<span class="tick-badge"><span class="num-chip">${toLocNum(minDays)}</span><span class="unit-chip">${esc(tr('lbl_days'))}</span></span>`;
    document.getElementById('maxDaysTick').innerHTML = `<span class="tick-badge"><span class="num-chip">${toLocNum(maxDays)}${!dLim ? '+' : ''}</span><span class="unit-chip">${esc(tr('lbl_days'))}</span></span>`;
    const vatBdt = Math.round(baseBdt * (vatPct / 100)), markupBdt = Math.round(baseBdt * (markupPct / 100));
    const fmtBdt = (n) => toLocNum(Number(n || 0).toLocaleString('en-IN')), platName = esc(getPlatName(activePlat));
    const currPill = (val) => `<span class="curr-pill"><span>${esc(sym)}</span><span>${toLocNum(val)}</span><span>${esc(code)}</span></span>`;
    const box = document.getElementById('calcBreakdown');
    if (box) box.innerHTML = `<div class="bill-row"><span class="bill-lbl">💱 <strong>${tr('bill_rate_lbl')}</strong> <span class="bill-tag">${esc(code)}</span></span><span class="bill-val">${currPill(1)} = ${bdtChip}<span>${fmtBdt(rate)}</span></span></div><div class="bill-row"><span class="bill-lbl">📊 <strong>${tr('bill_base_lbl')}</strong> (${esc(sym)}${toLocNum(dailyVal)} × ${toLocNum(days)} ${esc(tr('lbl_days'))})</span><span class="bill-val">${code !== 'BDT' ? currPill(totalCurr) + ' • ' : ''}${bdtChip}<span>${fmtBdt(baseBdt)}</span></span></div><div class="bill-row"><span class="bill-lbl">🏛️ <strong>${platName} ${tr('bill_vat_lbl')}</strong> <span class="bill-tag">${toLocNum(vatPct)}%</span></span><span class="bill-val">+ ${bdtChip}<span>${fmtBdt(vatBdt)}</span></span></div><div class="bill-row"><span class="bill-lbl">🏦 <strong>${esc(code)} ${tr('bill_markup_lbl')}</strong> <span class="bill-tag">${toLocNum(markupPct)}%</span></span><span class="bill-val">+ ${bdtChip}<span>${fmtBdt(markupBdt)}</span></span></div><div class="bill-total-row"><span class="bill-total-lbl">🧾 ${tr('bill_total_lbl')}</span><span class="bill-total-val">${code !== 'BDT' ? currPill(totalCurr) : ''}${bdtChip}<span>${fmtBdt(totalBdtNum)} ${isBn ? 'টাকা' : 'BDT'}</span></span></div>`;
    lastSubmitLabel = tr('btn_submit_with_total').replace('{total}', fmtBdt(totalBdtNum));
    const btn = document.getElementById('submitBtn');
    if (btn && !btn.classList.contains('is-cooldown') && !btn.classList.contains('is-loading')) btn.textContent = lastSubmitLabel;
  }

  window.CalcUI = { setSliderPct, animateSlider, bindValidatedInput, renderCalcUI, getReadySubmitLabel: () => lastSubmitLabel };
})();
