const RAW_CURR_CATALOG = [
  ['AED','د.إ','ae','সংযুক্ত আরব আমিরাতের দিরহাম','UAE Dirham',34,10,500],['ARS','AR$','ar','আর্জেন্টাইন পেসো','Argentine Peso',0.13,2000,100000],
  ['AUD','A$','au','অস্ট্রেলিয়ান ডলার','Australian Dollar',82,2,100],['BDT','৳','bd','বাংলাদেশী টাকা','Bangladeshi Taka',1,250,12500],
  ['BOB','Bs.','bo','বলিভিয়ান বলিভিয়ানো','Bolivian Boliviano',18,15,700],['BRL','R$','br','ব্রাজিলিয়ান রিয়েল','Brazilian Real',22,10,500],
  ['CAD','C$','ca','কানাডিয়ান ডলার','Canadian Dollar',92,2,100],['CHF','CHF','ch','সুইশ ফ্রাঙ্ক','Swiss Franc',140,2,100],
  ['CLP','CLP$','cl','চিলিয়ান পেসো','Chilean Peso',0.13,2000,100000],['CNY','¥','cn','চীনা ইউয়ান','Chinese Yuan',17.5,15,700],
  ['COP','COL$','co','কলম্বিয়ান পেসো','Colombian Peso',0.03,8000,400000],['CRC','₡','cr','কোস্টা রিকান কোলন','Costa Rican Colon',0.24,1000,50000],
  ['CZK','Kč','cz','চেক কোরুনা','Czech Koruna',5.3,50,2500],['DKK','kr','dk','ড্যানিশ ক্রোন','Danish Krone',18,15,700],
  ['DZD','د.ج','dz','আলজেরীয় দিনার','Algerian Dinar',0.93,300,15000],['EGP','E£','eg','মিশরীয় পাউন্ড','Egyptian Pound',2.5,100,5000],
  ['EUR','€','eu','ইউরো','Euro',135,2,100],['GBP','£','gb','ব্রিটিশ পাউন্ড','British Pound',160,2,100],
  ['GTQ','Q','gt','গুয়াতেমালান কেতসাল','Guatemalan Quetzal',16,15,800],['HKD','HK$','hk','হংকং ডলার','Hong Kong Dollar',16,15,800],
  ['HNL','L','hn','হন্ডুরান লেম্পিরা','Honduran Lempira',5,50,2500],['HUF','Ft','hu','হাঙ্গেরিয়ান ফোরিন্ট','Hungarian Forint',0.33,700,35000],
  ['IDR','Rp','id','ইন্দোনেশিয় রুপিয়া','Indonesian Rupiah',0.008,30000,1500000],['ILS','₪','il','ইসরায়েলের নতুন শেকেল','Israeli New Shekel',34,10,500],
  ['INR','₹','in','ভারতীয় টাকা','Indian Rupee',1.5,200,10000],['ISK','kr','is','আইসল্যান্ড ক্রোনা','Icelandic Krona',0.9,300,15000],
  ['JPY','¥','jp','জাপানি ইয়েন','Japanese Yen',0.83,300,15000],['KES','KSh','ke','কেনিয়ার শিলিং','Kenyan Shilling',0.96,250,12500],
  ['KRW','₩','kr','কোরিয়ান ওন','South Korean Won',0.09,2500,125000],['LKR','Rs','lk','শ্রীলঙ্কান রুপি','Sri Lankan Rupee',0.42,600,30000],
  ['MOP','MOP$','mo','ম্যাকাউ পাতাকাস','Macanese Pataca',15.5,15,800],['MXN','MX$','mx','মেক্সিকান পেসো','Mexican Peso',6.3,40,2000],
  ['MYR','RM','my','মালয়েশিয়ার রিংগিত','Malaysian Ringgit',28,10,500],['NGN','₦','ng','নাইজেরিয়ান নায়রা','Nigerian Naira',0.08,3000,150000],
  ['NIO','C$','ni','নিকারাগুয়ান কর্দোবা','Nicaraguan Cordoba',3.4,75,3500],['NOK','kr','no','নরওয়েজিয়ান ক্রোন','Norwegian Krone',11.5,20,1000],
  ['NZD','NZ$','nz','নিউজিল্যান্ড ডলার','New Zealand Dollar',75,3,150],['PEN','S/','pe','পেরুভিয়ান নুয়েভো সোল','Peruvian Sol',33,8,400],
  ['PHP','₱','ph','ফিলিপাইন পেসো','Philippine Peso',2.2,120,6000],['PKR','₨','pk','পাকিস্তানি টাকা','Pakistani Rupee',0.45,500,25000],
  ['PLN','zł','pl','পোলিশ জ্লোটি','Polish Zloty',31,8,400],['PYG','₲','py','প্যারাগুয়ান গুরানি','Paraguayan Guarani',0.016,15000,750000],
  ['QAR','ر.ق','qa','কাতারি রিয়াল','Qatari Riyal',34,10,500],['RON','lei','ro','রোমানিয়ান লিউ','Romanian Leu',27,10,500],
  ['SAR','﷼','sa','সৌদি-আরবীয় রিয়াল','Saudi Riyal',33.3,10,500],['SEK','kr','se','সুইডিশ ক্রোনা','Swedish Krona',11.8,20,1000],
  ['SGD','S$','sg','সিঙ্গাপুর ডলার','Singapore Dollar',93,2,100],['THB','฿','th','থাই বাট','Thai Baht',3.6,70,3500],
  ['TRY','₺','tr','তুর্কি লিরা','Turkish Lira',3.6,70,3500],['TWD','NT$','tw','তাইওয়ান ডলার','New Taiwan Dollar',3.9,65,3200],
  ['UAH','₴','ua','ইউক্রেনের হ্রভনিয়া','Ukrainian Hryvnia',3,80,4000],['USD','$','us','আমেরিকান ডলার','US Dollar',125,2,100],
  ['UYU','$U','uy','উরুগুয়ের পেসো','Uruguayan Peso',3,80,4000],['VND','₫','vn','ভিয়েতনামি ডং','Vietnamese Dong',0.005,50000,2500000],
  ['ZAR','R','za','দক্ষিণ আফ্রিকান র‍্যান্ড','South African Rand',6.8,35,1800]
];

window.DEFAULT_CAMPAIGN_CURRENCIES = RAW_CURR_CATALOG.map(([code, sym, cc, nameBn, nameEn, rate, minBudget, maxBudget]) => ({
  code, sym, flag: `https://flagcdn.com/w40/${cc}.png`, nameBn, nameEn, rate, minBudget, maxBudget,
  minDays: 4, maxDays: 100, unlimitedBudget: false, unlimitedDays: false, forStudio: true, forPublic: true, hasLimit: true, enabled: true
}));
const DEF_BY_CODE = Object.fromEntries(window.DEFAULT_CAMPAIGN_CURRENCIES.map(c => [c.code, c]));

window.getCurrencyFlagHtml = function (c) {
  const raw = String(c?.flag || DEF_BY_CODE[c?.code]?.flag || '').trim();
  const url = /^(https?:\/\/|\/|data:image\/)/i.test(raw) ? raw : (/^[a-zA-Z]{2}$/.test(raw) ? `https://flagcdn.com/w40/${raw.toLowerCase()}.png` : '');
  if (url) return `<img class="flag-svg" src="${url}" alt="${c.code || ''}" style="object-fit:cover;border-radius:2px;">`;
  return raw ? `<span class="flag-svg" style="display:inline-flex;align-items:center;justify-content:center;font-size:0.8rem;">${raw}</span>` : '<span class="flag-svg">🏳️</span>';
};

function parseFsVal(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(parseFsVal);
  if ('mapValue' in v) {
    const out = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) out[k] = parseFsVal(val);
    return out;
  }
  return null;
}

window.syncPublicCampaignBrandLogo = async function () {
  try {
    const fsRes = await fetch('https://firestore.googleapis.com/v1/projects/metaaccountmanager/databases/(default)/documents/ecosystem/projects').then(x => x.ok ? x.json() : null);
    const list = parseFsVal(fsRes?.fields?.value) || [];
    const proj = list.find(p => p && (p.id === 'add-campaign-for-public-user' || p.id === 'proj-campaign-public' || p.dirName === 'Add_Campaign_For_Public_User' || Number(p.port) === 8088));
    if (proj?.logo) {
      ['brandLogoImg', 'appFavicon', 'appAppleIcon'].forEach((id, i) => { const el = document.getElementById(id); if (el) el[i === 0 ? 'src' : 'href'] = proj.logo; });
    }
  } catch (_) {}
};

window.fetchStudioCampaignCurrencies = async function () {
  window.syncPublicCampaignBrandLogo();
  for (const url of ['./api/campaign-settings', 'http://localhost:3001/api/campaign-settings']) {
    try {
      const r = await fetch(url).then(x => x.ok ? x.json() : null);
      if (Array.isArray(r?.settings?.currencies) && r.settings.currencies.length) return r.settings.currencies;
    } catch (_) {}
  }
  try {
    const fsRes = await fetch('https://firestore.googleapis.com/v1/projects/metaaccountmanager/databases/(default)/documents/ecosystem/portalSettings').then(x => x.ok ? x.json() : null);
    const parsed = parseFsVal(fsRes?.fields?.value);
    if (Array.isArray(parsed?.campaign?.currencies) && parsed.campaign.currencies.length > 12) return parsed.campaign.currencies;
  } catch (_) {}
  return window.DEFAULT_CAMPAIGN_CURRENCIES;
};
