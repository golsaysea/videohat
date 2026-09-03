<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#05060c]/90 p-6 backdrop-blur">
    <div class="flex h-full max-h-[92vh] w-full flex-col overflow-hidden rounded-lg border border-[#30364a] bg-[#0a0d16] shadow-2xl">
      <div class="flex shrink-0 items-center justify-between border-b border-[#30364a] bg-[#151827] px-5 py-3">
        <div>
          <h2 class="m-0 text-base font-bold text-cyan-300">VideoKit 批量表格</h2>
          <p class="m-0 mt-1 text-xs text-gray-500">批量拖入视频、配音、配乐；表格文案会按文件名优先匹配，缺省时按顺序循环。</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-2 text-xs text-gray-200 hover:bg-[#2b3146]" @click="generate">应用表格工程</button>
          <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-2 text-xs text-gray-200 hover:bg-[#2b3146]" @click="emit('close')">关闭</button>
        </div>
      </div>

      <div class="grid min-h-0 flex-1 grid-cols-[310px_minmax(520px,1fr)_330px] overflow-hidden">
        <aside class="min-h-0 overflow-y-auto border-r border-[#252b3a] bg-[#101421] p-4">
          <div class="mb-4 rounded border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs leading-relaxed text-cyan-100">
            {{ bulkHint }}
          </div>

          <div class="mb-4 grid grid-cols-3 gap-2 text-center text-[11px] text-gray-400">
            <div class="rounded border border-[#2d3548] bg-black/20 p-2"><b class="block text-sm text-white">{{ batchVideos.length }}</b>视频</div>
            <div class="rounded border border-[#2d3548] bg-black/20 p-2"><b class="block text-sm text-white">{{ batchAudios.length }}</b>配音</div>
            <div class="rounded border border-[#2d3548] bg-black/20 p-2"><b class="block text-sm text-white">{{ batchMusic.length }}</b>配乐</div>
          </div>

          <section class="space-y-3">
            <div class="rounded border border-[#30364a] bg-[#151a2a] p-3">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="m-0 text-sm font-bold text-white">批量实拍视频</h3>
                <label class="cursor-pointer rounded border border-blue-500/40 px-2 py-1 text-[11px] text-blue-200 hover:bg-blue-500/10">
                  选择
                  <input class="hidden" type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.quicktime" multiple @change="event => addBatchFiles(event, 'video')" />
                </label>
              </div>
              <div class="rounded border border-dashed border-[#45506a] bg-black/20 p-3 text-center text-xs text-gray-400" @dragover.prevent @drop.prevent="event => dropFiles(event, 'video')">拖入多个视频文件</div>
              <FileList :items="batchVideos" empty="还没有视频素材" />
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button class="rounded border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-100 hover:bg-blue-500/20" :disabled="!batchVideos.length" @click="applyMaterialToTable('video', 'asc')">正序写入视频列</button>
                <button class="rounded border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-100 hover:bg-blue-500/20" :disabled="!batchVideos.length" @click="applyMaterialToTable('video', 'desc')">倒序写入视频列</button>
              </div>
            </div>

            <div class="rounded border border-[#30364a] bg-[#151a2a] p-3">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="m-0 text-sm font-bold text-white">批量配音音频</h3>
                <label class="cursor-pointer rounded border border-green-500/40 px-2 py-1 text-[11px] text-green-200 hover:bg-green-500/10">
                  选择
                  <input class="hidden" type="file" accept="audio/*" multiple @change="event => addBatchFiles(event, 'audio')" />
                </label>
              </div>
              <div class="rounded border border-dashed border-[#45506a] bg-black/20 p-3 text-center text-xs text-gray-400" @dragover.prevent @drop.prevent="event => dropFiles(event, 'audio')">拖入多个配音文件</div>
              <FileList :items="batchAudios" empty="还没有配音素材" />
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button class="rounded border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-100 hover:bg-green-500/20" :disabled="!batchAudios.length" @click="applyMaterialToTable('audio', 'asc')">正序写入音频列</button>
                <button class="rounded border border-green-500/40 bg-green-500/10 px-3 py-2 text-xs text-green-100 hover:bg-green-500/20" :disabled="!batchAudios.length" @click="applyMaterialToTable('audio', 'desc')">倒序写入音频列</button>
              </div>
            </div>

            <div class="rounded border border-[#30364a] bg-[#151a2a] p-3">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="m-0 text-sm font-bold text-white">批量配乐</h3>
                <label class="cursor-pointer rounded border border-purple-500/40 px-2 py-1 text-[11px] text-purple-200 hover:bg-purple-500/10">
                  选择
                  <input class="hidden" type="file" accept="audio/*" multiple @change="event => addBatchFiles(event, 'music')" />
                </label>
              </div>
              <div class="rounded border border-dashed border-[#45506a] bg-black/20 p-3 text-center text-xs text-gray-400" @dragover.prevent @drop.prevent="event => dropFiles(event, 'music')">拖入多个背景音乐</div>
              <div class="mt-3 flex items-center gap-3 text-xs text-gray-300">
                <span class="w-16">配乐音量</span>
                <input v-model.number="musicVolume" class="min-w-0 flex-1 accent-purple-500" type="range" min="0" max="100" step="1" />
                <span class="w-10 text-right text-purple-200">{{ musicVolume }}%</span>
              </div>
              <FileList :items="batchMusic" empty="还没有配乐素材" />
              <div class="mt-3 grid grid-cols-2 gap-2">
                <button class="rounded border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 hover:bg-purple-500/20" :disabled="!batchMusic.length" @click="applyMaterialToTable('music', 'asc')">正序写入配乐列</button>
                <button class="rounded border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 hover:bg-purple-500/20" :disabled="!batchMusic.length" @click="applyMaterialToTable('music', 'desc')">倒序写入配乐列</button>
              </div>
            </div>
          </section>

          <div class="mt-4 rounded border border-amber-500/30 bg-amber-500/10 p-3">
            <label class="block text-xs text-amber-100">填充策略</label>
            <select v-model="materialApplyMode" class="mt-2 w-full rounded border border-[#41485a] bg-[#070a12] px-2 py-2 text-xs text-white outline-none focus:border-amber-400">
              <option value="fill">补全空位，多余素材自动添加新行</option>
              <option value="overwrite">覆盖，从第 1 行开始写入</option>
              <option value="append">添加新行，全部作为新任务</option>
            </select>
            <button class="mt-3 w-full rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-500/20" @click="appendRowsForAllMedia">同步到素材数量行</button>
          </div>
        </aside>

        <div class="min-h-0 min-w-0 overflow-hidden border-r border-[#252b3a]">
          <BulkTable />
        </div>
        <div class="min-h-0 min-w-0 overflow-y-auto bg-[#121625]">
          <TemplateBindings />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import BulkTable from './BulkTable.vue';
import TemplateBindings from './TemplateBindings.vue';
import { useBulkStore } from '../stores/bulkStore';
import { WebAssetPool } from '../utils/WebAssetPool.js';

const props = defineProps({
  templateOverlay: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close', 'generate']);
const store = useBulkStore();
const batchVideos = ref([]);
const batchAudios = ref([]);
const batchMusic = ref([]);
const musicVolume = ref(30);
const materialApplyMode = ref('fill');
const bulkHint = ref('提示：可以直接粘贴表格文案，也可以先拖入素材，再用补全/覆盖/追加把文件名写入对应列。');

const formatSize = (size) => {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const FileList = defineComponent({
  props: {
    items: { type: Array, default: () => [] },
    empty: { type: String, default: '' },
  },
  setup(fileProps) {
    return () => fileProps.items.length
      ? h('div', { class: 'mt-2 max-h-32 space-y-1 overflow-y-auto' }, fileProps.items.map((item, index) => h('div', { class: 'flex items-center gap-2 rounded bg-black/30 px-2 py-1 text-[11px] text-gray-300', title: item.name }, [
        h('span', { class: 'w-5 shrink-0 text-right text-gray-500' }, String(index + 1)),
        h('span', { class: 'min-w-0 flex-1 truncate' }, item.name),
        h('span', { class: 'shrink-0 text-gray-500' }, formatSize(item.size)),
      ])))
      : h('p', { class: 'mt-2 text-[11px] text-gray-500' }, fileProps.empty);
  },
});

const pools = computed(() => ({
  video: batchVideos.value,
  audio: batchAudios.value,
  music: batchMusic.value,
}));

const columnNames = {
  video: '视频文件名',
  audio: '音频文件名',
  music: '配乐文件名',
};

const poolLabels = {
  video: '视频',
  audio: '配音',
  music: '配乐',
};

const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const naturalSortRecords = (records, direction = 'asc') => [...records].sort((a, b) => {
  const result = naturalCollator.compare(a.name || a.path || '', b.name || b.path || '');
  return direction === 'desc' ? -result : result;
});

const mergeRecords = (current, records) => {
  const map = new Map(current.map((item) => [normalizeMatchName(item.name || item.path), item]));
  records.forEach((item) => map.set(normalizeMatchName(item.name || item.path), item));
  return naturalSortRecords(Array.from(map.values()));
};

const registerFiles = (files) => {
  const fileList = Array.from(files || []);
  const paths = WebAssetPool.registerFiles(fileList);
  return paths.map((path, index) => WebAssetPool.getRecord(path) || {
    file: fileList[index],
    url: WebAssetPool.getUrl(path),
    name: fileList[index]?.name || path,
    path,
    size: fileList[index]?.size || 0,
  });
};

const applyFiles = (files, kind) => {
  const records = registerFiles(Array.from(files || []));
  if (!records.length) return;
  if (kind === 'video') batchVideos.value = mergeRecords(batchVideos.value, records);
  if (kind === 'audio') batchAudios.value = mergeRecords(batchAudios.value, records);
  if (kind === 'music') batchMusic.value = mergeRecords(batchMusic.value, records);
  bulkHint.value = `已读取 ${records.length} 个${poolLabels[kind]}素材。可写入表格列，也可直接生成队列。`;
};

const addBatchFiles = (event, kind) => {
  applyFiles(event.target.files, kind);
  event.target.value = '';
};

const dropFiles = (event, kind) => {
  applyFiles(event.dataTransfer?.files || [], kind);
};

const ensureColumn = (name) => {
  let index = store.columns.findIndex((column) => column.name === name);
  if (index < 0) {
    store.columns.push({ name, type: 'text' });
    index = store.columns.length - 1;
  }
  store.normalizeRows();
  return index;
};

const ensureRows = (count) => {
  while (store.rows.length < count) store.rows.push(new Array(store.columns.length).fill(''));
  store.normalizeRows();
};

const writeMusicVolume = (rowIndex, force = false) => {
  const volumeColumn = ensureColumn('配乐音量%');
  ensureRows(rowIndex + 1);
  if (force || !String(store.rows[rowIndex][volumeColumn] || '').trim()) store.rows[rowIndex][volumeColumn] = String(musicVolume.value);
};

const refreshTemplateBindings = () => {
  store.templates.forEach((template) => {
    template.bindings = store.createAutoBindings();
  });
  store.saveDraft();
};

const applyMaterialToTable = (kind, direction = 'asc') => {
  const pool = naturalSortRecords(pools.value[kind] || [], direction);
  if (!pool.length) {
    window.alert(`请先选择${poolLabels[kind]}素材`);
    return;
  }
  const col = ensureColumn(columnNames[kind]);
  let written = 0;

  if (materialApplyMode.value === 'append') {
    const start = store.rows.length;
    ensureRows(start + pool.length);
    pool.forEach((item, offset) => {
      const rowIndex = start + offset;
      store.rows[rowIndex][col] = item.name;
      if (kind === 'music') writeMusicVolume(rowIndex, true);
      written += 1;
    });
  } else if (materialApplyMode.value === 'overwrite') {
    ensureRows(pool.length);
    pool.forEach((item, rowIndex) => {
      store.rows[rowIndex][col] = item.name;
      if (kind === 'music') writeMusicVolume(rowIndex, true);
      written += 1;
    });
  } else {
    let cursor = 0;
    pool.forEach((item) => {
      let rowIndex = store.rows.findIndex((row, index) => index >= cursor && !String(row[col] || '').trim());
      if (rowIndex < 0) {
        rowIndex = store.rows.length;
        ensureRows(rowIndex + 1);
      }
      store.rows[rowIndex][col] = item.name;
      if (kind === 'music') writeMusicVolume(rowIndex, false);
      cursor = rowIndex + 1;
      written += 1;
    });
  }

  refreshTemplateBindings();
  bulkHint.value = `已按“${materialApplyMode.value === 'fill' ? '补全空位' : materialApplyMode.value === 'overwrite' ? '覆盖' : '添加新行'} / ${direction === 'desc' ? '倒序' : '正序'}”写入 ${written} 个${poolLabels[kind]}素材。`;
};

const writePoolColumnByIndex = (kind, records) => {
  const col = ensureColumn(columnNames[kind]);
  records.forEach((item, rowIndex) => {
    ensureRows(rowIndex + 1);
    store.rows[rowIndex][col] = item.name;
    if (kind === 'music') writeMusicVolume(rowIndex, true);
  });
};

const appendRowsForAllMedia = () => {
  const videos = naturalSortRecords(batchVideos.value);
  const audios = naturalSortRecords(batchAudios.value);
  const music = naturalSortRecords(batchMusic.value);
  const target = Math.max(videos.length, audios.length, music.length);
  store.setRowCount(target);
  writePoolColumnByIndex('video', videos);
  writePoolColumnByIndex('audio', audios);
  writePoolColumnByIndex('music', music);
  refreshTemplateBindings();
  bulkHint.value = `已同步到 ${store.rows.length} 行，并按正序写入视频/配音/配乐列。`;
};

const normalizeName = (value) => String(value || '').trim().toLowerCase();
const normalizeMatchName = (value) => normalizeName(value)
  .replace(/\\\\/g, '/')
  .split('/')
  .pop()
  .replace(/\.[a-z0-9]{2,5}$/i, '')
  .replace(/[\s_-]+/g, '');

const bindingIndex = (template, key) => {
  const auto = store.createAutoBindings();
  const explicit = template.bindings?.[key];
  if (Number.isInteger(explicit) && explicit >= 0 && explicit < store.columns.length) return explicit;
  return Number.isInteger(auto[key]) ? auto[key] : -1;
};

const cellValue = (row, index) => (index >= 0 && index < row.length ? String(row[index] || '').trim() : '');

const pickBatchAsset = (pool, row, template, key, rowIndex) => {
  const boundIndex = bindingIndex(template, key);
  const wanted = boundIndex >= 0 ? normalizeName(row[boundIndex]) : '';
  if (wanted) {
    const wantedMatch = normalizeMatchName(wanted);
    const exact = pool.find((item) => normalizeName(item.name) === wanted || normalizeMatchName(item.name) === wantedMatch || normalizeMatchName(item.path) === wantedMatch);
    if (exact) return exact;
    const partial = pool.find((item) => {
      const itemMatch = normalizeMatchName(item.name || item.path);
      return itemMatch && wantedMatch && (itemMatch.includes(wantedMatch) || wantedMatch.includes(itemMatch));
    });
    if (partial) return partial;
    return null;
  }
  return pool.length ? pool[rowIndex % pool.length] : null;
};

const numericPercent = (value, fallback) => {
  const number = Number(String(value ?? '').replace('%', '').trim());
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, number));
};

const generate = () => {
  if (typeof store.ensureStandardColumns === 'function') store.ensureStandardColumns();
  store.templates.forEach((template) => { template.bindings = store.createAutoBindings(); });
  const titleIndex = store.columnIndex ? store.columnIndex('滚动标题') : -1;
  const validRows = store.rows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
  if (validRows.length === 0) {
    window.alert('表格中没有有效数据！可以先粘贴文案，或拖入素材后写入对应列。');
    return;
  }
  if (store.templates.length === 0) {
    window.alert('请在右侧添加至少一个映射模板！');
    return;
  }

  const tasks = [];
  const missing = { video: 0, audio: 0, music: 0 };
  validRows.forEach((row, rowIndex) => {
    store.templates.forEach((template) => {
      const overlay = JSON.parse(JSON.stringify(props.templateOverlay));
      overlay.id = `ov_scroll_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      ['scroll_title', 'content', 'signature_text'].forEach((key) => {
        const colIndex = bindingIndex(template, key);
        const value = cellValue(row, colIndex);
        if (value) overlay[key] = value;
      });

      const video = pickBatchAsset(batchVideos.value, row, template, 'video', rowIndex);
      const audio = pickBatchAsset(batchAudios.value, row, template, 'audio', rowIndex);
      const music = pickBatchAsset(batchMusic.value, row, template, 'music', rowIndex);
      const nameIndex = bindingIndex(template, 'baseName');
      const videoIndex = bindingIndex(template, 'video');
      const audioIndex = bindingIndex(template, 'audio');
      const musicIndex = bindingIndex(template, 'music');
      const volumeIndex = bindingIndex(template, 'musicVolume');
      const rowName = cellValue(row, nameIndex) || cellValue(row, titleIndex) || `批量生成_Row${rowIndex + 1}_${template.label}`;
      const rowVideoName = cellValue(row, videoIndex);
      const rowAudioName = cellValue(row, audioIndex);
      const rowMusicName = cellValue(row, musicIndex);
      const rowMusicVolume = volumeIndex >= 0 ? numericPercent(row[volumeIndex], musicVolume.value) : musicVolume.value;
      if (rowVideoName && !video) missing.video += 1;
      if (rowAudioName && !audio) missing.audio += 1;
      if (rowMusicName && !music) missing.music += 1;

      tasks.push({
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        baseName: rowName,
        overlays: [overlay],
        videoUrl: video?.url || '',
        audioUrl: audio?.url || '',
        musicUrl: music?.url || '',
        videoName: video?.name || rowVideoName,
        audioName: audio?.name || rowAudioName,
        musicName: music?.name || rowMusicName,
        videoFile: video?.file || null,
        audioFile: audio?.file || null,
        musicFile: music?.file || null,
        musicVolume: rowMusicVolume,
        videoDuration: 0,
        audioDuration: 0,
        musicDuration: 0,
        exportStatus: '等待导出',
        exportProgress: 0,
      });
    });
  });

  const missText = [missing.video ? `视频未匹配 ${missing.video}` : '', missing.audio ? `音频未匹配 ${missing.audio}` : '', missing.music ? `配乐未匹配 ${missing.music}` : ''].filter(Boolean).join('，');
  bulkHint.value = `已按当前批量表格工程生成 ${tasks.length} 条任务；${missText ? missText + '，请检查文件名或重新拖入素材。' : '素材匹配正常。'}外部任务队列会同步为这张表。`;
  emit('generate', tasks);
};

onMounted(() => {
  batchVideos.value = naturalSortRecords(WebAssetPool.list('video'));
  batchAudios.value = naturalSortRecords(WebAssetPool.list('audio'));
  batchMusic.value = [];
  if (batchVideos.value.length || batchAudios.value.length) {
    bulkHint.value = `已从当前浏览器素材池恢复：视频 ${batchVideos.value.length} 个，音频 ${batchAudios.value.length} 个。表格中同名文件会优先精确匹配。`;
  }
});
</script>
