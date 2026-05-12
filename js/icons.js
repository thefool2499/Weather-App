/* ══════════════════════════════
   2. WEATHER ICONS (SVG)
══════════════════════════════ */
export function getWeatherIcon(iconCode, size = 32) {
  const s = size, h = s / 2, d = s;
  const isNight = iconCode && iconCode.endsWith('n');
  const code = iconCode ? iconCode.replace(/[dn]$/, '') : '01';
  const uid  = Math.random().toString(36).slice(2, 7);

  const defs = `<defs>
    <radialGradient id="sg${uid}" cx="40%" cy="35%" r="60%">
      <stop offset="0%"   stop-color="#FFF7A0"/>
      <stop offset="50%"  stop-color="#FFD740"/>
      <stop offset="100%" stop-color="#FF9A00"/>
    </radialGradient>
    <linearGradient id="cg${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#D8E8F8"/>
    </linearGradient>
    <linearGradient id="dcg${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#B0BEC5"/>
      <stop offset="100%" stop-color="#78909C"/>
    </linearGradient>
    <linearGradient id="mg${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#E8EFFF"/>
      <stop offset="100%" stop-color="#A8BEDE"/>
    </linearGradient>
    <linearGradient id="scg${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#E0EAFF"/>
      <stop offset="100%" stop-color="#C0D0F0"/>
    </linearGradient>
    <linearGradient id="stg${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#546E7A"/>
      <stop offset="100%" stop-color="#37474F"/>
    </linearGradient>
  </defs>`;

  const r  = s * 0.28;
  const sw = Math.max(1.5, s * 0.055);

  function sunRays(cx, cy, inner, outer, color, strokeW) {
    let rays = '';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      rays += `<line x1="${(cx + Math.cos(a) * inner).toFixed(1)}" y1="${(cy + Math.sin(a) * inner).toFixed(1)}" x2="${(cx + Math.cos(a) * outer).toFixed(1)}" y2="${(cy + Math.sin(a) * outer).toFixed(1)}" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round"/>`;
    }
    return rays;
  }

  function cloudShape(cx, cy, scale, fillId, opacity = 1) {
    const w  = s * scale;
    const op = opacity < 1 ? ` opacity="${opacity}"` : '';
    return `<g${op}>
      <ellipse cx="${cx}" cy="${cy + w * 0.15}" rx="${w * 0.55}" ry="${w * 0.36}" fill="url(#${fillId})"/>
      <ellipse cx="${cx - w * 0.3}" cy="${cy + w * 0.3}" rx="${w * 0.32}" ry="${w * 0.26}" fill="url(#${fillId})"/>
      <ellipse cx="${cx + w * 0.3}" cy="${cy + w * 0.3}" rx="${w * 0.3}"  ry="${w * 0.24}" fill="url(#${fillId})"/>
      <ellipse cx="${cx - w * 0.1}" cy="${cy - w * 0.05}" rx="${w * 0.34}" ry="${w * 0.28}" fill="url(#${fillId})"/>
      <ellipse cx="${cx + w * 0.22}" cy="${cy + w * 0.06}" rx="${w * 0.26}" ry="${w * 0.22}" fill="url(#${fillId})"/>
    </g>`;
  }

  function rainDrops(cx, cy, n, color, heavy, sw2) {
    let drops = '';
    const spacing = s * 0.22;
    const startX  = cx - ((n - 1) / 2) * spacing;
    const len     = heavy ? s * 0.22 : s * 0.16;
    for (let i = 0; i < n; i++) {
      const x    = startX + i * spacing;
      const yOff = (i % 2) * s * 0.06;
      drops += `<line x1="${x.toFixed(1)}" y1="${(cy + yOff).toFixed(1)}" x2="${(x - len * 0.25).toFixed(1)}" y2="${(cy + yOff + len).toFixed(1)}" stroke="${color}" stroke-width="${sw2}" stroke-linecap="round"/>`;
    }
    return drops;
  }

  function snowflake(cx, cy, r2, color) {
    let lines = '';
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      lines += `<line x1="${(cx + Math.cos(a) * r2).toFixed(1)}" y1="${(cy + Math.sin(a) * r2).toFixed(1)}" x2="${(cx - Math.cos(a) * r2).toFixed(1)}" y2="${(cy - Math.sin(a) * r2).toFixed(1)}" stroke="${color}" stroke-width="${Math.max(1.2, s * 0.04)}" stroke-linecap="round"/>`;
    }
    return lines;
  }

  function boltPath(cx, cy, sc) {
    const w = s * sc;
    return `<polygon points="${cx},${cy - w * 0.6} ${cx - w * 0.35},${cy} ${cx - w * 0.05},${cy} ${cx - w * 0.05},${cy + w * 0.7} ${cx + w * 0.4},${cy - w * 0.1} ${cx + w * 0.05},${cy - w * 0.1} ${cx + w * 0.05},${cy - w * 0.6}" fill="#FBBF24" stroke="#F59E0B" stroke-width="${Math.max(0.5, s * 0.02)}" stroke-linejoin="round"/>`;
  }

  let inner = '';
  switch (code) {
    case '01':
      if (isNight) {
        const mr = r * 1.1;
        inner = `<circle cx="${h}" cy="${h}" r="${mr * 1.8}" fill="#818CF8" opacity="0.1"/>
          <circle cx="${h}" cy="${h}" r="${mr}" fill="url(#mg${uid})" stroke="#A5B4FC" stroke-width="${sw * 0.4}"/>
          <circle cx="${(h + mr * 0.5).toFixed(1)}" cy="${(h - mr * 0.18).toFixed(1)}" r="${mr * 0.78}" fill="rgba(2,6,23,0.96)"/>
          <circle cx="${h + mr * 0.85}" cy="${h - mr * 0.85}" r="${s * 0.055}" fill="#C8D8FF" opacity="0.85"/>
          <circle cx="${h + mr * 1.35}" cy="${h}" r="${s * 0.04}" fill="#C8D8FF" opacity="0.65"/>`;
      } else {
        inner = `<circle cx="${h}" cy="${h}" r="${r * 1.6}" fill="#FFD940" opacity="0.14"/>
          ${sunRays(h, h, r * 1.18, r * 1.75, '#FFB800', sw)}
          <circle cx="${h}" cy="${h}" r="${r}" fill="url(#sg${uid})" stroke="#FFCC00" stroke-width="${sw * 0.35}"/>`;
      }
      break;
    case '02':
      if (isNight) {
        const mr2 = r * 0.85;
        inner = `<circle cx="${(h + s * 0.1).toFixed(1)}" cy="${(h - s * 0.12).toFixed(1)}" r="${mr2}" fill="url(#mg${uid})" stroke="#A5B4FC" stroke-width="${sw * 0.3}"/>
          <circle cx="${(h + s * 0.1 + mr2 * 0.5).toFixed(1)}" cy="${(h - s * 0.12 - mr2 * 0.15).toFixed(1)}" r="${mr2 * 0.76}" fill="rgba(2,6,23,0.95)"/>
          ${cloudShape(h - s * 0.06, h + s * 0.08, 0.62, `cg${uid}`)}`;
      } else {
        const sr = r * 0.75;
        inner = `${sunRays(h + s * 0.12, h - s * 0.12, sr * 1.15, sr * 1.65, '#FFB800', sw * 0.85)}
          <circle cx="${(h + s * 0.12).toFixed(1)}" cy="${(h - s * 0.12).toFixed(1)}" r="${sr}" fill="url(#sg${uid})" stroke="#FFCC00" stroke-width="${sw * 0.3}"/>
          ${cloudShape(h - s * 0.06, h + s * 0.1, 0.65, `cg${uid}`)}`;
      }
      break;
    case '03': inner = `${cloudShape(h - s * 0.08, h - s * 0.04, 0.72, `dcg${uid}`, 0.7)}${cloudShape(h, h + s * 0.06, 0.72, `cg${uid}`)}`; break;
    case '04': inner = `${cloudShape(h - s * 0.06, h - s * 0.06, 0.72, `dcg${uid}`, 0.82)}${cloudShape(h + s * 0.04, h + s * 0.08, 0.68, `cg${uid}`)}`; break;
    case '09': inner = `${cloudShape(h, h - s * 0.1, 0.7, `dcg${uid}`)}${rainDrops(h, h + s * 0.28, 4, '#7DD3FC', false, sw * 0.9)}`; break;
    case '10': inner = `${cloudShape(h, h - s * 0.1, 0.7, `dcg${uid}`)}${rainDrops(h, h + s * 0.28, 4, '#60A5FA', true, sw * 1.1)}`; break;
    case '11': inner = `${cloudShape(h, h - s * 0.1, 0.74, `stg${uid}`)}${boltPath(h, h + s * 0.15, 0.38)}`; break;
    case '13': inner = `${cloudShape(h, h - s * 0.1, 0.7, `scg${uid}`)}${snowflake(h - s * 0.24, h + s * 0.33, s * 0.1, '#93C5FD')}${snowflake(h, h + s * 0.36, s * 0.1, '#93C5FD')}${snowflake(h + s * 0.24, h + s * 0.33, s * 0.1, '#93C5FD')}`; break;
    case '50': inner = `${cloudShape(h, h - s * 0.06, 0.68, `cg${uid}`, 0.65)}<line x1="${s * 0.1}" y1="${(h + s * 0.2).toFixed(1)}" x2="${s * 0.9}" y2="${(h + s * 0.2).toFixed(1)}" stroke="#9CA3AF" stroke-width="${sw * 0.9}" stroke-linecap="round" opacity="0.6"/><line x1="${s * 0.18}" y1="${(h + s * 0.32).toFixed(1)}" x2="${s * 0.82}" y2="${(h + s * 0.32).toFixed(1)}" stroke="#9CA3AF" stroke-width="${sw * 0.8}" stroke-linecap="round" opacity="0.4"/>`; break;
    default:   inner = cloudShape(h, h, 0.7, `cg${uid}`);
  }

  // FIX: explicit width + height + overflow:hidden prevents the SVG from
  // expanding beyond its container (was causing the giant cloud blowout).
  return `<svg viewBox="0 0 ${d} ${d}" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg" style="overflow:hidden;display:block;flex-shrink:0">${defs}${inner}</svg>`;
}