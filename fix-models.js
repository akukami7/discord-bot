import fs from 'fs';
import path from 'path';

function fixModels(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixModels(fullPath);
    } else if (file.endsWith('.js') && fullPath.includes('models')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      // Look for: export default mongoose.model('Name', schema);
      // Replace with: export default mongoose.models.Name || mongoose.model('Name', schema);
      let modified = false;
      content = content.replace(/export\s+default\s+mongoose\.model\(\s*['"]([^'"]+)['"]\s*,\s*([^,)]+)(\s*,\s*['"][^'"]+['"])?\)/g, (match, modelName, schemaVar, thirdArg) => {
        modified = true;
        const arg3 = thirdArg || '';
        return `export default mongoose.models.${modelName} || mongoose.model('${modelName}', ${schemaVar}${arg3})`;
      });
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Fixed: ${fullPath}`);
      }
    }
  }
}

fixModels('./src/models');
fixModels('./main/src/models');
fixModels('./moderator/src/models');
fixModels('./Cases/src/models');
