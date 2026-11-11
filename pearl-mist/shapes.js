(function () {
  const NS = "http://www.w3.org/2000/svg";
  let uid = 0;
  const f = (n) => n.toFixed(2);

  function perimeter(w, h, r) {
    const q = Math.PI / 2 * r;
    const segs = [
      { len: w - 2 * r, at: (t) => [r + t * (w - 2 * r), 0, 0, -1] },
      { len: q, at: (t) => { const a = -Math.PI / 2 + t * Math.PI / 2; return [w - r + r * Math.cos(a), r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; } },
      { len: h - 2 * r, at: (t) => [w, r + t * (h - 2 * r), 1, 0] },
      { len: q, at: (t) => { const a = t * Math.PI / 2; return [w - r + r * Math.cos(a), h - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; } },
      { len: w - 2 * r, at: (t) => [w - r - t * (w - 2 * r), h, 0, 1] },
      { len: q, at: (t) => { const a = Math.PI / 2 + t * Math.PI / 2; return [r + r * Math.cos(a), h - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; } },
      { len: h - 2 * r, at: (t) => [0, h - r - t * (h - 2 * r), -1, 0] },
      { len: q, at: (t) => { const a = Math.PI + t * Math.PI / 2; return [r + r * Math.cos(a), r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; } },
    ];
    const L = segs.reduce((s, g) => s + g.len, 0);
    function at(s) {
      s = ((s % L) + L) % L;
      for (const g of segs) {
        if (s <= g.len || g === segs[segs.length - 1]) return g.at(g.len ? Math.min(s / g.len, 1) : 0);
        s -= g.len;
      }
    }
    return { L, at };
  }

  function wave(w, h, r, period, amp, ox, oy) {
    const P = perimeter(w, h, r);
    const n = Math.max(8, Math.round(P.L / period));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(P.at(i * P.L / n));
    let d = `M${f(pts[0][0] + ox)} ${f(pts[0][1] + oy)}`;
    const mids = [];
    for (let i = 0; i < n; i++) {
      const m = P.at((i + 0.5) * P.L / n);
      mids.push(m);
      d += ` Q${f(m[0] + m[2] * amp * 2 + ox)} ${f(m[1] + m[3] * amp * 2 + oy)} ${f(pts[i + 1][0] + ox)} ${f(pts[i + 1][1] + oy)}`;
    }
    return { d: d + "Z", pts, mids };
  }

  function rrect(x, y, w, h, r) {
    return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  }

  function mount(el, pad, inner) {
    const w = el.offsetWidth, h = el.offsetHeight;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "bg");
    svg.setAttribute("width", w + pad * 2);
    svg.setAttribute("height", h + pad * 2);
    svg.style.left = -pad + "px";
    svg.style.top = -pad + "px";
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = inner(w, h, pad);
    el.insertBefore(svg, el.firstChild);
  }

  function doily(el) {
    const amp = +(el.dataset.amp || 5), period = +(el.dataset.period || 15), r = +(el.dataset.r || 18);
    mount(el, 14, (w, h, p) => {
      const id = "dg" + (uid++);
      const wv = wave(w, h, r, period, amp, p, p);
      let holes = "";
      for (const m of wv.mids) holes += `<circle cx="${f(m[0] + m[2] * amp * 0.75 + p)}" cy="${f(m[1] + m[3] * amp * 0.75 + p)}" r="1.25" fill="#DDD5E8"/>`;
      let dots = "";
      for (const q of wv.pts) dots += `<circle cx="${f(q[0] - q[2] * 3 + p)}" cy="${f(q[1] - q[3] * 3 + p)}" r=".8" fill="#E2DBEC"/>`;
      return `<defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#5E5488" flood-opacity=".14"/></filter></defs>
        <path d="${wv.d}" fill="#FFFEFD" stroke="#C9C0DB" stroke-width="1.1" filter="url(#${id})"/>
        ${holes}${dots}
        <path d="${rrect(p + 8, p + 8, w - 16, h - 16, Math.max(r - 8, 6))}" fill="none" stroke="#DCD3E8" stroke-width="1" stroke-dasharray="3.2 2.6"/>`;
    });
  }

  const TONES = {
    rose: { outer: "#FBEEF3", os: "#DDB4C4", fold: "#E2BDCB", g: ["#F6E1E9", "#FCF2F6", "#F3DCE5", "#EED3DE"], is: "#D9AEBF", sh: "#9A5C76" },
    lilac: { outer: "#F4F0F9", os: "#C9BEDC", fold: "#D5CBE4", g: ["#FFFEFE", "#FFFFFF", "#FBF9FC", "#F5F1F8"], is: "#CEC4DE", sh: "#5E5488", stitch: "#D9D0E7" },
  };
  function ruffle(el) {
    const r = +(el.dataset.r || 20);
    const T = TONES[el.dataset.tone || "rose"];
    mount(el, 12, (w, h, p) => {
      const id = "rg" + (uid++);
      const outer = wave(w, h, r, 6.5, 3.4, p, p);
      let folds = "";
      for (const q of outer.pts) folds += `<line x1="${f(q[0] - q[2] * 1 + p)}" y1="${f(q[1] - q[3] * 1 + p)}" x2="${f(q[0] + q[2] * 5.2 + p)}" y2="${f(q[1] + q[3] * 5.2 + p)}" stroke="${T.fold}" stroke-width=".7"/>`;
      return `<defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${T.g[0]}"/><stop offset=".38" stop-color="${T.g[1]}"/><stop offset=".55" stop-color="${T.g[2]}"/><stop offset="1" stop-color="${T.g[3]}"/>
          </linearGradient>
          <filter id="${id}s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="${T.sh}" flood-opacity=".16"/></filter>
        </defs>
        <path d="${outer.d}" fill="${T.outer}" stroke="${T.os}" stroke-width=".9" filter="url(#${id}s)"/>
        ${folds}
        <path d="${rrect(p + 4, p + 4, w - 8, h - 8, r - 3)}" fill="url(#${id})" stroke="${T.is}" stroke-width="1"/>
        <path d="${rrect(p + 9, p + 9, w - 18, h - 18, r - 8)}" fill="none" stroke="${T.stitch || "#FFFFFF"}" stroke-opacity=".95" stroke-width="1.1" stroke-dasharray="3 2.5"/>`;
    });
  }

  function pearlRing(el) {
    const s = el.offsetWidth, R = s / 2 - 3.2, n = +(el.dataset.n || 20), br = +(el.dataset.br || 3);
    const id = "pr" + (uid++);
    let beads = "";
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      beads += `<circle cx="${f(s / 2 + R * Math.cos(a))}" cy="${f(s / 2 + R * Math.sin(a))}" r="${br}" fill="url(#${id})" stroke="#E2CDD6" stroke-width=".45"/>`;
    }
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", s); svg.setAttribute("height", s);
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;inset:0;overflow:visible";
    svg.innerHTML = `<defs><radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#F8EEF0"/><stop offset="1" stop-color="#E5CDD6"/></radialGradient></defs>${beads}`;
    el.appendChild(svg);
  }

  function waxSeal(el) {
    const s = el.offsetWidth, c = s / 2, id = "ws" + (uid++);
    const n = 22, pts = [];
    let seed = 11;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, rr = c - 1.5 - rnd() * 2.6;
      pts.push([c + rr * Math.cos(a), c + rr * Math.sin(a)]);
    }
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", s); svg.setAttribute("height", s);
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;inset:0;overflow:visible";
    svg.innerHTML = `<defs>
        <radialGradient id="${id}" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="#C995A9"/><stop offset=".6" stop-color="#A87389"/><stop offset="1" stop-color="#8C5C72"/></radialGradient>
        <filter id="${id}f" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#5A3044" flood-opacity=".3"/></filter>
      </defs>
      <path d="${d}Z" fill="url(#${id})" filter="url(#${id}f)"/>
      <circle cx="${c}" cy="${c}" r="${c - 8}" fill="none" stroke="#7E4E64" stroke-opacity=".55" stroke-width="1.4"/>
      <circle cx="${c}" cy="${c + .8}" r="${c - 8}" fill="none" stroke="#F3D6E1" stroke-opacity=".45" stroke-width=".8"/>`;
    el.insertBefore(svg, el.firstChild);
  }

  function stamp(el) {
    const w = el.offsetWidth, h = el.offsetHeight, id = "st" + (uid++), step = 7, hr = 2.3;
    let holes = "";
    for (let x = step / 2; x < w; x += step) holes += `<circle cx="${f(x)}" cy="0" r="${hr}"/><circle cx="${f(x)}" cy="${h}" r="${hr}"/>`;
    for (let y = step / 2; y < h; y += step) holes += `<circle cx="0" cy="${f(y)}" r="${hr}"/><circle cx="${w}" cy="${f(y)}" r="${hr}"/>`;
    const src = el.dataset.src;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", w); svg.setAttribute("height", h);
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;inset:0;overflow:visible;filter:drop-shadow(0 3px 4px rgba(94,84,136,.22))";
    svg.innerHTML = `<defs><mask id="${id}"><rect width="${w}" height="${h}" fill="#fff"/><g fill="#000">${holes}</g></mask></defs>
      <g mask="url(#${id})">
        <rect width="${w}" height="${h}" fill="#FFFEFD"/>
        <image href="${src}" x="7" y="7" width="${w - 14}" height="${h - 14}" preserveAspectRatio="xMidYMid slice"/>
        <rect x="7" y="7" width="${w - 14}" height="${h - 14}" fill="none" stroke="#B9AFCF" stroke-width=".6"/>
      </g>`;
    el.appendChild(svg);
  }


  function cameo(el) {
    const w = el.offsetWidth, h = el.offsetHeight, cx = w / 2, cy = h / 2, rx = w / 2 - 6, ry = h / 2 - 6;
    const n = Math.round(Math.PI * (rx + ry) / 10), amp = 3.4, id = "cm" + (uid++);
    const P = (t, k) => [cx + (rx + k) * Math.cos(t), cy + (ry + k) * Math.sin(t)];
    const N = (t) => { const nx = Math.cos(t) / rx, ny = Math.sin(t) / ry, l = Math.hypot(nx, ny); return [nx / l, ny / l]; };
    let d = "", holes = "";
    for (let i = 0; i < n; i++) {
      const t0 = i / n * Math.PI * 2, t1 = (i + 1) / n * Math.PI * 2, tm = (t0 + t1) / 2;
      const a = P(t0, 0), b = P(t1, 0), m = P(tm, 0), nm = N(tm);
      if (!i) d += `M${f(a[0])} ${f(a[1])}`;
      d += ` Q${f(m[0] + nm[0] * amp * 2)} ${f(m[1] + nm[1] * amp * 2)} ${f(b[0])} ${f(b[1])}`;
      holes += `<circle cx="${f(m[0] + nm[0] * amp * .7)}" cy="${f(m[1] + nm[1] * amp * .7)}" r="1.1" fill="#D9D0E6"/>`;
    }
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", w); svg.setAttribute("height", h); svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;inset:0;overflow:visible";
    svg.innerHTML = `<defs><radialGradient id="${id}" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F6F2F8"/></radialGradient>
      <filter id="${id}f" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#5E5488" flood-opacity=".18"/></filter>
      <radialGradient id="${id}p" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#F4EFF7"/><stop offset="1" stop-color="#CFC4DE"/></radialGradient></defs>
      <path d="${d}Z" fill="url(#${id})" stroke="#C6BCD9" stroke-width="1" filter="url(#${id}f)"/>${holes}
      <ellipse cx="${cx}" cy="${cy}" rx="${rx - 7}" ry="${ry - 6}" fill="none" stroke="url(#${id}p)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray=".1 5"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx - 7}" ry="${ry - 6}" fill="none" stroke="#D6CDE3" stroke-width=".4"/>`;
    el.insertBefore(svg, el.firstChild);
  }

  function threaded(el) {
    const w = el.offsetWidth, y = +(el.dataset.ry || 15), x0 = 26, x1 = w - 58, step = 22, id = "th" + (uid++);
    let under = "", over = "", slits = "";
    let i = 0;
    for (let x = x0; x < x1; x += step, i++) {
      const xe = Math.min(x + step, x1);
      if (i % 2 === 0) over += `<rect x="${f(x)}" y="${y - 4}" width="${f(xe - x)}" height="8" fill="url(#${id})"/><line x1="${f(x)}" y1="${y - 1.3}" x2="${f(xe)}" y2="${y - 1.3}" stroke="#fff" stroke-opacity=".7" stroke-width=".9"/>`;
      else under += `<rect x="${f(x)}" y="${y - 2.5}" width="${f(xe - x)}" height="5" fill="#E8D2DC" opacity=".6"/>`;
      slits += `<rect x="${f(x - 1.2)}" y="${y - 6}" width="2.4" height="12" rx="1.2" fill="#E6DDEE" stroke="#C9BEDA" stroke-width=".6"/>`;
    }
    slits += `<rect x="${f(x1 - 1.2)}" y="${y - 6}" width="2.4" height="12" rx="1.2" fill="#E6DDEE" stroke="#C9BEDA" stroke-width=".6"/>`;
    const bx = x1 + 22;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("width", w); svg.setAttribute("height", y + 22); svg.setAttribute("aria-hidden", "true");
    svg.style.cssText = "position:absolute;left:0;top:0;overflow:visible;z-index:2";
    svg.innerHTML = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBEFF4"/><stop offset=".5" stop-color="#F1D6E1"/><stop offset="1" stop-color="#E2BCCB"/></linearGradient></defs>
      ${under}${slits}${over}
      <path d="M${x1} ${y}H${bx}" stroke="url(#${id})" stroke-width="8"/>
      <g transform="translate(${bx - 22} ${y - 12})">
        <path d="M20 13L14 27L17.5 25.2L18.6 28L23 15Z M24 13L30 27L26.5 25.2L25.4 28L21 15Z" fill="#EBCBD8" stroke="#C893A8" stroke-width=".8" stroke-linejoin="round"/>
        <path d="M22 12C17 3 6 2 5 9C4 15 13 17 22 12Z M22 12C27 3 38 2 39 9C40 15 31 17 22 12Z" fill="#F3DCE5" stroke="#C893A8" stroke-width=".9"/>
        <path d="M19 10.5C15 7.5 10 7 8.5 9M25 10.5C29 7.5 34 7 35.5 9" fill="none" stroke="#D9A9BB" stroke-width=".6"/>
        <ellipse cx="22" cy="12" rx="3.2" ry="3.8" fill="#F7E4EB" stroke="#C893A8" stroke-width=".9"/>
      </g>`;
    el.appendChild(svg);
  }

  document.querySelectorAll("[data-shape=cameo]").forEach(cameo);
  document.querySelectorAll("[data-shape=stamp]").forEach(stamp);
  document.querySelectorAll("[data-shape=doily]").forEach(doily);
  document.querySelectorAll("[data-shape=ruffle]").forEach(ruffle);
  document.querySelectorAll("[data-shape=pearlring]").forEach(pearlRing);
  document.querySelectorAll("[data-shape=wax]").forEach(waxSeal);
  document.querySelectorAll("[data-thread]").forEach(threaded);
  document.body.dataset.ready = "1";
})();
