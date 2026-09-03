import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

const bucket = process.env.R2_BUCKET || 'media';
const database = process.env.D1_DATABASE || 'videohat-db';
const ownerId = process.env.FONT_OWNER_ID || 'official';
const cacheDir = join(tmpdir(), 'videohat-open-fonts');
const wranglerCli = join(process.cwd(), 'node_modules', 'wrangler', 'wrangler-dist', 'cli.js');
const wrangler = (...args) => execFileSync(process.execPath, [wranglerCli, ...args], { stdio: 'inherit' });

const fonts = [
  ['Anton', 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf'],
  ['Bebas Neue', 'https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf'],
  ['Archivo Black', 'https://raw.githubusercontent.com/google/fonts/main/ofl/archivoblack/ArchivoBlack-Regular.ttf'],
  ['Oswald', 'https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/Oswald%5Bwght%5D.ttf'],
  ['Montserrat', 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf'],
  ['Poppins Black', 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Black.ttf'],
  ['Poppins ExtraBold', 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-ExtraBold.ttf'],
  ['Poppins SemiBold', 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-SemiBold.ttf'],
  ['Barlow Condensed Black', 'https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/BarlowCondensed-Black.ttf'],
  ['Barlow Condensed ExtraBold', 'https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/BarlowCondensed-ExtraBold.ttf'],
  ['Fjalla One', 'https://raw.githubusercontent.com/google/fonts/main/ofl/fjallaone/FjallaOne-Regular.ttf'],
  ['Libre Franklin', 'https://raw.githubusercontent.com/google/fonts/main/ofl/librefranklin/LibreFranklin%5Bwght%5D.ttf'],
  ['Raleway', 'https://raw.githubusercontent.com/google/fonts/main/ofl/raleway/Raleway%5Bwght%5D.ttf'],
  ['Inter', 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz%2Cwght%5D.ttf'],
  ['Roboto Condensed', 'https://raw.githubusercontent.com/google/fonts/main/apache/robotocondensed/RobotoCondensed%5Bwght%5D.ttf'],
  ['Merriweather Sans', 'https://raw.githubusercontent.com/google/fonts/main/ofl/merriweathersans/MerriweatherSans%5Bwght%5D.ttf'],
  ['Playfair Display', 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf'],
  ['Lora', 'https://raw.githubusercontent.com/google/fonts/main/ofl/lora/Lora%5Bwght%5D.ttf'],
  ['Cormorant Garamond Bold', 'https://raw.githubusercontent.com/google/fonts/main/ofl/cormorantgaramond/CormorantGaramond-Bold.ttf'],
  ['Crimson Pro', 'https://raw.githubusercontent.com/google/fonts/main/ofl/crimsonpro/CrimsonPro%5Bwght%5D.ttf'],
  ['Bitter', 'https://raw.githubusercontent.com/google/fonts/main/ofl/bitter/Bitter%5Bwght%5D.ttf'],
  ['Noto Sans SC', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf'],
  ['Noto Serif SC', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf'],
  ['ZCOOL KuaiLe', 'https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolkuaile/ZCOOLKuaiLe-Regular.ttf'],
  ['ZCOOL QingKe HuangYou', 'https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf'],
  ['ZCOOL XiaoWei', 'https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolxiaowei/ZCOOLXiaoWei-Regular.ttf'],
  ['Maoken Zhuyuan', 'https://raw.githubusercontent.com/google/fonts/main/ofl/maokenzhuyuan/MaokenZhuyuan-Regular.ttf'],
  ['Long Cang', 'https://raw.githubusercontent.com/google/fonts/main/ofl/longcang/LongCang-Regular.ttf'],
  ['Zhi Mang Xing', 'https://raw.githubusercontent.com/google/fonts/main/ofl/zhimangxing/ZhiMangXing-Regular.ttf'],
  ['Ma Shan Zheng', 'https://raw.githubusercontent.com/google/fonts/main/ofl/mashanzheng/MaShanZheng-Regular.ttf'],
];

const slug = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9._@-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 120);

const sqlEscape = (value) => String(value ?? '').replaceAll("'", "''");

const contentTypeFor = (fileName) => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.woff2')) return 'font/woff2';
  if (lower.endsWith('.woff')) return 'font/woff';
  if (lower.endsWith('.ttf')) return 'font/ttf';
  if (lower.endsWith('.otf')) return 'font/otf';
  if (lower.endsWith('.ttc')) return 'font/collection';
  return 'application/octet-stream';
};

const extFromUrl = (url) => {
  const clean = decodeURIComponent(url.split('?')[0]);
  const match = clean.match(/\.(woff2?|ttf|otf|ttc)$/i);
  return match ? match[0].toLowerCase() : '.ttf';
};

mkdirSync(cacheDir, { recursive: true });
const uploaded = [];

for (const [family, url] of fonts) {
  const ext = extFromUrl(url);
  const fileName = `${family}${ext}`.replace(/[\\/:*?"<>|]+/g, '-');
  const filePath = join(cacheDir, fileName);
  const objectKey = `${ownerId}/font/${slug(fileName)}`;
  const contentType = contentTypeFor(fileName);

  process.stdout.write(`Downloading ${family}... `);
  const response = await fetch(url, { headers: { 'user-agent': 'VideoHat font seeder' } });
  if (!response.ok) {
    console.log(`skip HTTP ${response.status}`);
    continue;
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  writeFileSync(filePath, bytes);
  const size = statSync(filePath).size;
  console.log(`${(size / 1024 / 1024).toFixed(2)} MB`);

  console.log(`Uploading ${objectKey}`);
  wrangler(
    'r2', 'object', 'put', `${bucket}/${objectKey}`,
    '--remote',
    '--file', filePath,
    '--content-type', contentType,
    '--cache-control', 'public, max-age=31536000, immutable',
  );

  uploaded.push({
    id: `font-${slug(family) || randomUUID()}`,
    ownerId,
    projectId: 'official-fonts',
    kind: 'font',
    fileName,
    objectKey,
    contentType,
    size,
  });
}

if (!uploaded.length) {
  console.log('No fonts uploaded.');
  process.exit(1);
}

const sql = uploaded.map((font) => `INSERT INTO assets (id, owner_id, project_id, kind, file_name, object_key, content_type, size) VALUES ('${sqlEscape(font.id)}', '${sqlEscape(font.ownerId)}', '${sqlEscape(font.projectId)}', 'font', '${sqlEscape(font.fileName)}', '${sqlEscape(font.objectKey)}', '${sqlEscape(font.contentType)}', ${font.size}) ON CONFLICT(object_key) DO UPDATE SET file_name = excluded.file_name, content_type = excluded.content_type, size = excluded.size, created_at = CURRENT_TIMESTAMP;`).join('\n');
const sqlFile = join(cacheDir, `fonts-${Date.now()}.sql`);
writeFileSync(sqlFile, sql);

console.log(`Registering ${uploaded.length} fonts in D1...`);
wrangler('d1', 'execute', database, '--remote', '--file', sqlFile);
console.log(`Done. Seeded ${uploaded.length} open-source fonts into R2 bucket "${bucket}" and D1 "${database}".`);
