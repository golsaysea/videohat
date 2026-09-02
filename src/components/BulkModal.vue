<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a14]/90 p-8 backdrop-blur">
    <div class="flex h-full max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-[#333] bg-[#0a0a14] shadow-2xl">
      <div class="flex items-center justify-between border-b border-[#333] bg-[#1a1a2e] px-6 py-4">
        <div class="flex items-center gap-3">
          <h2 class="m-0 text-lg font-bold text-purple-400">批量表格</h2>
          <span class="hidden text-xs text-gray-500 md:block">吸取主界面的特效参数，批量替换视频、音频、标题、正文和署名</span>
        </div>
        <div class="flex items-center gap-3 text-xs text-gray-400">
          <label class="rounded border border-[#444] bg-white/5 px-3 py-2 text-gray-200 hover:bg-white/10">
            批量视频
            <input class="hidden" type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.quicktime" multiple @change="event => addBatchFiles(event, 'video')" />
          </label>
          <label class="rounded border border-[#444] bg-white/5 px-3 py-2 text-gray-200 hover:bg-white/10">
            批量音频
            <input class="hidden" type="file" accept="audio/*" multiple @change="event => addBatchFiles(event, 'audio')" />
          </label>
          <span v-if="batchVideos.length || batchAudios.length">视频 {{ batchVideos.length }} / 音频 {{ batchAudios.length }}</span>
        </div>
        <div class="flex gap-4">
          <button class="rounded bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-105" @click="generate">
            提取表格数据，生成队列
          </button>
          <button class="rounded border border-[#444] bg-[#333] px-4 py-2 text-sm text-white transition hover:bg-[#444]" @click="emit('close')">
            关闭
          </button>
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <div class="min-w-[60%] flex-[5] border-r border-[#2a2a3a]">
          <BulkTable />
        </div>
        <div class="min-w-[320px] flex-[2] bg-[#121222]">
          <TemplateBindings />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BulkTable from './BulkTable.vue';
import TemplateBindings from './TemplateBindings.vue';
import { ref } from 'vue';
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

const addBatchFiles = (event, kind) => {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (!files.length) return;
  const records = files.map((file) => {
    const [path] = WebAssetPool.registerFiles([file]);
    return {
      file,
      url: WebAssetPool.getUrl(path),
      name: file.name,
      path,
    };
  });
  if (kind === 'video') batchVideos.value = records;
  else batchAudios.value = records;
};

const normalizeName = (value) => String(value || '').trim().toLowerCase();

const pickBatchAsset = (pool, row, template, key, rowIndex) => {
  const boundIndex = template.bindings[key];
  const wanted = boundIndex >= 0 ? normalizeName(row[boundIndex]) : '';
  if (wanted) {
    const exact = pool.find((item) => normalizeName(item.name) === wanted);
    if (exact) return exact;
    const partial = pool.find((item) => normalizeName(item.name).includes(wanted) || wanted.includes(normalizeName(item.name)));
    if (partial) return partial;
  }
  return pool.length ? pool[rowIndex % pool.length] : null;
};

const generate = () => {
  const validRows = store.rows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
  if (validRows.length === 0) {
    window.alert('表格中没有有效数据！');
    return;
  }
  if (store.templates.length === 0) {
    window.alert('请在右侧添加至少一个映射模板！');
    return;
  }

  const tasks = [];
  validRows.forEach((row, rowIndex) => {
    store.templates.forEach((template) => {
      const overlay = JSON.parse(JSON.stringify(props.templateOverlay));
      overlay.id = `ov_scroll_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      for (const [key, colIndex] of Object.entries(template.bindings)) {
        if (['video', 'audio', 'baseName'].includes(key)) continue;
        if (colIndex >= 0 && colIndex < store.columns.length && row[colIndex]) {
          overlay[key] = row[colIndex];
        }
      }

      const video = pickBatchAsset(batchVideos.value, row, template, 'video', rowIndex);
      const audio = pickBatchAsset(batchAudios.value, row, template, 'audio', rowIndex);
      const nameIndex = template.bindings.baseName;
      const rowName = nameIndex >= 0 && row[nameIndex] ? row[nameIndex] : `批量生成_Row${rowIndex + 1}_${template.label}`;

      tasks.push({
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        baseName: rowName,
        overlays: [overlay],
        videoUrl: video?.url || '',
        audioUrl: audio?.url || '',
        videoName: video?.name || '',
        audioName: audio?.name || '',
        videoFile: video?.file || null,
        audioFile: audio?.file || null,
        videoDuration: 0,
        audioDuration: 0,
        exportStatus: '等待导出',
        exportProgress: 0,
      });
    });
  });

  emit('generate', tasks);
};
</script>
