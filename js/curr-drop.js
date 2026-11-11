(function () {
  const HOLD_MS = 450, SHOW_MS = 3400;
  const norm = (s) => String(s ?? '').toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim();
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

  function bindNameReveal(btn) {
    let holdT = null, hideT = null, held = false;
    const hide = () => { clearTimeout(hideT); btn.classList.remove('show-name'); };
    const show = () => { btn.classList.add('show-name'); clearTimeout(hideT); hideT = setTimeout(hide, SHOW_MS); };
    const cancel = () => clearTimeout(holdT);
    btn.addEventListener('touchstart', () => { held = false; cancel(); holdT = setTimeout(() => { held = true; show(); }, HOLD_MS); }, { passive: true });
    btn.addEventListener('touchend', () => { cancel(); setTimeout(() => { held = false; }, 350); }, { passive: true });
    ['touchmove', 'touchcancel'].forEach(ev => btn.addEventListener(ev, cancel, { passive: true }));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    btn.addEventListener('click', (e) => { if (held) { e.preventDefault(); e.stopImmediatePropagation(); held = false; } }, true);
    if (window.matchMedia?.('(hover: hover)').matches) { btn.addEventListener('mouseenter', show); btn.addEventListener('mouseleave', hide); }
  }

  function render({ menu, list, overflowCodes, tr, getFlag, getName, onPick }) {
    if (!menu) return;
    const items = list.map(c => {
      const q = norm([c.code, c.sym, c.nameEn, c.nameBn].join(' '));
      return `<button type="button" class="curr-btn" data-curr="${esc(c.code)}" data-ov="${overflowCodes.includes(c.code) ? 1 : 0}" data-q="${esc(q)}">${getFlag(c)}<span class="curr-sym">${esc(c.sym)}</span><span class="curr-code">${esc(c.code)}</span><span class="curr-drop-name">• ${esc(getName(c))}</span></button>`;
    }).join('');
    menu.innerHTML = `<input type="text" id="currSearchInp" class="input-ctrl curr-search-inp" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="${esc(tr('ph_curr_search'))}"><div class="curr-drop-list">${items}</div><div id="currNoMatch" class="curr-no-match hidden">${esc(tr('curr_no_match'))}</div>`;
    const inp = menu.querySelector('#currSearchInp'), noM = menu.querySelector('#currNoMatch'), btns = [...menu.querySelectorAll('.curr-btn')];
    const filter = () => {
      const tokens = norm(inp.value).split(' ').filter(Boolean); let n = 0;
      btns.forEach(b => { const ok = tokens.length ? tokens.every(t => b.dataset.q.includes(t)) : b.dataset.ov === '1'; b.classList.toggle('hidden', !ok); if (ok) n++; });
      noM.classList.toggle('hidden', n > 0);
    };
    ['click', 'pointerdown', 'touchstart', 'mousedown'].forEach(ev => inp.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));
    inp.addEventListener('input', filter); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
    btns.forEach(b => { bindNameReveal(b); b.addEventListener('click', () => onPick(b.dataset.curr)); });
    filter();
  }
  window.CurrDrop = { render };
})();
