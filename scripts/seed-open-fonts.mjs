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
const wranglerText = (...args) => execFileSync(process.execPath, [wranglerCli, ...args], { encoding: 'utf8' });

const googleCss = (family, weights = '400;700;900') => `google:${family}:wght@${weights}`;

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
  ['Open Sans', 'https://raw.githubusercontent.com/google/fonts/main/apache/opensans/OpenSans%5Bwdth%2Cwght%5D.ttf'],
  ['Lato Black', 'https://raw.githubusercontent.com/google/fonts/main/ofl/lato/Lato-Black.ttf'],
  ['DM Sans', 'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf'],
  ['Urbanist', 'https://raw.githubusercontent.com/google/fonts/main/ofl/urbanist/Urbanist%5Bwght%5D.ttf'],
  ['Manrope', 'https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf'],
  ['Sora', 'https://raw.githubusercontent.com/google/fonts/main/ofl/sora/Sora%5Bwght%5D.ttf'],
  ['Outfit', 'https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf'],
  ['Rubik', 'https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/Rubik%5Bwght%5D.ttf'],
  ['Nunito', 'https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/Nunito%5Bwght%5D.ttf'],
  ['Quicksand', 'https://raw.githubusercontent.com/google/fonts/main/ofl/quicksand/Quicksand%5Bwght%5D.ttf'],
  ['Kanit Bold', 'https://raw.githubusercontent.com/google/fonts/main/ofl/kanit/Kanit-Bold.ttf'],
  ['Rajdhani Bold', 'https://raw.githubusercontent.com/google/fonts/main/ofl/rajdhani/Rajdhani-Bold.ttf'],
  ['Teko Bold', 'https://raw.githubusercontent.com/google/fonts/main/ofl/teko/Teko-Bold.ttf'],
  ['Russo One', 'https://raw.githubusercontent.com/google/fonts/main/ofl/russoone/RussoOne-Regular.ttf'],
  ['Lilita One', 'https://raw.githubusercontent.com/google/fonts/main/ofl/lilitaone/LilitaOne-Regular.ttf'],
  ['Bangers', 'https://raw.githubusercontent.com/google/fonts/main/ofl/bangers/Bangers-Regular.ttf'],
  ['Luckiest Guy', 'https://raw.githubusercontent.com/google/fonts/main/ofl/luckiestguy/LuckiestGuy-Regular.ttf'],
  ['Alfa Slab One', 'https://raw.githubusercontent.com/google/fonts/main/ofl/alfaslabone/AlfaSlabOne-Regular.ttf'],
  ['Fredoka', 'https://raw.githubusercontent.com/google/fonts/main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf'],
  ['Baloo 2', 'https://raw.githubusercontent.com/google/fonts/main/ofl/baloo2/Baloo2%5Bwght%5D.ttf'],
  ['Pacifico', 'https://raw.githubusercontent.com/google/fonts/main/ofl/pacifico/Pacifico-Regular.ttf'],
  ['Dancing Script', 'https://raw.githubusercontent.com/google/fonts/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf'],
  ['Caveat', 'https://raw.githubusercontent.com/google/fonts/main/ofl/caveat/Caveat%5Bwght%5D.ttf'],
  ['Permanent Marker', 'https://raw.githubusercontent.com/google/fonts/main/ofl/permanentmarker/PermanentMarker-Regular.ttf'],
  ['Noto Sans TC', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf'],
  ['Noto Sans JP', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf'],
  ['Noto Sans KR', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf'],
  ['Noto Serif TC', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoseriftc/NotoSerifTC%5Bwght%5D.ttf'],
  ['Noto Serif JP', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifjp/NotoSerifJP%5Bwght%5D.ttf'],
  ['Noto Serif KR', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf'],
  ['Roboto', googleCss('Roboto')],
  ['Roboto Condensed', googleCss('Roboto Condensed')],
  ['Roboto Slab', googleCss('Roboto Slab')],
  ['Open Sans', googleCss('Open Sans')],
  ['Source Sans 3', googleCss('Source Sans 3')],
  ['Source Serif 4', googleCss('Source Serif 4')],
  ['Source Code Pro', googleCss('Source Code Pro')],
  ['Work Sans', googleCss('Work Sans')],
  ['Space Grotesk', googleCss('Space Grotesk')],
  ['Lexend', googleCss('Lexend')],
  ['Plus Jakarta Sans', googleCss('Plus Jakarta Sans')],
  ['IBM Plex Sans', googleCss('IBM Plex Sans')],
  ['IBM Plex Serif', googleCss('IBM Plex Serif')],
  ['IBM Plex Mono', googleCss('IBM Plex Mono')],
  ['Josefin Sans', googleCss('Josefin Sans')],
  ['Jost', googleCss('Jost')],
  ['Exo 2', googleCss('Exo 2')],
  ['Titillium Web', googleCss('Titillium Web')],
  ['Prompt', googleCss('Prompt')],
  ['Heebo', googleCss('Heebo')],
  ['Mulish', googleCss('Mulish')],
  ['Figtree', googleCss('Figtree')],
  ['Cabinet Grotesk', 'https://raw.githubusercontent.com/Indian-Type-Foundry/Cabinet-Grotesk/master/fonts/variable/CabinetGrotesk-Variable.ttf'],
  ['Righteous', googleCss('Righteous', '400')],
  ['Rowdies', googleCss('Rowdies', '300;400;700')],
  ['Passion One', googleCss('Passion One', '400;700;900')],
  ['Changa One', googleCss('Changa One', '400')],
  ['Black Ops One', googleCss('Black Ops One', '400')],
  ['Staatliches', googleCss('Staatliches', '400')],
  ['Bowlby One SC', googleCss('Bowlby One SC', '400')],
  ['Fugaz One', googleCss('Fugaz One', '400')],
  ['Paytone One', googleCss('Paytone One', '400')],
  ['Secular One', googleCss('Secular One', '400')],
  ['Ultra', googleCss('Ultra', '400')],
  ['Knewave', googleCss('Knewave', '400')],
  ['Kalam', googleCss('Kalam', '300;400;700')],
  ['Patrick Hand', googleCss('Patrick Hand', '400')],
  ['Shadows Into Light', googleCss('Shadows Into Light', '400')],
  ['Indie Flower', googleCss('Indie Flower', '400')],
  ['Amatic SC', googleCss('Amatic SC', '400;700')],
  ['Satisfy', googleCss('Satisfy', '400')],
  ['Lobster', googleCss('Lobster', '400')],
  ['Dela Gothic One', 'https://raw.githubusercontent.com/google/fonts/main/ofl/delagothicone/DelaGothicOne-Regular.ttf'],
  ['Rampart One', 'https://raw.githubusercontent.com/google/fonts/main/ofl/rampartone/RampartOne-Regular.ttf'],
  ['Reggae One', 'https://raw.githubusercontent.com/google/fonts/main/ofl/reggaeone/ReggaeOne-Regular.ttf'],
  ['Zen Maru Gothic', 'https://raw.githubusercontent.com/google/fonts/main/ofl/zenmarugothic/ZenMaruGothic-Regular.ttf'],
  ['Kiwi Maru', 'https://raw.githubusercontent.com/google/fonts/main/ofl/kiwimaru/KiwiMaru-Regular.ttf'],
  ['Liu Jian Mao Cao', 'https://raw.githubusercontent.com/google/fonts/main/ofl/liujianmaocao/LiuJianMaoCao-Regular.ttf'],
  ['Noto Sans HK', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanshk/NotoSansHK%5Bwght%5D.ttf'],
  ['Noto Serif HK', 'https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifhk/NotoSerifHK%5Bwght%5D.ttf'],
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

const resolveGoogleCssFontUrl = async (source) => {
  const [, family, axis = 'wght@400;700;900'] = source.match(/^google:([^:]+)(?::(.+))?$/) || [];
  if (!family) return null;
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replaceAll('%20', '+')}:${axis}&display=swap`;
  const response = await fetch(cssUrl, { headers: { 'user-agent': 'Mozilla/5.0 VideoHat font seeder' } });
  if (!response.ok) return null;
  const css = await response.text();
  const urls = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((match) => match[1]);
  return urls.at(-1) || null;
};

const resolveFontSource = async (source) => {
  if (!String(source).startsWith('google:')) return { url: source, ext: extFromUrl(source) };
  const url = await resolveGoogleCssFontUrl(source);
  return url ? { url, ext: '.woff2' } : null;
};

const parseWranglerJson = (output) => {
  const start = output.indexOf('[');
  const end = output.lastIndexOf(']');
  if (start < 0 || end < start) return [];
  return JSON.parse(output.slice(start, end + 1));
};

const loadExistingFontKeys = () => {
  try {
    const output = wranglerText('d1', 'execute', database, '--remote', '--command', "SELECT object_key FROM assets WHERE kind = 'font';");
    return new Set(parseWranglerJson(output).flatMap((item) => item.results || []).map((row) => row.object_key).filter(Boolean));
  } catch (error) {
    console.warn('Could not read existing font list, continuing without skip.');
    return new Set();
  }
};

mkdirSync(cacheDir, { recursive: true });
const uploaded = [];
const existingKeys = loadExistingFontKeys();

for (const [family, source] of fonts) {
  const resolved = await resolveFontSource(source);
  if (!resolved) {
    console.log(`Downloading ${family}... skip css lookup`);
    continue;
  }
  const { url, ext } = resolved;
  const fileName = `${family}${ext}`.replace(/[\\/:*?"<>|]+/g, '-');
  const filePath = join(cacheDir, fileName);
  const objectKey = `${ownerId}/font/${slug(fileName)}`;
  const contentType = contentTypeFor(fileName);

  if (existingKeys.has(objectKey)) {
    console.log(`Skipping ${family}... already registered`);
    continue;
  }

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
  console.log('No new fonts uploaded.');
  process.exit(0);
}

const sql = uploaded.map((font) => `INSERT INTO assets (id, owner_id, project_id, kind, file_name, object_key, content_type, size) VALUES ('${sqlEscape(font.id)}', '${sqlEscape(font.ownerId)}', '${sqlEscape(font.projectId)}', 'font', '${sqlEscape(font.fileName)}', '${sqlEscape(font.objectKey)}', '${sqlEscape(font.contentType)}', ${font.size}) ON CONFLICT(object_key) DO UPDATE SET file_name = excluded.file_name, content_type = excluded.content_type, size = excluded.size, created_at = CURRENT_TIMESTAMP;`).join('\n');
const sqlFile = join(cacheDir, `fonts-${Date.now()}.sql`);
writeFileSync(sqlFile, sql);

console.log(`Registering ${uploaded.length} fonts in D1...`);
wrangler('d1', 'execute', database, '--remote', '--file', sqlFile);
console.log(`Done. Seeded ${uploaded.length} open-source fonts into R2 bucket "${bucket}" and D1 "${database}".`);
