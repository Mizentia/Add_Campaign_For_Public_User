(function () {
  const svgUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const RAW_PLATFORMS = [
    ['Facebook', 'ফেসবুক', 'Facebook', 15, svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>')],
    ['Instagram', 'ইনস্টাগ্রাম', 'Instagram', 15, svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#E1306C" d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85 0 3.2-.01 3.58-.07 4.85-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07-3.2 0-3.58-.01-4.85-.07-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85 0-3.2.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23c1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.36-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.36-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84zM12 16a4 4 0 1 1 4-4 4 4 0 0 1-4 4zm6.4-11.85a1.44 1.44 0 1 0 1.44 1.44 1.44 1.44 0 0 0-1.44-1.44z"/></svg>')],
    ['WhatsApp', 'হোয়াটসঅ্যাপ', 'WhatsApp', 15, svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#25D366" d="M12.04 0C5.46 0 .1 5.35.1 11.94c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.9 11.9 0 0 0 5.79 1.48h.01c6.58 0 11.94-5.35 11.94-11.94A11.9 11.9 0 0 0 12.04 0zm6.99 16.92c-.29.83-1.71 1.59-2.4 1.69-.64.1-1.45.14-2.34-.15-.55-.17-1.25-.4-2.14-.79-3.77-1.63-6.23-5.43-6.42-5.68-.18-.25-1.53-2.04-1.53-3.89 0-1.85.97-2.76 1.31-3.14.35-.38.76-.47 1.01-.47.25 0 .5 0 .72.01.23.01.54-.09.85.65.31.76 1.07 2.61 1.16 2.8.1.19.16.41.03.66-.13.25-.19.41-.38.63-.19.22-.4.49-.57.66-.19.19-.39.39-.17.77.22.38.98 1.62 2.11 2.62 1.45 1.29 2.67 1.69 3.05 1.88.38.19.6.16.82-.1.22-.25.95-1.1 1.2-1.48.25-.38.5-.31.85-.19.35.13 2.21 1.04 2.59 1.23.38.19.63.28.72.44.1.16.1.91-.19 1.74z"/></svg>')],
    ['YouTube', 'ইউটিউব', 'YouTube', 15, svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.88.56 9.38.56 9.38.56s7.5 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>')],
    ['TikTok', 'টিকটক', 'TikTok', 15, svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#00F2FE" d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"/></svg>')],
    ['Google Ads', 'গুগল', 'Google', 15, svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.57-5.17 3.57-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>')],
    ['Bikroy', 'বিক্রয়', 'Bikroy', 0, svgUri('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#009877"/><path fill="#FFC800" d="M7 6.5h6.2c2.1 0 3.6 1.1 3.6 2.8 0 1.1-.6 2-1.6 2.4 1.3.4 2.1 1.4 2.1 2.8 0 2-1.6 3.2-4 3.2H7V6.5zm3 4.3h2.6c.9 0 1.4-.5 1.4-1.2 0-.8-.5-1.2-1.4-1.2H10v2.4zm0 4.6h3c1 0 1.6-.5 1.6-1.4 0-.8-.6-1.3-1.6-1.3h-3v2.7z"/></svg>')]
  ];

  window.DEFAULT_CAMPAIGN_PLATFORMS = RAW_PLATFORMS.map(([id, nameBn, nameEn, vatPercent, logo]) => ({
    id, nameBn, nameEn, vatPercent, logo, forStudio: true, forPublic: true, enabled: true
  }));
  const DEF_BY_ID = Object.fromEntries(window.DEFAULT_CAMPAIGN_PLATFORMS.map(p => [p.id.toLowerCase(), p]));

  function normalizePlat(p = {}) {
    const rawId = String(p.id || p.nameEn || p.nameBn || 'Platform').trim();
    const def = DEF_BY_ID[rawId.toLowerCase()] || {};
    const vat = Number(p.vatPercent ?? def.vatPercent ?? 0);
    return {
      ...def, ...p,
      id: def.id || rawId,
      nameBn: String(p.nameBn || def.nameBn || rawId).trim(),
      nameEn: String(p.nameEn || def.nameEn || rawId).trim(),
      logo: String(p.logo || def.logo || '').trim(),
      vatPercent: Number.isFinite(vat) && vat >= 0 ? vat : 0,
      forStudio: p.forStudio !== false,
      forPublic: p.forPublic !== false,
      enabled: p.enabled !== false
    };
  }

  window.getPlatformLogoHtml = function (p) {
    const src = String(p?.logo || DEF_BY_ID[String(p?.id || '').toLowerCase()]?.logo || '').trim();
    if (!src) return '';
    return `<img class="plat-svg" src="${src}" alt="${String(p?.nameEn || p?.id || '').replace(/"/g, '&quot;')}" style="object-fit:contain;">`;
  };

  window.normalizeCampaignPlatforms = function (list) {
    if (!Array.isArray(list) || !list.length) return window.DEFAULT_CAMPAIGN_PLATFORMS.map(normalizePlat);
    return list.map(normalizePlat);
  };
})();
