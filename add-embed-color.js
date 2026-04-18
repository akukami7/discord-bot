import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let modified = false;

      // Replace `new EmbedBuilder()` with `new EmbedBuilder().setColor(0x2B2D31)`
      if (content.includes('new EmbedBuilder()')) {
        content = content.replace(/new EmbedBuilder\(\)(?!\.setColor)/g, 'new EmbedBuilder().setColor(0x2B2D31)');
        modified = true;
      }
      // Or if there is spacing like new EmbedBuilder( )

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Added default gray color to embeds in: ${fullPath}`);
      }
    }
  }
}

console.log('Starting inject script...');
processDirectory('./src');
processDirectory('./main/src');
processDirectory('./moderator/src');
processDirectory('./Cases/src');
console.log('Done script.');
