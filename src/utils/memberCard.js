import QRCode from 'qrcode';

// ID-1 / CR80 card (85.6 × 54 mm) at 300 dpi
export const CARD_W = 1012;
export const CARD_H = 638;
const RADIUS = 34;
const LOGO_SRC = '/mcym-logo.png';

export const ORG_NAME = 'Malankara Catholic Youth Movement';
export const POSITIONS = ['Member', 'President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Executive Member', 'Animator'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const C = {
  red: '#941c34', redDark: '#721226', gold: '#dca84a', green: '#176448',
  ink: '#202b27', muted: '#74807a', line: '#e9e4dc', cream: '#f6f4f0'
};

// ── Identity & links ─────────────────────────────────

const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateMemberId = () => {
  const buf = new Uint8Array(6);
  crypto.getRandomValues(buf);
  const yy = String(new Date().getFullYear()).slice(-2);
  return `MCYM${yy}-${[...buf].map(b => ID_CHARS[b % ID_CHARS.length]).join('')}`;
};

// Links and QR codes must point at the live site, not wherever the admin happens to run the app.
// Set VITE_PUBLIC_URL (e.g. in .env) to the deployed address; falls back to the current origin.
const PUBLIC_URL = (import.meta.env.VITE_PUBLIC_URL || window.location.origin).replace(/\/+$/, '');

export const isLocalLink = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.)/.test(PUBLIC_URL);

export const memberUrl = (id) => `${PUBLIC_URL}/?card=${encodeURIComponent(id)}`;

export const whatsappUrl = (m) => {
  const text = `Hi ${m.name}, your MCYM member card is ready.\n\nOpen it on your phone and save it: ${memberUrl(m.id)}\n\nMember ID: ${m.id}`;
  return `https://wa.me/91${m.phone}?text=${encodeURIComponent(text)}`;
};

export const safeFileName = (name) => (name || '').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-') || 'Member';

export const normalizePhone = (v) => {
  const d = (v || '').replace(/\D/g, '');
  return d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
};

export const formatPhone = (p) => (p ? `+91 ${p.slice(0, 5)} ${p.slice(5)}` : '');

export const initials = (name) => (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

const parseDate = (v) => {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(v);
  return isNaN(d) ? null : d;
};

export const formatDate = (v) => {
  const d = parseDate(v);
  return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
};

export const validTill = (issuedAt) => {
  const d = new Date(issuedAt || Date.now());
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

// ── Asset loading ────────────────────────────────────

let logoPromise;
let fontsPromise;

const loadImage = (src) => new Promise(resolve => {
  if (!src) return resolve(null);
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);
  img.src = src;
});

const loadLogo = () => (logoPromise ??= loadImage(LOGO_SRC));

const ensureFonts = () => (fontsPromise ??= document.fonts
  ? Promise.all(['500', '600', '700', '800'].map(w => document.fonts.load(`${w} 24px Poppins`))).catch(() => {})
  : Promise.resolve());

// The card's photo slot is 4:5 portrait; photos are stored at this size
export const PHOTO_ASPECT = 4 / 5;

export const cropPhoto = (img, sx, sy, sw, sh) => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
};

// ── Drawing helpers ──────────────────────────────────

function makeCanvas(w = CARD_W, h = CARD_H) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale, sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function drawContain(ctx, img, cx, cy, size) {
  const ratio = img.naturalWidth / img.naturalHeight;
  const w = ratio > 1 ? size : size * ratio;
  const h = ratio > 1 ? size / ratio : size;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function setFont(ctx, size, weight = 600) {
  ctx.font = `${weight} ${size}px Poppins, sans-serif`;
}

function text(ctx, str, x, y, { size, weight = 600, color = C.ink, align = 'left', spacing = 0 }) {
  setFont(ctx, size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(str, x, y);
  ctx.letterSpacing = '0px';
}

// Shrink the font until the text fits, then ellipsize as a last resort
function fitText(ctx, str, x, y, maxW, { size, min, weight = 600, color = C.ink, align = 'left' }) {
  let s = size;
  setFont(ctx, s, weight);
  while (s > min && ctx.measureText(str).width > maxW) setFont(ctx, --s, weight);
  let out = str;
  if (ctx.measureText(out).width > maxW) {
    while (out.length > 1 && ctx.measureText(out + '…').width > maxW) out = out.slice(0, -1);
    out = out.trimEnd() + '…';
  }
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(out, x, y);
}

function wrapLines(ctx, str, maxW) {
  const lines = [];
  let line = '';
  for (const word of str.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function field(ctx, label, value, x, y, maxW) {
  ctx.beginPath();
  ctx.arc(x + 4, y - 5, 4, 0, Math.PI * 2);
  ctx.fillStyle = C.gold;
  ctx.fill();
  text(ctx, label.toUpperCase(), x + 16, y, { size: 14, weight: 600, color: C.muted, spacing: 2 });
  fitText(ctx, value || '—', x, y + 36, maxW, { size: 25, min: 18, weight: 600 });
}

function clipCard(ctx) {
  roundRect(ctx, 0, 0, CARD_W, CARD_H, RADIUS);
  ctx.clip();
}

function headerBand(ctx, height) {
  const g = ctx.createLinearGradient(0, 0, CARD_W, height);
  g.addColorStop(0, C.redDark);
  g.addColorStop(1, C.red);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  [120, 175, 230].forEach(r => {
    ctx.beginPath();
    ctx.arc(CARD_W - 70, -10, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  ctx.fillStyle = C.gold;
  ctx.fillRect(0, height, CARD_W, 6);
}

function watermark(ctx, logo, cx, cy, size) {
  if (!logo) return;
  ctx.save();
  ctx.globalAlpha = 0.045;
  drawContain(ctx, logo, cx, cy, size);
  ctx.restore();
}

// ── Card faces ───────────────────────────────────────

async function drawFront(m) {
  const { canvas, ctx } = makeCanvas();
  const [logo, photo] = await Promise.all([loadLogo(), loadImage(m.photo)]);

  clipCard(ctx);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  watermark(ctx, logo, 800, 380, 400);

  // Header
  const HH = 150;
  headerBand(ctx, HH);

  ctx.beginPath();
  ctx.arc(100, HH / 2, 54, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (logo) drawContain(ctx, logo, 100, HH / 2, 82);

  text(ctx, 'MCYM', 178, 72, { size: 46, weight: 800, color: '#ffffff', spacing: 1 });
  text(ctx, ORG_NAME, 178, 108, { size: 21, weight: 500, color: 'rgba(255,255,255,0.82)' });

  // Position pill
  const role = (m.position || 'Member').toUpperCase();
  setFont(ctx, 17, 700);
  ctx.letterSpacing = '2px';
  const pillW = ctx.measureText(role).width + 40;
  ctx.letterSpacing = '0px';
  roundRect(ctx, CARD_W - 44 - pillW, 54, pillW, 42, 21);
  ctx.fillStyle = C.gold;
  ctx.fill();
  text(ctx, role, CARD_W - 44 - pillW / 2 + 1, 82, { size: 17, weight: 700, color: C.redDark, align: 'center', spacing: 2 });

  // Photo
  const PX = 48, PY = 190, PW = 236, PH = 292;
  ctx.save();
  ctx.shadowColor = 'rgba(39,28,20,0.18)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, PX - 6, PY - 6, PW + 12, PH + 12, 24);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, PX, PY, PW, PH, 18);
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, PX, PY, PW, PH);
  } else {
    const g = ctx.createLinearGradient(PX, PY, PX + PW, PY + PH);
    g.addColorStop(0, '#fff0f2');
    g.addColorStop(1, '#fff7e8');
    ctx.fillStyle = g;
    ctx.fillRect(PX, PY, PW, PH);
    text(ctx, initials(m.name), PX + PW / 2, PY + PH / 2 + 34, { size: 96, weight: 700, color: 'rgba(148,28,52,0.75)', align: 'center' });
  }
  ctx.restore();

  // Member ID under the photo
  text(ctx, 'MEMBER ID', PX + PW / 2, 516, { size: 13, weight: 600, color: C.muted, align: 'center', spacing: 2 });
  fitText(ctx, m.id || 'MCYM··-······', PX + PW / 2, 546, PW + 20, { size: 22, min: 16, weight: 700, color: C.red, align: 'center' });

  // Details
  const X = 326, MAXW = CARD_W - X - 48, COL = 330;
  fitText(ctx, m.name || 'Member Name', X, 236, MAXW, { size: 48, min: 28, weight: 700, color: m.name ? C.ink : '#c3c8c5' });
  field(ctx, 'Church / Parish', m.church, X, 300, MAXW);
  field(ctx, 'Place', m.place, X, 386, COL - 24);
  field(ctx, 'Phone', formatPhone(m.phone), X + COL, 386, MAXW - COL);
  field(ctx, 'Diocese', m.diocese, X, 472, COL - 24);
  field(ctx, 'Region', m.region, X + COL, 472, MAXW - COL);

  // Footer
  const FY = CARD_H - 66;
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, FY, CARD_W, 66);
  ctx.fillStyle = C.line;
  ctx.fillRect(0, FY, CARD_W, 2);
  text(ctx, `ISSUED  ${formatDate(m.issuedAt || Date.now()).toUpperCase()}`, 48, FY + 38, { size: 15, weight: 600, color: C.muted, spacing: 1.5 });
  text(ctx, `VALID TILL  ${validTill(m.issuedAt).toUpperCase()}`, CARD_W - 48, FY + 38, { size: 15, weight: 700, color: C.green, align: 'right', spacing: 1.5 });
  ctx.fillStyle = C.green;
  ctx.fillRect(0, CARD_H - 8, CARD_W, 8);

  return canvas;
}

async function drawBack(m) {
  const { canvas, ctx } = makeCanvas();
  const logo = await loadLogo();

  clipCard(ctx);
  ctx.fillStyle = '#fbfaf8';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  watermark(ctx, logo, 790, 400, 380);

  // Header
  const HH = 92;
  headerBand(ctx, HH);
  text(ctx, `MCYM ${m.region || ''} Region`.replace(/\s+/g, ' '), 48, 58, { size: 26, weight: 700, color: '#ffffff' });
  text(ctx, 'MEMBER CARD', CARD_W - 48, 57, { size: 17, weight: 700, color: C.gold, align: 'right', spacing: 3 });

  // QR panel
  const QX = 48, QY = 138, QS = 300;
  roundRect(ctx, QX, QY, QS, QS, 24);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (m.id) {
    const qr = document.createElement('canvas');
    await QRCode.toCanvas(qr, memberUrl(m.id), { margin: 0, width: 248, errorCorrectionLevel: 'M', color: { dark: C.ink, light: '#ffffff' } });
    ctx.drawImage(qr, QX + 26, QY + 26, 248, 248);
  } else {
    ctx.setLineDash([10, 8]);
    roundRect(ctx, QX + 26, QY + 26, 248, 248, 14);
    ctx.strokeStyle = '#d6d0c6';
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, 'QR code appears', QX + QS / 2, QY + QS / 2 - 4, { size: 18, weight: 600, color: C.muted, align: 'center' });
    text(ctx, 'after saving', QX + QS / 2, QY + QS / 2 + 24, { size: 18, weight: 600, color: C.muted, align: 'center' });
  }
  text(ctx, 'SCAN TO VERIFY', QX + QS / 2, QY + QS + 38, { size: 15, weight: 700, color: C.muted, align: 'center', spacing: 2.5 });
  fitText(ctx, m.id || '', QX + QS / 2, QY + QS + 70, QS, { size: 20, min: 15, weight: 700, color: C.red, align: 'center' });

  // Details
  const X = 392, MAXW = CARD_W - X - 48, COL = 290;
  field(ctx, 'Date of birth', m.dob ? formatDate(m.dob) : '', X, 168, COL - 24);
  field(ctx, 'Blood group', m.bloodGroup, X + COL, 168, MAXW - COL);
  field(ctx, 'Issued on', formatDate(m.issuedAt || Date.now()), X, 254, COL - 24);
  field(ctx, 'Valid till', validTill(m.issuedAt), X + COL, 254, MAXW - COL);

  ctx.fillStyle = C.line;
  ctx.fillRect(X, 320, MAXW, 2);

  setFont(ctx, 17, 500);
  ctx.fillStyle = C.muted;
  ctx.textAlign = 'left';
  const note = `This card certifies a registered member of MCYM ${m.region || ''} Region, ${m.diocese || ''} Diocese. It is non-transferable. If found, please return it to the parish office.`.replace(/\s+/g, ' ');
  wrapLines(ctx, note, MAXW).slice(0, 4).forEach((line, i) => ctx.fillText(line, X, 362 + i * 28));

  ctx.fillStyle = C.ink;
  ctx.fillRect(X, 528, 250, 2);
  text(ctx, 'Authorised Signatory', X, 556, { size: 15, weight: 600, color: C.muted });

  ctx.fillStyle = C.green;
  ctx.fillRect(0, CARD_H - 8, CARD_W, 8);

  return canvas;
}

export async function renderCard(member) {
  await ensureFonts();
  const [front, back] = await Promise.all([drawFront(member), drawBack(member)]);
  return { front, back };
}

// Both faces stacked on one image — the version members keep in their phone gallery
export function composeCard(front, back) {
  const pad = 56, gap = 44, caption = 56;
  const { canvas, ctx } = makeCanvas(CARD_W + pad * 2, CARD_H * 2 + gap + pad * 2 + caption);
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  [[front, pad], [back, pad + CARD_H + gap]].forEach(([face, y]) => {
    ctx.save();
    ctx.shadowColor = 'rgba(39,28,20,0.22)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, pad, y, CARD_W, CARD_H, RADIUS);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    ctx.drawImage(face, pad, y);
  });

  text(ctx, 'MCYM  ·  DIGITAL MEMBER CARD', canvas.width / 2, canvas.height - pad, { size: 20, weight: 600, color: C.muted, align: 'center', spacing: 3 });
  return canvas;
}

// ── Output ───────────────────────────────────────────

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png');
});

export async function cardImageFile(member) {
  const { front, back } = await renderCard(member);
  const blob = await canvasToBlob(composeCard(front, back));
  return new File([blob], `${safeFileName(member.name)}-MCYM-Card.png`, { type: 'image/png' });
}

export async function downloadCard(member) {
  const file = await cardImageFile(member);
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const canShareFiles = () => {
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'card.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
};

export async function shareCard(member) {
  const file = await cardImageFile(member);
  await navigator.share({ files: [file], title: 'MCYM Member Card', text: `${member.name} · ${member.id}\n${memberUrl(member.id)}` });
}

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// Prints both faces side by side at true size: cut on the outer line, fold on the centre line, laminate
export async function printCard(member) {
  const { front, back } = await renderCard(member);
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(member.name)} – MCYM Card</title><style>
    @page { size: A4; margin: 20mm; }
    body { margin: 0; font-family: Poppins, system-ui, sans-serif; }
    .sheet { display: flex; flex-direction: column; align-items: center; gap: 6mm; }
    .pair { display: flex; outline: 0.3mm dashed #9aa09c; outline-offset: 1.5mm; }
    .pair img { width: 85.6mm; height: 54mm; display: block; }
    .pair img + img { border-left: 0.3mm dashed #c9c3ba; }
    p { margin: 0; max-width: 160mm; font-size: 8.5pt; line-height: 1.5; color: #74807a; text-align: center; }
  </style></head><body><div class="sheet">
    <div class="pair"><img src="${front.toDataURL('image/png')}" alt=""><img src="${back.toDataURL('image/png')}" alt=""></div>
    <p>Print at 100% scale (actual size, 85.6 × 54 mm). Cut along the outer dashed line, fold along the centre line and laminate for a double-sided card.</p>
  </div></body></html>`);
  doc.close();

  await Promise.all([...doc.images].map(img => (img.complete ? null : new Promise(r => { img.onload = img.onerror = r; }))));
  const win = iframe.contentWindow;
  const cleanup = () => iframe.remove();
  win.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 60000);
  win.focus();
  win.print();
}

// Shared handler for the card actions offered on the list and the editor
export async function runCardAction(action, m, toast) {
  try {
    if (action === 'whatsapp') {
      window.open(whatsappUrl(m), '_blank', 'noopener');
    } else if (action === 'download') {
      await downloadCard(m);
      toast.success('Card downloaded.');
    } else if (action === 'print') {
      await printCard(m);
    } else if (action === 'share') {
      await shareCard(m);
    } else if (action === 'copy') {
      await navigator.clipboard.writeText(memberUrl(m.id));
      toast.success('Card link copied.');
    }
  } catch (err) {
    if (err?.name !== 'AbortError') {
      console.error(err);
      toast.error('Something went wrong. Please try again.');
    }
  }
}
