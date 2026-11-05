document.addEventListener('DOMContentLoaded', () => {
  let selectedPlatform = 'Facebook';
  const USD_RATE = 125;
  const platformButtons = document.querySelectorAll('.plat-btn');
  const budgetInput = document.getElementById('budgetUSD');
  const bdtEstimate = document.getElementById('bdtEstimate');
  const form = document.getElementById('campaignForm');
  const submitBtn = document.getElementById('submitBtn');
  const modal = document.getElementById('orderModal');
  const modalBody = document.getElementById('modalBody');
  const modalTitle = document.getElementById('modalTitle');
  const viewOrdersBtn = document.getElementById('viewOrdersBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  platformButtons.forEach(btn => btn.addEventListener('click', () => {
    platformButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPlatform = btn.dataset.plat;
  }));

  const updateBdt = () => {
    const val = Number(budgetInput.value) || 0;
    bdtEstimate.textContent = `আনুমানিক: ${(val * USD_RATE).toLocaleString()} টাকা (১ ডলার = ${USD_RATE} ৳)`;
  };
  budgetInput.addEventListener('input', updateBdt);
  updateBdt();

  const showModal = (title, html) => {
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.classList.remove('hidden');
  };
  closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'অর্ডার প্রক্রিয়া করা হচ্ছে...';
    const payload = {
      platform: selectedPlatform,
      campaignGoal: document.getElementById('campaignGoal').value,
      targetAudience: document.getElementById('targetAudience').value,
      budgetUSD: Number(budgetInput.value),
      durationDays: Number(document.getElementById('durationDays').value),
      pageOrPostUrl: document.getElementById('pageOrPostUrl').value,
      customerName: document.getElementById('customerName').value,
      customerPhone: document.getElementById('customerPhone').value,
      notes: document.getElementById('notes').value
    };
    try {
      const res = await fetch('/api/submit-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        form.reset();
        updateBdt();
        showModal('🎉 অর্ডার গৃহীত হয়েছে!', `
          <div style="text-align: center; padding: 10px;">
            <p>অর্ডার আইডি: <strong>${data.order.id}</strong></p>
            <p style="margin: 8px 0; color: #94a3b8;">${data.order.platform} | $${data.order.budgetUSD}</p>
            <p style="color: #10b981;">আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে। ধন্যবাদ!</p>
          </div>
        `);
      } else alert('ত্রুটি: ' + (data.error || 'অর্ডার সাবমিট করা যায়নি'));
    } catch (_) { alert('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।'); }
    finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 ক্যাম্পেইন অর্ডার প্লেস করুন';
    }
  });

  viewOrdersBtn.addEventListener('click', async () => {
    showModal('লোড হচ্ছে...', '<p style="padding:10px;">অর্ডার হিস্টোরি লোড হচ্ছে...</p>');
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      const list = data.orders || [];
      if (!list.length) {
        showModal('আমার অর্ডারসমূহ', '<p style="padding:10px; color:#94a3b8;">এখনো কোনো অর্ডার পাওয়া যায়নি।</p>');
        return;
      }
      const html = list.map(o => `
        <div class="order-pill">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <strong>${o.id}</strong><span class="status-badge ${o.status}">${o.status}</span>
          </div>
          <div>${o.platform} - $${o.budgetUSD} (${o.durationDays} দিন)</div>
          <small style="color:#94a3b8;">গ্রাহক: ${o.customerName} | ${o.customerPhone}</small>
        </div>`).join('');
      showModal('আমার অর্ডারসমূহ', html);
    } catch (_) { showModal('ত্রুটি', '<p style="color:#ef4444; padding:10px;">অর্ডার লোড করতে সমস্যা হয়েছে।</p>'); }
  });
});
