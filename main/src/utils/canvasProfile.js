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

  drawRankRow('⊙', 'Топ по онлайну', `#${onlineRank}`, rankStartY + 35);
  drawRankRow('♡', 'Топ по балансу', `#${balanceRank}`, rankStartY + 75);

  // ── Separator ──
  const balY = rankStartY + 105;
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

  drawBalRow('⚬  Монеты', balance.toLocaleString('ru-RU'), balY + 35);
  drawBalRow('○  Звёзды', stars.toLocaleString('ru-RU'), balY + 75);

  // ============================
  //  RIGHT PANEL  (x:380)
  // ============================
  const RX = 380;
  const RW = W - RX - 20; // 624
  const gap = 12;

  // ── Row 1: Marriage + Stats (side by side) ──
  const r1Y = 20;
  const r1H = 120;
  const midW = 290;
  const statW = RW - midW - gap;

  // Marriage box
  glass(RX, r1Y, midW, r1H);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Inter';
  ctx.fillText('Отношения', RX + 20, r1Y + 35);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '15px Inter';
  const mText = marriageText.length > 28 ? marriageText.slice(0, 28) + '...' : marriageText;
  ctx.fillText(mText, RX + 20, r1Y + 60);

  // Stats box (right side of row 1 + row 2)
  const statsBoxX = RX + midW + gap;
  const statsBoxH = r1H * 2 + gap;
  glass(statsBoxX, r1Y, statW, statsBoxH);

  const statLabels = [
    { label: 'Голосовой онлайн', val: voiceOnlineFormatted },
    { label: 'Кол-во сообщений', val: messages.toString() },
    { label: 'Кол-во кейсов', val: cases.toString() },
    { label: 'Кол-во личных ролей', val: personalRoles.toString() }
  ];

  const statStartY = r1Y + 35;
  const statGap = (statsBoxH - 40) / statLabels.length;

  for (let i = 0; i < statLabels.length; i++) {
    const sy = statStartY + i * statGap;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px Inter';
    ctx.fillText(statLabels[i].label, statsBoxX + 15, sy);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Inter';
    ctx.fillText(statLabels[i].val, statsBoxX + statW - 15, sy);
  }

  // ── Row 2: Hints (under Marriage) ──
  const r2Y = r1Y + r1H + gap;
  const r2H = r1H;
  const hintW = (midW - gap) / 2;

  // /case open hint
  glass(RX, r2Y, hintW, r2H);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter';
  ctx.fillText('/case open', RX + 15, r2Y + 40);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '12px Inter';
  ctx.fillText('Открывай кейсы', RX + 15, r2Y + 62);

  // /timely hint
  glass(RX + hintW + gap, r2Y, hintW, r2H);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter';
  ctx.fillText('/timely', RX + hintW + gap + 15, r2Y + 40);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '12px Inter';
  ctx.fillText('Забирай награду', RX + hintW + gap + 15, r2Y + 62);

  // ── Row 3: Level block (full width) ──
  const r3Y = r2Y + r2H + gap;
  const r3H = H - 20 - r3Y;
  glass(RX, r3Y, RW, r3H);

  // Level number (big & centered)
  const lvlCenterX = RX + RW / 2;
  const lvlCenterY = r3Y + r3H / 2;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${level > 99 ? 80 : 100}px Inter`;
  ctx.fillText(`${level}`, lvlCenterX, lvlCenterY + 15);

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '18px Inter';
  ctx.fillText('УРОВЕНЬ', lvlCenterX, lvlCenterY + 50);

  // XP progress bar at bottom of level block
  const barW = RW - 60;
  const barH = 10;
  const barX = RX + 30;
  const barY = r3Y + r3H - 35;

  // BG bar
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, barH, 5);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();

  // FG bar
  const progress = Math.min(Math.max(xp / (nextXp || 1), 0), 1);
  if (progress > 0) {
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, barH, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // XP text
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '13px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(`${xp} / ${nextXp} XP`, lvlCenterX, barY - 8);

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
