import { createCanvas, loadImage } from '@napi-rs/canvas';

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
  const width = 1000;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#2b2d31');
  gradient.addColorStop(1, '#1e1f22');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const drawGlassBox = (x, y, w, h) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };

  // 1. LEFT CARD
  drawGlassBox(30, 30, 320, 540);

  // Avatar
  try {
    const avatarImage = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(190, 150, 75, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, 115, 75, 150, 150);
    ctx.restore();
  } catch (err) {
    // fallback if avatar fails to load
    ctx.save();
    ctx.beginPath();
    ctx.arc(190, 150, 75, 0, Math.PI * 2);
    ctx.fillStyle = '#3f4147';
    ctx.fill();
    ctx.restore();
  }

  // Avatar glowing border
  ctx.save();
  ctx.beginPath();
  ctx.arc(190, 150, 75, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(128, 140, 255, 0.6)';
  ctx.lineWidth = 6;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(190, 150, 85, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(128, 140, 255, 0.2)'; 
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // Username
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(username, 190, 280);

  // Bio
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '18px sans-serif';
  ctx.fillText(bio || '—', 190, 310);

  // Separator
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(50, 330);
  ctx.lineTo(330, 330);
  ctx.stroke();

  // Ranks
  ctx.textAlign = 'left';
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('🎙️ Топ по онлайну', 60, 380);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`#${onlineRank}`, 320, 380);

  ctx.textAlign = 'left';
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('💰 Топ по балансу', 60, 430);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`#${balanceRank}`, 320, 430);

  // Separator
  ctx.beginPath();
  ctx.moveTo(50, 460);
  ctx.lineTo(330, 460);
  ctx.stroke();

  // Balance
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('🦋 Монеты', 60, 500);
  ctx.fillStyle = '#ffffff'; 
  ctx.textAlign = 'right';
  ctx.font = '20px sans-serif';
  ctx.fillText(balance.toLocaleString('ru-RU'), 320, 500);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('⭐ Звёзды', 60, 540);
  ctx.fillStyle = '#ffffff'; 
  ctx.textAlign = 'right';
  ctx.fillText(stars.toLocaleString('ru-RU'), 320, 540);


  // 2. RIGHT BLOCKS
  // Top Left: Marriages
  drawGlassBox(370, 30, 300, 110);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Отношения', 400, 70);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '16px sans-serif';
  ctx.fillText(marriageText.slice(0, 30) + (marriageText.length > 30 ? '...' : ''), 400, 100);

  // Top Right: Stats List
  drawGlassBox(690, 30, 280, 240);
  const startY = 80;
  const gap = 45;

  const labels = [
    { text: '🎙️  Голос. онлайн', val: voiceOnlineFormatted },
    { text: '💬  Сообщения', val: messages.toString() },
    { text: '📦  Кейсы', val: cases.toString() },
    { text: '💼  Личные роли', val: personalRoles.toString() }
  ];

  for (let i = 0; i < labels.length; i++) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '16px sans-serif';
    ctx.fillText(labels[i].text, 710, startY + i * gap);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(labels[i].val, 950, startY + i * gap);
  }

  // Middle Left: Cases Command Hint
  drawGlassBox(370, 160, 300, 110);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('/case open', 400, 200);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '16px sans-serif';
  ctx.fillText('Скорее открывай кейсы', 400, 230);
  
  // Bottom: Level Progress bar
  drawGlassBox(370, 290, 600, 280);
  
  // draw Arc
  ctx.save();
  const arcX = 670;
  const arcY = 490;
  const arcRadius = 130;
  // Background Arc
  ctx.beginPath();
  ctx.arc(arcX, arcY, arcRadius, Math.PI, 0);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Foreground Arc
  ctx.beginPath();
  const progress = Math.min(Math.max(xp / (nextXp || 1), 0), 1);
  ctx.arc(arcX, arcY, arcRadius, Math.PI, Math.PI + Math.PI * progress);
  ctx.strokeStyle = '#ffffff'; 
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Level Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px sans-serif';
  ctx.fillText(`${level}`, arcX, arcY - 30);
  ctx.font = '18px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillText('УРОВЕНЬ', arcX, arcY);

  // Xp text under level
  ctx.font = '14px sans-serif';
  ctx.fillText(`${xp} / ${nextXp} XP`, arcX, arcY + 25);
  ctx.restore();

  return await canvas.encode('png');
}
