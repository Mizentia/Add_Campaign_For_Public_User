(function () {
  const rafMap = new WeakMap(), warnTimers = new WeakMap(), typeTimers = new WeakMap();
  let lastSubmitLabel = '';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  function setSliderPct(slider, val) {
    if (!slider) return;
    const min = Number(slider.min) || 0, max = Number(slider.max) || 100, v = Number(val ?? slider.value) || min;
    slider.style.setProperty('--pct', Math.max(0, Math.min(100, ((v - min) / Math.max(1, max - min)) * 100)).toFixed(2) + '%');
  }
  function animateSlider(slider, targetVal) {
    if (!slider) return;
    const prevRaf = rafMap.get(slider); if (prevRaf) cancelAnimationFrame(prevRaf);
    const min = Number(slider.min) || 0, max = Number(slider.max) || 100, dest = Math.max(min, Math.min(max, Number(targetVal) || min));
    const start = Number(slider.value) || min, diff = dest - start; slider.step = 'any';
    if (Math.abs(diff) < 0.01) { slider.value = dest; setSliderPct(slider, dest); return; }
    const t0 = performance.now(), dur = 240, stepFn = (now) => {
      const p = Math.min(1, (now - t0) / dur), cur = start + diff * (1 - Math.pow(1 - p, 3));
      slider.value = p < 1 ? cur : dest; setSliderPct(slider, p < 1 ? cur : dest);
      if (p < 1) rafMap.set(slider, requestAnimationFrame(stepFn));
      else { slider.step = Number.isInteger(dest) ? (slider.dataset.step || '1') : 'any'; slider.value = dest; setSliderPct(slider, dest); }
    };
    rafMap.set(slider, requestAnimationFrame(stepFn));
  }

  function triggerShakeWarn(inp, warnEl, msgText) {
    const box = inp?.closest('.slider-box'), wrap = inp?.closest('.input-unit-wrap');
    wrap?.classList.remove('is-pending-val');
    [box, wrap].forEach((el, i) => { if (!el) return; const cls = i === 0 ? 'box-shake-err' : 'input-shake-err'; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); });
    if (warnEl) { warnEl.textContent = msgText; warnEl.classList.add('show'); }
    clearTimeout(warnTimers.get(inp));
    warnTimers.set(inp, setTimeout(() => { box?.classList.remove('box-shake-err'); wrap?.classList.remove('input-shake-err'); warnEl?.classList.remove('show'); }, 3000));
  }

  function sanitizeRaw(val, allowDec, toEnNum) {
    const en = String(toEnNum(val ?? '')).replace(/।/g, allowDec ? '.' : '');
    if (!allowDec) return en.split('.')[0].replace(/[^0-9]/g, '');
    const clean = en.replace(/[^0-9.]/g, ''), parts = clean.split('.');
    return parts.length === 1 ? parts[0] : `${parts[0] || '0'}.${parts.slice(1).join('').slice(0, 2)}`;
  }

  function bindValidatedInput(inp, slider, warnEl, getMeta, onValidChange) {
    if (!inp || !slider) return;
    const wrap = inp.closest('.input-unit-wrap'), blurInp = () => { if (document.activeElement === inp) inp.blur(); };
    wrap?.addEventListener('click', (e) => { if (e.target !== inp) inp.focus(); });
    ['pointerdown', 'touchstart', 'input'].forEach(ev => slider.addEventListener(ev, blurInp, { passive: true }));
    const clampToBound = (isMax) => {
      const { min, max, sym, unit, tr, toLocNum } = getMeta(), target = isMax ? max : min;
      const disp = sym ? `${sym} ${toLocNum(target)}` : `${toLocNum(target)} ${unit || ''}`.trim();
      inp.value = toLocNum(target); animateSlider(slider, target);
      triggerShakeWarn(inp, warnEl, tr(isMax ? 'warn_above_max' : 'warn_below_min').replace(isMax ? '{max}' : '{min}', disp).replace('{min}', disp));
      onValidChange();
    };
    inp.addEventListener('input', () => {
      clearTimeout(typeTimers.get(inp));
      const { min, max, hasLim, allowDec, toEnNum, toLocNum } = getMeta();
      const sel = inp.selectionStart, prevLen = inp.value.length, raw = sanitizeRaw(inp.value, allowDec, toEnNum), loc = toLocNum(raw);
      if (inp.value !== loc) { inp.value = loc; try { const pos = Math.max(0, (sel ?? loc.length) + (loc.length - prevLen)); inp.setSelectionRange(pos, pos); } catch (_) {} }
      if (raw === '' || raw === '.') { wrap?.classList.add('is-pending-val'); typeTimers.set(inp, setTimeout(() => { if (sanitizeRaw(inp.value, allowDec, toEnNum) === '') clampToBound(false); }, 2800)); return; }
      const num = Number(raw);
      if (hasLim && num > max) { wrap?.classList.add('is-pending-val'); typeTimers.set(inp, setTimeout(() => { const c = Number(sanitizeRaw(inp.value, allowDec, toEnNum) || 0); if (hasLim && c > max) clampToBound(true); }, 750)); return; }
      if (num < min) { wrap?.classList.add('is-pending-val'); typeTimers.set(inp, setTimeout(() => { const s = sanitizeRaw(inp.value, allowDec, toEnNum), c = Number(s || 0); if (s === '' || c < min) clampToBound(false); }, 2200)); return; }
      wrap?.classList.remove('is-pending-val'); warnEl?.classList.remove('show');
      animateSlider(slider, Math.min(max, num)); onValidChange();
    });
    inp.addEventListener('blur', () => {
      clearTimeout(typeTimers.get(inp)); wrap?.classList.remove('is-pending-val');
      const { min, max, hasLim, allowDec, toEnNum, toLocNum } = getMeta();
      const raw = sanitizeRaw(inp.value, allowDec, toEnNum), num = Number(raw);
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

  function renderCalcUI({ activeCurr, activePlat, totals, tr, toLocNum, getPlatName, isBn }) {
    const { code, sym, rate, minBudget, maxBudget, minDays, maxDays } = activeCurr;
    const { dailyVal, dailyDisp, days, totalCurr, baseBdt, vatPct, markupPct, vatBdt, markupBdt, totalBdtNum, bLim, dLim } = totals;
    const bdtChip = `<span class="bdt-sym">৳</span>`, currSymChip = `<span class="sym-chip">${esc(sym)}</span>`;
    document.getElementById('minBudgetTick').innerHTML = `<span class="tick-badge">${currSymChip}<span class="num-chip">${toLocNum(minBudget)}</span></span>`;
    document.getElementById('maxBudgetTick').innerHTML = `<span class="tick-badge">${currSymChip}<span class="num-chip">${toLocNum(maxBudget)}${!bLim ? '+' : ''}</span></span>`;
    document.getElementById('minDaysTick').innerHTML = `<span class="tick-badge"><span class="num-chip">${toLocNum(minDays)}</span><span class="unit-chip">${esc(tr('lbl_days'))}</span></span>`;
    document.getElementById('maxDaysTick').innerHTML = `<span class="tick-badge"><span class="num-chip">${toLocNum(maxDays)}${!dLim ? '+' : ''}</span><span class="unit-chip">${esc(tr('lbl_days'))}</span></span>`;
    const fmtNum = (n) => toLocNum(Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })), platName = esc(getPlatName(activePlat));
    const currPill = (val) => `<span class="curr-pill"><span>${esc(sym)}</span><span>${fmtNum(val)}</span><span>${esc(code)}</span></span>`;
    const box = document.getElementById('calcBreakdown');
    if (box) box.innerHTML = `<div class="bill-row"><span class="bill-lbl">💱 <strong>${tr('bill_rate_lbl')}</strong> <span class="bill-tag">${esc(code)}</span></span><span class="bill-val">${currPill(1)} = ${bdtChip}<span>${fmtNum(rate)}</span></span></div><div class="bill-row"><span class="bill-lbl">📊 <strong>${tr('bill_base_lbl')}</strong> (${esc(sym)}${toLocNum(dailyDisp ?? dailyVal)} × ${toLocNum(days)} ${esc(tr('lbl_days'))})</span><span class="bill-val">${code !== 'BDT' ? currPill(totalCurr) + ' • ' : ''}${bdtChip}<span>${fmtNum(baseBdt)}</span></span></div><div class="bill-row"><span class="bill-lbl">🏛️ <strong>${platName} ${tr('bill_vat_lbl')}</strong> <span class="bill-tag">${toLocNum(vatPct)}%</span></span><span class="bill-val">+ ${bdtChip}<span>${fmtNum(vatBdt)}</span></span></div><div class="bill-row"><span class="bill-lbl">🏦 <strong>${esc(code)} ${tr('bill_markup_lbl')}</strong> <span class="bill-tag">${toLocNum(markupPct)}%</span></span><span class="bill-val">+ ${bdtChip}<span>${fmtNum(markupBdt)}</span></span></div><div class="bill-total-row"><span class="bill-total-lbl">🧾 ${tr('bill_total_lbl')}</span><span class="bill-total-val">${code !== 'BDT' ? currPill(totalCurr) : ''}${bdtChip}<span>${fmtNum(totalBdtNum)} ${isBn ? 'টাকা' : 'BDT'}</span></span></div>`;
    lastSubmitLabel = tr('btn_submit_with_total').replace('{total}', fmtNum(totalBdtNum));
    const btn = document.getElementById('submitBtn');
    if (btn && !btn.classList.contains('is-cooldown') && !btn.classList.contains('is-loading')) btn.textContent = lastSubmitLabel;
  }

  window.CalcUI = { setSliderPct, animateSlider, bindValidatedInput, renderCalcUI, getReadySubmitLabel: () => lastSubmitLabel };
})();
