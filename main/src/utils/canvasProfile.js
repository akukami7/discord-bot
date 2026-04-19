import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
GlobalFonts.registerFromPath(path.join(__dirname, '..', 'assets', 'fonts', 'Inter.ttf'), 'Inter');

export async function generateProfileCard({
  username,
  avatarURL,
  bio,
  onlineRank,
  balanceRank,
  balance,
  stars,
  voiceOnlineFormatted,
  messages,
  cases,
  personalRoles,
  level,
  xp,
  nextXp,
  marriageText
}) {
  const W = 1024;
  const H = 600;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Background gradient ──
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1b1e');
  bg.addColorStop(1, '#2b2d31');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Helper: glass box ──
  const glass = (x, y, w, h, radius = 16) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  // ── Helper: draw separator line ──
  const sep = (x1, x2, y) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  };

  // ============================
  //  LEFT PANEL  (x:20 w:340)
  // ============================
  const LX = 20;
  const LW = 340;
  glass(LX, 20, LW, H - 40);

  const centerX = LX + LW / 2; // 190

  // ── Avatar ──
  const avatarY = 130;
  const avatarR = 70;
  try {
    const img = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, centerX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    ctx.restore();
  } catch {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = '#3f4147';
    ctx.fill();
    ctx.restore();
  }

  // Glow ring
  ctx.beginPath();
  ctx.arc(centerX, avatarY, avatarR + 3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(130,140,255,0.55)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(centerX, avatarY, avatarR + 10, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(130,140,255,0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Username ──
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Inter';
  ctx.fillText(truncText(ctx, username, LW - 40), centerX, avatarY + avatarR + 40);

  // ── Bio ──
  ctx.fillStyle = '#f0a030';
  ctx.font = '16px Inter';
  ctx.fillText(truncText(ctx, bio || '—', LW - 60), centerX, avatarY + avatarR + 65);

  // ── Separator ──
  const rankStartY = avatarY + avatarR + 90;
  sep(LX + 25, LX + LW - 25, rankStartY);

  // ── Ranks ──
  const drawRankRow = (icon, label, value, y) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '16px Inter';
    ctx.fillText(`${icon}  ${label}`, LX + 40, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Inter';
    ctx.fillText(value, LX + LW - 40, y);
  };

  drawRankRow('⊙', 'Топ по онлайну', `#${onlineRank}`, rankStartY + 25);
  drawRankRow('♡', 'Топ по балансу', `#${balanceRank}`, rankStartY + 65);

  // ── Separator ──
  const balY = rankStartY + 95;
  sep(LX + 25, LX + LW - 25, balY);

  // ── Balance rows ──
  const drawBalRow = (icon, value, y) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '16px Inter';
    ctx.fillText(icon, LX + 40, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#f0a030';
    ctx.font = 'bold 18px Inter';
    ctx.fillText(value, LX + LW - 40, y);
  };

  drawBalRow('⚬  Монеты', balance.toLocaleString('ru-RU'), balY + 25);
  drawBalRow('○  Звёзды', stars.toLocaleString('ru-RU'), balY + 65);

  // ============================
  //  RIGHT PANEL  (x:380)
  // ============================
  const RX = 380;
  const RW = W - RX - 20; // 624
  const gap = 12;

  // ── Row 1 & 2: Left column ──
  const r1Y = 20;
  const box1H = 95;
  const box2H = 95;
  const r2Y = r1Y + box1H + gap;

  const leftColW = 290;
  const rightColW = RW - leftColW - gap;

  // Marriage box (Row 1, left)
  glass(RX, r1Y, leftColW, box1H);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Inter';
  ctx.fillText('Отношения', RX + 20, r1Y + 35);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '15px Inter';
  const mText = marriageText.length > 28 ? marriageText.slice(0, 28) + '...' : marriageText;
  ctx.fillText(mText, RX + 20, r1Y + 60);

  // Clan & Partner boxes (Row 2, left)
  const smallW = (leftColW - gap) / 2;
  // Clan
  glass(RX, r2Y, smallW, box2H);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter';
  ctx.fillText('Клан', RX + 15, r2Y + 35);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px Inter';
  ctx.fillText('Нет клана', RX + 15, r2Y + 60);

  // Partner
  glass(RX + smallW + gap, r2Y, smallW, box2H);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter';
  ctx.fillText('Партнёр', RX + smallW + gap + 15, r2Y + 35);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px Inter';
  ctx.fillText('Нет партнёра', RX + smallW + gap + 15, r2Y + 60);

  // ── Stats box (Row 1+2, right) ──
  const statsX = RX + leftColW + gap;
  const statsH = box1H + box2H + gap;
  glass(statsX, r1Y, rightColW, statsH);

  const statLabels = [
    { label: 'Голосовой онлайн', val: voiceOnlineFormatted },
    { label: 'Кол-во сообщений', val: messages.toString() },
    { label: 'Кол-во кейсов', val: cases.toString() },
    { label: 'Кол-во личных ролей', val: personalRoles.toString() }
  ];

  const statStartY = r1Y + 40;
  const statGap = (statsH - 50) / (statLabels.length - 1);

  for (let i = 0; i < statLabels.length; i++) {
    const sy = statStartY + i * statGap;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px Inter';
    ctx.fillText(statLabels[i].label, statsX + 15, sy);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Inter';
    ctx.fillText(statLabels[i].val, statsX + rightColW - 15, sy);
  }

  // ── Row 3: Hints ──
  const r3Y = r2Y + box2H + gap;
  const hintBoxH = 85;
  const wideHintW = (RW - gap) / 2;

  // /case open hint
  glass(RX, r3Y, wideHintW, hintBoxH);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter';
  ctx.fillText('/case open', RX + 20, r3Y + 35);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '13px Inter';
  ctx.fillText('Скорее открывай кейсы', RX + 20, r3Y + 60);

  // /timely hint
  const h2X = RX + wideHintW + gap;
  glass(h2X, r3Y, wideHintW, hintBoxH);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter';
  ctx.fillText('/timely', h2X + 20, r3Y + 35);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '13px Inter';
  ctx.fillText('Пора забирать награду', h2X + 20, r3Y + 60);

  // ── Row 4: Level Block ──
  const r4Y = r3Y + hintBoxH + gap;
  const r4H = H - 20 - r4Y;
  glass(RX, r4Y, RW, r4H);

  // Arch Progress Bar
  const archCenterX = RX + RW / 2;
  const archCenterY = r4Y + r4H - 40; 
  const archRadius = 130;

  // BG Arch
  ctx.beginPath();
  ctx.arc(archCenterX, archCenterY, archRadius, Math.PI, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  // FG Arch
  const progress = Math.min(Math.max(xp / (nextXp || 1), 0), 1);
  if (progress > 0) {
    ctx.beginPath();
    ctx.arc(archCenterX, archCenterY, archRadius, Math.PI, Math.PI + (Math.PI * progress));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Level Text Inside Arch
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${level > 99 ? 60 : 70}px Inter`;
  ctx.fillText(`${level}`, archCenterX, archCenterY - 30);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '16px Inter';
  ctx.fillText('УРОВЕНЬ', archCenterX, archCenterY - 5);

  // XP Text Below Arch
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '14px Inter';
  ctx.fillText(`${xp} / ${nextXp} XP`, archCenterX, archCenterY + 25);

  return await canvas.encode('png');
}

function truncText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (ctx.measureText(t + '…').width > maxWidth && t.length > 0) {
    t = t.slice(0, -1);
  }
  return t + '…';
}
