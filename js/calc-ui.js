(function () {
  const rafMap = new WeakMap(), warnTimers = new WeakMap(), typeTimers = new WeakMap(); let lastSubmitLabel = '';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const setSliderPct = (slider, val) => {
    if (!slider) return; const min = Number(slider.min) || 0, max = Number(slider.max) || 100, v = Number(val ?? slider.value) || min;
    slider.style.setProperty('--pct', Math.max(0, Math.min(100, ((v - min) / Math.max(0.0001, max - min)) * 100)).toFixed(2) + '%');
  };
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
  const sanitizeRaw = (val, allowDec, toEnNum) => {
    const en = String(toEnNum(val ?? '')).replace(/।/g, allowDec ? '.' : '');
    if (!allowDec) return en.split('.')[0].replace(/[^0-9]/g, '');
    const clean = en.replace(/[^0-9.]/g, ''), p = clean.split('.'); return p.length === 1 ? p[0] : `${p[0] || '0'}.${p.slice(1).join('').slice(0, 2)}`;
  };
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
  let fitRaf = 0, lastTicksKey = ''; const scheduleFit = (box = document.getElementById('calcBreakdown')) => { if (!box) return; if (fitRaf) cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(() => { fitRaf = 0; fitBillRows(box); }); };
  function fitBillRows(box = document.getElementById('calcBreakdown')) {
    box?.querySelectorAll('.bill-row, .bill-total-row').forEach(row => {
      row.dataset.step = '0'; const txt = row.querySelector('.bill-txt'), ico = row.querySelector('.bill-ico'), daily = row.querySelector('.bf-daily'), tag = row.querySelector('.bf-days, .bill-tag');
      [txt, ico, daily, tag].forEach(el => el?.classList.remove('is-shrinking'));
      const fit = (el, minW) => { if (!el || el.clientWidth <= minW || row.scrollWidth > row.clientWidth + 1) return false; if (el.clientWidth < el.scrollWidth - 2) el.classList.add('is-shrinking'); return true; };
      if (fit(txt, 10)) return; row.dataset.step = '1'; if (fit(ico, 8)) return; row.dataset.step = daily ? '2' : '3'; if (daily && fit(daily, 14)) return; row.dataset.step = '3'; if (fit(tag, 12)) return; row.dataset.step = '4';
    });
  }
  function renderCalcUI({ activeCurr, totals, tr, toLocNum }) {
    const { code, sym, rate, minBudget, maxBudget, minDays, maxDays } = activeCurr, { dailyVal, dailyDisp, days, totalCurr, baseBdt, vatPct, markupPct, vatBdt, markupBdt, totalBdtNum, bLim, dLim } = totals;
    const ticksKey = `${code}|${sym}|${minBudget}|${maxBudget}|${bLim}|${minDays}|${maxDays}|${dLim}|${tr('lbl_days')}`;
    if (lastTicksKey !== ticksKey) {
      lastTicksKey = ticksKey; const symC = `<span class="sym-chip">${esc(sym)}</span>`, uC = `<span class="unit-chip">${esc(tr('lbl_days'))}</span>`;
      [['minBudgetTick', `${symC}<span class="num-chip">${toLocNum(minBudget)}</span>`], ['maxBudgetTick', `${symC}<span class="num-chip">${toLocNum(maxBudget)}${!bLim ? '+' : ''}</span>`], ['minDaysTick', `<span class="num-chip">${toLocNum(minDays)}</span>${uC}`], ['maxDaysTick', `<span class="num-chip">${toLocNum(maxDays)}${!dLim ? '+' : ''}</span>${uC}`]].forEach(([id, h]) => { document.getElementById(id).innerHTML = `<span class="tick-badge">${h}</span>`; });
    }
    const fmtNum = (n, maxF = 2) => toLocNum(Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: maxF })), box = document.getElementById('calcBreakdown');
    if (box) {
      const modeKey = `${code}|${sym}|${tr('bill_rate_lbl')}|${tr('lbl_days')}`;
      if (box.dataset.mode !== modeKey || !box._refs) {
        const cP = (k) => `<span class="curr-pill"><span class="cp-sym">${esc(sym)}</span><span class="cp-num" data-c="${k}"></span></span>`, bP = (k, cls = '') => `<span class="bdt-pill ${cls}"><span class="bdt-sym">৳</span><span class="bdt-num" data-c="${k}"></span></span>`, fB = `<span class="bill-formula"><span class="bf-daily"><span class="bf-sym">${esc(sym)}</span><span class="bf-num" data-c="daily"></span><span class="bf-mul">×</span></span><span class="bf-days" data-c="days"></span></span>`;
        box.innerHTML = `<div class="bill-row"><span class="bill-lbl"><span class="bill-ico">💱</span><strong class="bill-txt">${tr('bill_rate_lbl')}</strong><span class="bill-tag">${esc(code)}</span></span><span class="bill-val">${cP('one')}<span class="bill-op">=</span>${bP('rate')}</span></div><div class="bill-row"><span class="bill-lbl"><span class="bill-ico">📊</span><strong class="bill-txt">${tr('bill_base_lbl')}</strong>${fB}</span><span class="bill-val">${code !== 'BDT' ? cP('baseC') : ''}${bP('baseB')}</span></div><div class="bill-row"><span class="bill-lbl"><span class="bill-ico">🏛️</span><strong class="bill-txt">${esc(code)} ${tr('bill_vat_lbl')}</strong><span class="bill-tag" data-c="vatP"></span></span><span class="bill-val"><span class="bill-op">+</span>${bP('vatB')}</span></div><div class="bill-row"><span class="bill-lbl"><span class="bill-ico">🏦</span><strong class="bill-txt">${esc(code)} ${tr('bill_markup_lbl')}</strong><span class="bill-tag" data-c="mkP"></span></span><span class="bill-val"><span class="bill-op">+</span>${bP('mkB')}</span></div><div class="bill-total-row"><span class="bill-lbl bill-total-lbl"><span class="bill-ico">🧾</span><strong class="bill-txt">${tr('bill_total_lbl')}</strong></span><span class="bill-total-val">${code !== 'BDT' ? cP('totC') : ''}${bP('totB', 'is-total')}</span></div>`;
        box.dataset.mode = modeKey; box._refs = Object.fromEntries([...box.querySelectorAll('[data-c]')].map(el => [el.dataset.c, el]));
        if (!box._ro && window.ResizeObserver) { box._ro = new ResizeObserver(() => scheduleFit(box)); box._ro.observe(box); }
      }
      const totCurrFmt = fmtNum(totalCurr), vals = { one: toLocNum(1), rate: fmtNum(rate, 4), daily: toLocNum(dailyDisp ?? dailyVal), days: `${toLocNum(days)} ${tr('lbl_days')}`, baseC: totCurrFmt, baseB: fmtNum(baseBdt), vatP: `${toLocNum(vatPct)}%`, vatB: fmtNum(vatBdt), mkP: `${toLocNum(markupPct)}%`, mkB: fmtNum(markupBdt), totC: totCurrFmt, totB: fmtNum(totalBdtNum) };
      for (const k in vals) if (box._refs[k] && box._refs[k].textContent !== vals[k]) box._refs[k].textContent = vals[k];
      scheduleFit(box);
    }
    lastSubmitLabel = tr('btn_submit_with_total').replace('{total}', fmtNum(totalBdtNum));
    const btn = document.getElementById('submitBtn'); if (btn && !btn.classList.contains('is-cooldown') && !btn.classList.contains('is-loading') && btn.textContent !== lastSubmitLabel) btn.textContent = lastSubmitLabel;
  }
  window.addEventListener('resize', () => scheduleFit());
  window.CalcUI = { setSliderPct, animateSlider, bindValidatedInput, renderCalcUI, fitBillRows, getReadySubmitLabel: () => lastSubmitLabel };
})();