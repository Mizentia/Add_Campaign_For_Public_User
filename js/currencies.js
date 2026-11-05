window.DEFAULT_CAMPAIGN_CURRENCIES = [
  { code: 'USD', sym: '$', nameBn: 'আমেরিকান ডলার', nameEn: 'US Dollar', rate: 125, minBudget: 2, maxBudget: 100, minDays: 4, maxDays: 100, hasLimit: true, enabled: true },
  { code: 'BDT', sym: '৳', nameBn: 'বাংলাদেশি টাকা', nameEn: 'Bangladeshi Taka', rate: 1, minBudget: 250, maxBudget: 12500, minDays: 4, maxDays: 100, hasLimit: true, enabled: true },
  { code: 'GBP', sym: '£', nameBn: 'ব্রিটিশ পাউন্ড', nameEn: 'British Pound', rate: 160, minBudget: 2, maxBudget: 100, minDays: 4, maxDays: 100, hasLimit: true, enabled: true },
  { code: 'EUR', sym: '€', nameBn: 'ইউরো', nameEn: 'Euro', rate: 135, minBudget: 2, maxBudget: 100, minDays: 4, maxDays: 100, hasLimit: true, enabled: true },
  { code: 'CAD', sym: 'C$', nameBn: 'কানাডিয়ান ডলার', nameEn: 'Canadian Dollar', rate: 92, minBudget: 2, maxBudget: 100, minDays: 4, maxDays: 100, hasLimit: true, enabled: true },
  { code: 'AUD', sym: 'A$', nameBn: 'অস্ট্রেলিয়ান ডলার', nameEn: 'Australian Dollar', rate: 82, minBudget: 2, maxBudget: 100, minDays: 4, maxDays: 100, hasLimit: true, enabled: true }
];

window.CURRENCY_FLAGS = {
  USD: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#B22234"/><path stroke="#fff" stroke-width="1.2" d="M0 2.5h24M0 5h24M0 7.5h24M0 10h24M0 12.5h24M0 15h24"/><rect width="10" height="8.5" rx="1" fill="#3C3B6E"/></svg>',
  BDT: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#006A4E"/><circle cx="10.8" cy="8" r="4.5" fill="#F42A41"/></svg>',
  GBP: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#012169"/><path stroke="#fff" stroke-width="2.4" d="M0 0l24 16M24 0L0 16"/><path stroke="#C8102E" stroke-width="1.2" d="M0 0l24 16M24 0L0 16"/><path stroke="#fff" stroke-width="4" d="M12 0v16M0 8h24"/><path stroke="#C8102E" stroke-width="2.2" d="M12 0v16M0 8h24"/></svg>',
  EUR: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#003399"/><circle cx="12" cy="8" r="4.5" fill="none" stroke="#FFCC00" stroke-width="1.4" stroke-dasharray="1.5 2.2"/></svg>',
  CAD: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#fff"/><rect width="6" height="16" fill="#D80621"/><rect x="18" width="6" height="16" fill="#D80621"/><path fill="#D80621" d="M12 3.5l1.8 3.5h2.2l-2 2.2.8 2.8-2.8-1.5-2.8 1.5.8-2.8-2-2.2h2.2z"/></svg>',
  AUD: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#00008B"/><rect width="10" height="7" fill="#012169"/><path stroke="#fff" stroke-width="1.5" d="M5 0v7M0 3.5h10"/><circle cx="18" cy="5" r="1.2" fill="#fff"/><circle cx="16" cy="11" r="1.2" fill="#fff"/><circle cx="5" cy="12" r="1.6" fill="#fff"/></svg>',
  INR: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#fff"/><rect width="24" height="5.3" fill="#FF9933"/><rect y="10.7" width="24" height="5.3" fill="#138808"/><circle cx="12" cy="8" r="2" fill="#000080"/></svg>',
  AED: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="5.3" fill="#00732F"/><rect y="5.3" width="24" height="5.3" fill="#fff"/><rect y="10.6" width="24" height="5.4" fill="#000"/><rect width="6" height="16" fill="#FF0000"/></svg>',
  DEFAULT: '<svg class="flag-svg" viewBox="0 0 24 16"><rect width="24" height="16" rx="2" fill="#3b82f6"/><circle cx="12" cy="8" r="4.5" fill="none" stroke="#fff" stroke-width="1.4"/></svg>'
};

window.fetchStudioCampaignCurrencies = async function () {
  try {
    const r = await fetch('/api/campaign-settings').then(x => x.json());
    if (Array.isArray(r?.settings?.currencies) && r.settings.currencies.length) return r.settings.currencies;
  } catch (_) {}
  try {
    const r2 = await fetch('http://localhost:3001/api/campaign-settings').then(x => x.json());
    if (Array.isArray(r2?.settings?.currencies) && r2.settings.currencies.length) return r2.settings.currencies;
  } catch (_) {}
  return window.DEFAULT_CAMPAIGN_CURRENCIES;
};
