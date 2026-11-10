(function () {
  const COOLDOWN_KEY = 'nl_camp_last_order_ts', COOLDOWN_MS = 60 * 1000;
  let cdTimer = null, animTimers = [], ctxRef = null;

  function formatBadgeCount(count, toLocNum) {
    const n = Math.max(0, Number(count) || 0), capped = n > 99 ? '99+' : String(n);
    return typeof toLocNum === 'function' ? toLocNum(capped) : capped;
  }

  function updateBadge(count, animate = false) {
    const badge = document.getElementById('ordersCountBadge');
    if (!badge) return;
    badge.textContent = formatBadgeCount(count, ctxRef?.toLocNum);
    badge.classList.remove('hidden');
    if (animate) { badge.classList.remove('badge-pop'); void badge.offsetWidth; badge.classList.add('badge-pop'); }
  }

  function getRemainingSec() {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    if (!last) return 0;
    const diff = COOLDOWN_MS - (Date.now() - last);
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }

  function markCooldownStart(customSec = 60) {
    try { localStorage.setItem(COOLDOWN_KEY, String(Date.now() - Math.max(0, (60 - customSec) * 1000))); } catch (_) {}
    syncCooldownButton();
  }

  function syncCooldownButton() {
    const btn = document.getElementById('submitBtn');
    if (!btn || !ctxRef) return;
    if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
    const tick = () => {
      const rem = getRemainingSec();
      if (rem <= 0) {
        if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
        btn.disabled = false; btn.classList.remove('is-cooldown', 'is-loading'); btn.style.removeProperty('--cd-pct');
        btn.textContent = window.CalcUI?.getReadySubmitLabel?.() || ctxRef.tr('btn_submit'); return;
      }
      btn.disabled = true; btn.classList.remove('is-loading'); btn.classList.add('is-cooldown');
      btn.style.setProperty('--cd-pct', ((rem / 60) * 100).toFixed(1) + '%');
      btn.innerHTML = `<span>${ctxRef.tr('btn_cooldown').replace('{s}', ctxRef.toLocNum(rem))}</span>`;
    };
    tick();
    if (getRemainingSec() > 0) cdTimer = setInterval(tick, 500);
  }

  function showFloatingToast(title, sub, durationMs = 1250) {
    const el = document.getElementById('orderConfirmToast');
    if (!el) return;
    el.querySelector('#confirmToastTitle').textContent = title;
    el.querySelector('#confirmToastSub').textContent = sub;
    el.classList.remove('hidden', 'fly-to-menu');
    setTimeout(() => el.classList.add('fly-to-menu'), durationMs);
    setTimeout(() => el.classList.add('hidden'), durationMs + 380);
  }

  function playOrderSuccessSequence(orderId, prevCount, newCount) {
    if (!ctxRef) return;
    animTimers.forEach(clearTimeout); animTimers = [];
    const { tr, toLocNum } = ctxRef, hdr = document.querySelector('.app-header');
    const needScroll = window.scrollY > 12 || (hdr && hdr.getBoundingClientRect().top < 0), d = needScroll ? 420 : 0;
    if (needScroll) try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, 0); }
    updateBadge(prevCount, false);
    showFloatingToast(tr('toast_confirmed_title'), `${tr('order_id_lbl')} ${orderId} • ${tr('toast_confirmed_sub')}`, 1200 + d);
    const menu = document.getElementById('headerMenuDropdown'), trig = document.getElementById('menuToggleBtn'), ordBtn = document.getElementById('viewOrdersBtn');
    animTimers.push(setTimeout(() => {
      menu?.classList.remove('hidden');
      trig?.classList.add('menu-glow-active');
    }, 1100 + d));
    animTimers.push(setTimeout(() => {
      ordBtn?.classList.remove('order-btn-celebrate');
      void ordBtn?.offsetWidth;
      ordBtn?.classList.add('order-btn-celebrate');
      updateBadge(newCount, true);
    }, 1380 + d));
    animTimers.push(setTimeout(() => { ordBtn?.classList.remove('order-btn-celebrate'); }, 2420 + d));
    animTimers.push(setTimeout(() => {
      trig?.classList.remove('menu-glow-active');
      if (!menu?.matches(':hover')) menu?.classList.add('hidden');
    }, 3120 + d));
  }

  window.OrderAnim = {
    init(ctx) { ctxRef = ctx; syncCooldownButton(); },
    updateBadge, getRemainingSec, markCooldownStart, syncCooldownButton, showFloatingToast, playOrderSuccessSequence
  };
})();
