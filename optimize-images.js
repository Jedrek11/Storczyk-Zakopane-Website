const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;
const HERO_MAX_WIDTH = 1920;

// Directories to scan
const SCAN_DIRS = ['zdj', 'assets'];

// Files to skip (favicons, tiny icons)
const SKIP_PATTERNS = [/favicon/, /apple-touch-icon/, /\.svg$/];

// Track results
const results = { before: 0, after: 0, converted: [], skipped: [], errors: [] };

async function getImageFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getImageFiles(fullPath));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimizeImage(filePath) {
  const relPath = path.relative(ROOT, filePath);

  // Skip favicons and icons
  if (SKIP_PATTERNS.some(p => p.test(relPath))) {
    results.skipped.push(relPath);
    return;
  }

  const stat = fs.statSync(filePath);
  const sizeBefore = stat.size;
  results.before += sizeBefore;

  const ext = path.extname(filePath).toLowerCase();
  const isJpg = ext === '.jpg' || ext === '.jpeg';
  const isPng = ext === '.png';
  const isHero = filePath.includes('hero-bg');

  const maxWidth = isHero ? HERO_MAX_WIDTH : MAX_WIDTH;

  try {
    // Read file into buffer first to avoid Windows file locking issues
    const inputBuffer = fs.readFileSync(filePath);
    const metadata = await sharp(inputBuffer).metadata();
    const needsResize = metadata.width > maxWidth;

    let pipeline = sharp(inputBuffer);

    if (needsResize) {
      pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
    }

    // Convert to WebP or re-compress WebP
    const webpPath = filePath.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');
    // Handle the weird double extension
    const cleanWebpPath = webpPath.replace('.jpg.webp', '.webp');

    const buffer = await pipeline
      .webp({ quality: WEBP_QUALITY, effort: 6 })
      .toBuffer();

    const sizeAfter = buffer.length;
    results.after += sizeAfter;

    // Only save if it's actually smaller or if converting from JPG/PNG
    if (sizeAfter < sizeBefore || isJpg || isPng) {
      fs.writeFileSync(cleanWebpPath, buffer);

      // Remove old JPG/PNG file if we created a new WebP
      if ((isJpg || isPng) && cleanWebpPath !== filePath) {
        fs.unlinkSync(filePath);
        results.converted.push(`${relPath} (${fmt(sizeBefore)}) → ${path.relative(ROOT, cleanWebpPath)} (${fmt(sizeAfter)})`);
      } else {
        results.converted.push(`${relPath}: ${fmt(sizeBefore)} → ${fmt(sizeAfter)}`);
      }
    } else {
      results.after += sizeBefore - sizeAfter; // correct the counter
      results.skipped.push(`${relPath} — already optimal`);
    }
  } catch (err) {
    results.errors.push(`${relPath}: ${err.message}`);
    results.after += sizeBefore; // keep original size in counter
  }
}

function fmt(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function main() {
  console.log('🔍 Scanning for images...\n');

  let allFiles = [];
  for (const dir of SCAN_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (fs.existsSync(fullDir)) {
      allFiles.push(...await getImageFiles(fullDir));
    }
  }

  // Also check root-level images (podglad-*.png etc.)
  const rootFiles = fs.readdirSync(ROOT)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map(f => path.join(ROOT, f));
  allFiles.push(...rootFiles);

  console.log(`Found ${allFiles.length} images to process.\n`);

  for (const file of allFiles) {
    await optimizeImage(file);
  }

  console.log('=== RESULTS ===\n');
  console.log(`Total before: ${fmt(results.before)}`);
  console.log(`Total after:  ${fmt(results.after)}`);
  console.log(`Saved:        ${fmt(results.before - results.after)} (${((1 - results.after / results.before) * 100).toFixed(1)}%)\n`);

  if (results.converted.length) {
    console.log('Optimized files:');
    results.converted.forEach(c => console.log(`  ✅ ${c}`));
  }
  if (results.skipped.length) {
    console.log('\nSkipped:');
    results.skipped.forEach(s => console.log(`  ⏭️  ${s}`));
  }
  if (results.errors.length) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  ❌ ${e}`));
  }
}

main().catch(console.error);
