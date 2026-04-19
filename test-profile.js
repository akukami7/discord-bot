import { generateProfileCard } from './main/src/utils/canvasProfile.js';
import fs from 'fs';

async function test() {
  const buf = await generateProfileCard({
    username: 'kise akeruna',
    avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
    bio: 'мяу',
    onlineRank: 2,
    balanceRank: 1,
    balance: 200,
    stars: 28093,
    voiceOnlineFormatted: '840 ч. 15 мин.',
    messages: 1300,
    cases: 98,
    personalRoles: 2,
    level: 1,
    xp: 141,
    nextXp: 155,
    marriageText: 'Не в браке'
  });
  fs.writeFileSync('test-out.png', buf);
  console.log('Done');
}
test();
