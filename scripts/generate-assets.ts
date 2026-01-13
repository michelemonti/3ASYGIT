import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

async function generateOGImage() {
  console.log('🎨 Generating OG image...');
  
  const svgPath = join(publicDir, 'og-image.svg');
  const pngPath = join(publicDir, 'og-image.png');
  
  const svgContent = readFileSync(svgPath, 'utf-8');
  
  await sharp(Buffer.from(svgContent))
    .resize(1200, 630)
    .png({ quality: 100 })
    .toFile(pngPath);
  
  console.log('✅ og-image.png created (1200x630)');
}

async function generateIcons() {
  console.log('🎨 Generating PWA icons...');
  
  const faviconPath = join(publicDir, 'favicon.svg');
  const faviconContent = readFileSync(faviconPath, 'utf-8');
  
  // 192x192 icon
  await sharp(Buffer.from(faviconContent))
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'));
  console.log('✅ icon-192.png created');
  
  // 512x512 icon  
  await sharp(Buffer.from(faviconContent))
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'));
  console.log('✅ icon-512.png created');
  
  // Apple touch icon
  await sharp(Buffer.from(faviconContent))
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ apple-touch-icon.png created');
}

async function main() {
  try {
    await generateOGImage();
    await generateIcons();
    console.log('\n🚀 All assets generated successfully!');
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

main();
