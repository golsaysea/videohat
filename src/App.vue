<template>
  <div class="flex h-screen flex-col overflow-hidden bg-[#0b0d14] font-sans text-gray-200">
    <header class="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#2a2f3a] bg-[#151827] px-5 shadow-md">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-cyan-400 font-bold text-white shadow-lg">V</div>
        <h1 class="m-0 text-lg font-bold tracking-wide text-white">VideoKit Reels Web</h1>
      </div>
      <div class="flex items-center gap-3">
        <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-1.5 text-sm transition hover:bg-[#2b3146]" @click="showBulkModal = true">批量表格</button>
        <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-1.5 text-sm transition hover:bg-[#2b3146]" @click="downloadProject">保存工程 JSON</button>
        <button class="rounded bg-blue-600 px-5 py-1.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500" :disabled="isExporting" @click="exportCurrentTask">
          {{ isExporting ? '导出中...' : '导出当前 MP4' }}
        </button>
      </div>
    </header>

    <main v-if="store.isLoaded" class="grid min-h-0 flex-1 grid-cols-[320px_minmax(520px,1fr)_390px] overflow-hidden">
      <aside class="flex min-h-0 flex-col border-r border-[#2a2f3a] bg-[#111522]">
        <div class="border-b border-[#2a2f3a] p-4">
          <h2 class="m-0 text-sm font-bold text-cyan-300">任务与素材</h2>
        </div>

        <div class="space-y-3 border-b border-[#2a2f3a] p-4">
          <label class="block rounded border border-dashed border-[#3a4152] bg-[#171b2b] p-3 text-sm text-gray-300 transition hover:border-blue-500 hover:text-white">
            <span class="block font-semibold">上传背景视频</span>
            <span class="mt-1 block text-xs text-gray-500">长视频自动裁剪，短视频自动循环</span>
            <input class="hidden" type="file" accept="video/*" @change="event => loadMedia(event, 'video')" />
          </label>
          <label class="block rounded border border-dashed border-[#3a4152] bg-[#171b2b] p-3 text-sm text-gray-300 transition hover:border-blue-500 hover:text-white">
            <span class="block font-semibold">上传音频</span>
            <span class="mt-1 block text-xs text-gray-500">有音频时默认按音频时长导出</span>
            <input class="hidden" type="file" accept="audio/*" @change="event => loadMedia(event, 'audio')" />
          </label>
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div class="rounded border border-[#2a2f3a] bg-black/20 p-2">视频：{{ formatDuration(media.videoDuration) }}</div>
            <div class="rounded border border-[#2a2f3a] bg-black/20 p-2">音频：{{ formatDuration(media.audioDuration) }}</div>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-xs font-bold text-gray-500">任务队列</span>
            <button class="text-xs text-blue-400 hover:text-blue-300" @click="addTaskFromCurrent">保存为任务</button>
          </div>
          <div class="space-y-2">
            <button
              v-for="(task, index) in tasks"
              :key="task.id"
              class="w-full rounded border p-3 text-left transition"
              :class="index === selectedTaskIndex ? 'border-blue-500 bg-blue-500/10' : 'border-[#2a2f3a] bg-[#171b2b] hover:border-[#465066]'"
              @click="selectTask(index)"
            >
              <span class="block truncate text-sm font-semibold text-white">{{ task.baseName }}</span>
              <span class="mt-1 block truncate text-xs text-gray-500">{{ task.videoName || '无视频' }} / {{ task.audioName || '无音频' }}</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 border-t border-[#2a2f3a] p-3">
          <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-2 text-xs hover:bg-[#2b3146]" :disabled="isExporting" @click="exportQueue">批量导出</button>
          <button class="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20" @click="clearQueue">清空队列</button>
        </div>
      </aside>

      <section class="relative flex min-h-0 flex-col items-center justify-center overflow-hidden bg-[#03050a] p-6">
        <div class="absolute left-5 top-4 text-xs text-gray-500">Canvas 预览 1080 x 1920</div>
        <div class="relative flex h-full max-h-[calc(100vh-160px)] w-auto aspect-[9/16] items-center justify-center overflow-hidden rounded border border-[#252b37] bg-black shadow-[0_0_40px_rgba(0,0,0,0.65)]">
          <canvas ref="previewCanvas" width="1080" height="1920" class="h-full w-full object-contain"></canvas>
        </div>

        <div class="absolute bottom-5 flex w-[min(720px,70vw)] items-center gap-4 rounded-full border border-[#33394a] bg-[#171b2b]/95 px-5 py-3 shadow-lg backdrop-blur">
          <button class="flex h-10 w-14 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500" @click="togglePlay">
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
          <input v-model.number="previewTime" type="range" min="0" :max="activeDuration" step="0.01" class="min-w-0 flex-1 cursor-pointer accent-blue-500" @input="seekPreview" />
          <span class="w-24 text-right font-mono text-xs text-gray-400">{{ formatDuration(previewTime) }} / {{ formatDuration(activeDuration) }}</span>
        </div>

        <video ref="videoEl" class="hidden" crossorigin="anonymous" playsinline muted></video>
        <audio ref="audioEl" class="hidden" crossorigin="anonymous"></audio>
        <video v-if="exportedUrl" class="absolute bottom-24 right-5 h-56 rounded border-2 border-blue-500 bg-black shadow-xl" :src="exportedUrl" controls autoplay playsinline></video>
      </section>

      <aside class="flex min-h-0 flex-col overflow-y-auto border-l border-[#2a2f3a] bg-[#121625]">
        <div class="sticky top-0 z-10 border-b border-[#2a2f3a] bg-[#121625] p-4 font-bold text-cyan-300">Reels 参数</div>
        <div class="flex flex-col gap-5 p-4">
          <Panel title="输出与时长">
            <SelectField v-model="exportOptions.durationMode" label="时长来源" :options="durationModeOptions" />
            <NumberField v-if="exportOptions.durationMode === 'custom'" v-model="exportOptions.customDuration" label="自定义秒数" :min="1" />
            <SelectField v-model="exportOptions.fitMode" label="视频匹配" :options="fitModeOptions" />
            <SelectField v-model="exportOptions.quality" label="导出画质" :options="qualityOptions" />
            <NumberField v-model="exportOptions.fps" label="帧率" :min="15" :max="60" />
          </Panel>

          <Panel title="字幕内容">
            <TextField v-model="overlayState.scroll_title" label="滚动标题" />
            <TextAreaField v-model="overlayState.content" label="滚动正文" :rows="7" />
          </Panel>

          <Panel title="正文样式">
            <SliderControl v-model="overlayState.fontsize" label="正文字号" :min="20" :max="120" />
            <SliderControl v-model="overlayState.text_width" label="折行宽度" :min="360" :max="1000" :step="10" />
            <SliderControl v-model="overlayState.line_spacing" label="行距" :min="0" :max="60" />
            <SliderControl v-model="overlayState.scroll_speed" label="滚动速度" :min="0.2" :max="2" :step="0.1" suffix="x" />
            <ColorField v-model="overlayState.color" label="正文颜色" />
            <CheckField v-model="overlayState.use_stroke" label="文字黑边" />
            <CheckField v-model="overlayState.shadow_enabled" label="正文阴影" />
          </Panel>

          <Panel title="标题样式">
            <SliderControl v-model="overlayState.scroll_title_fontsize" label="标题字号" :min="24" :max="120" />
            <SliderControl v-model="overlayState.scroll_title_gap" label="标题间距" :min="0" :max="120" />
            <ColorField v-model="overlayState.scroll_title_color" label="标题颜色" />
            <CheckField v-model="overlayState.scroll_title_fixed" label="固定标题" />
            <CheckField v-model="overlayState.scroll_title_shadow_enabled" label="标题阴影" />
          </Panel>

          <Panel title="裁切窗口">
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.x" label="X" />
              <NumberField v-model="overlayState.y" label="Y" />
              <NumberField v-model="overlayState.w" label="W" />
              <NumberField v-model="overlayState.h" label="H" />
            </div>
            <SliderControl v-model="overlayState.feather_top" label="顶部羽化" :min="0" :max="400" />
            <SliderControl v-model="overlayState.feather_bottom" label="底部羽化" :min="0" :max="400" />
          </Panel>

          <Panel title="背景框">
            <CheckField v-model="overlayState.bg_enabled" label="开启背景框" />
            <ColorField v-model="overlayState.bg_color" label="背景颜色" />
            <SliderControl v-model="overlayState.bg_opacity" label="透明度" :min="0" :max="255" />
            <SliderControl v-model="overlayState.bg_radius" label="圆角" :min="0" :max="60" />
          </Panel>
        </div>
      </aside>
    </main>

    <div v-else class="flex flex-1 animate-pulse items-center justify-center text-gray-500">读取本地工程缓存中...</div>

    <BulkModal v-if="showBulkModal" :template-overlay="overlayState" @close="showBulkModal = false" @generate="handleGeneratedTasks" />
  </div>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import BulkModal from './components/BulkModal.vue';
import { useBulkStore } from './stores/bulkStore';
import { createScrollOverlay, drawScrollOverlay } from './utils/scrollOverlayRenderer';
import { ReelsOverlay } from './utils/reels-overlay.js';
import { WebAssetPool } from './utils/WebAssetPool.js';

const controlInputClass = 'w-full rounded border border-[#33394a] bg-[#070a12] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500';

const Panel = defineComponent({
  props: { title: { type: String, required: true } },
  setup(props, { slots }) {
    return () => h('section', { class: 'flex flex-col gap-4 rounded border border-[#303648] bg-white/[0.04] p-4' }, [
      h('h3', { class: 'm-0 border-b border-[#303648] pb-2 text-xs font-bold text-gray-500' }, props.title),
      slots.default?.(),
    ]);
  },
});

const SliderControl = defineComponent({
  props: { modelValue: Number, label: String, min: Number, max: Number, step: { type: Number, default: 1 }, suffix: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex items-center justify-between gap-3' }, [
      h('span', { class: 'text-xs text-gray-400' }, props.label),
      h('div', { class: 'flex items-center gap-2' }, [
        h('input', { type: 'range', min: props.min, max: props.max, step: props.step, value: props.modelValue, class: 'w-28 accent-blue-500', onInput: (event) => emit('update:modelValue', Number(event.target.value)) }),
        h('span', { class: 'w-12 text-right font-mono text-xs text-blue-400' }, `${props.modelValue}${props.suffix}`),
      ]),
    ]);
  },
});

const NumberField = defineComponent({
  props: { modelValue: Number, label: String, min: Number, max: Number },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('label', { class: 'space-y-1' }, [
      h('span', { class: 'block text-xs text-gray-500' }, props.label),
      h('input', { type: 'number', min: props.min, max: props.max, value: props.modelValue, class: controlInputClass, onInput: (event) => emit('update:modelValue', Number(event.target.value)) }),
    ]);
  },
});

const TextField = defineComponent({
  props: { modelValue: String, label: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('label', { class: 'space-y-1' }, [
      h('span', { class: 'block text-xs text-gray-500' }, props.label),
      h('input', { value: props.modelValue, class: controlInputClass, onInput: (event) => emit('update:modelValue', event.target.value) }),
    ]);
  },
});

const TextAreaField = defineComponent({
  props: { modelValue: String, label: String, rows: { type: Number, default: 4 } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('label', { class: 'space-y-1' }, [
      h('span', { class: 'block text-xs text-gray-500' }, props.label),
      h('textarea', { rows: props.rows, value: props.modelValue, class: `${controlInputClass} resize-none leading-relaxed`, onInput: (event) => emit('update:modelValue', event.target.value) }),
    ]);
  },
});

const ColorField = defineComponent({
  props: { modelValue: String, label: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex items-center justify-between' }, [
      h('span', { class: 'text-xs text-gray-400' }, props.label),
      h('input', { type: 'color', value: props.modelValue, class: 'h-8 w-10 cursor-pointer rounded bg-transparent', onInput: (event) => emit('update:modelValue', event.target.value) }),
    ]);
  },
});

const CheckField = defineComponent({
  props: { modelValue: Boolean, label: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('label', { class: 'flex cursor-pointer items-center gap-2 text-xs text-gray-400' }, [
      h('input', { type: 'checkbox', checked: props.modelValue, class: 'h-4 w-4 accent-blue-500', onChange: (event) => emit('update:modelValue', event.target.checked) }),
      props.label,
    ]);
  },
});

const SelectField = defineComponent({
  props: { modelValue: String, label: String, options: Array },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('label', { class: 'space-y-1' }, [
      h('span', { class: 'block text-xs text-gray-500' }, props.label),
      h('select', { value: props.modelValue, class: controlInputClass, onChange: (event) => emit('update:modelValue', event.target.value) }, props.options.map((option) => h('option', { value: option.value }, option.label))),
    ]);
  },
});

const store = useBulkStore();
const previewCanvas = ref(null);
const videoEl = ref(null);
const audioEl = ref(null);
const showBulkModal = ref(false);
const isPlaying = ref(false);
const isExporting = ref(false);
const previewTime = ref(0);
const exportedUrl = ref('');
const selectedTaskIndex = ref(0);
const overlayState = reactive(createScrollOverlay({
  scroll_title: 'IN SEPTEMBER, SAY THIS PRAYER!',
  content: '1. God walks with me.\n2. God guides my steps.\n3. God has a beautiful plan for me.\n4. I am protected from all evil.\n5. Every challenge is a stepping stone.',
  fontsize: 70,
  text_width: 900,
  line_spacing: 8,
  feather_top: 150,
  feather_bottom: 100,
  bg_opacity: 160,
  bg_radius: 16,
  bg_padding_top: 50,
  bg_padding_bottom: 50,
  bg_padding_left: 20,
  bg_padding_right: 20,
  scroll_from_y: 1800,
  scroll_to_y: -200,
  scroll_auto_stop: true,
  scroll_auto_stop_lead: 0.5,
}));

const media = reactive({
  videoFile: null,
  audioFile: null,
  videoUrl: '',
  audioUrl: '',
  videoName: '',
  audioName: '',
  videoDuration: 0,
  audioDuration: 0,
});

const exportOptions = reactive({
  durationMode: 'auto',
  customDuration: 15,
  fitMode: 'cover',
  quality: 'high',
  fps: 30,
});

const tasks = ref([{ id: 'task_default', baseName: '当前 Reels 任务', overlays: [overlayState], videoName: '', audioName: '' }]);

const durationModeOptions = [
  { value: 'auto', label: '自动：音频优先，否则视频' },
  { value: 'audio', label: '按音频时长' },
  { value: 'video', label: '按视频时长' },
  { value: 'custom', label: '自定义时长' },
];
const fitModeOptions = [
  { value: 'cover', label: '铺满裁剪' },
  { value: 'contain', label: '完整留边' },
  { value: 'stretch', label: '拉伸填满' },
];
const qualityOptions = [
  { value: 'high', label: '高画质 8 Mbps' },
  { value: 'medium', label: '中画质 5 Mbps' },
  { value: 'low', label: '快速 2.5 Mbps' },
];

const activeDuration = computed(() => {
  if (exportOptions.durationMode === 'custom') return Math.max(1, exportOptions.customDuration || 1);
  if (exportOptions.durationMode === 'audio') return media.audioDuration || media.videoDuration || 15;
  if (exportOptions.durationMode === 'video') return media.videoDuration || media.audioDuration || 15;
  return media.audioDuration || media.videoDuration || 15;
});

let animationFrameId = 0;
let audioContext = null;
let videoSourceNode = null;
let audioSourceNode = null;
let mediaDestination = null;
let mediaRecorder = null;
let exportStopTimer = 0;
let wasExporting = false;

const formatDuration = (value) => {
  const seconds = Number(value) || 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const syncSelectedTask = () => {
  const current = tasks.value[selectedTaskIndex.value];
  if (!current) return;
  current.overlays = [JSON.parse(JSON.stringify(overlayState))];
  current.videoName = media.videoName;
  current.audioName = media.audioName;
  current.videoUrl = media.videoUrl;
  current.audioUrl = media.audioUrl;
  current.videoDuration = media.videoDuration;
  current.audioDuration = media.audioDuration;
};

const applyTaskToEditor = async (task) => {
  if (!task) return;
  Object.assign(overlayState, createScrollOverlay(task.overlays?.[0] || {}));
  media.videoUrl = task.videoUrl || media.videoUrl;
  media.audioUrl = task.audioUrl || media.audioUrl;
  media.videoName = task.videoName || media.videoName;
  media.audioName = task.audioName || media.audioName;
  media.videoDuration = task.videoDuration || media.videoDuration;
  media.audioDuration = task.audioDuration || media.audioDuration;
  await nextTick();
  if (videoEl.value && media.videoUrl) videoEl.value.src = media.videoUrl;
  if (audioEl.value && media.audioUrl) audioEl.value.src = media.audioUrl;
  previewTime.value = 0;
  drawPreview();
};

const selectTask = (index) => {
  syncSelectedTask();
  selectedTaskIndex.value = index;
  applyTaskToEditor(tasks.value[index]);
};

const addTaskFromCurrent = () => {
  syncSelectedTask();
  tasks.value.push({
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    baseName: `Reels 任务 ${tasks.value.length + 1}`,
    overlays: [JSON.parse(JSON.stringify(overlayState))],
    videoUrl: media.videoUrl,
    audioUrl: media.audioUrl,
    videoName: media.videoName,
    audioName: media.audioName,
    videoDuration: media.videoDuration,
    audioDuration: media.audioDuration,
  });
  selectedTaskIndex.value = tasks.value.length - 1;
};

const clearQueue = () => {
  if (!window.confirm('清空全部任务队列？')) return;
  tasks.value = [{ id: 'task_default', baseName: '当前 Reels 任务', overlays: [JSON.parse(JSON.stringify(overlayState))], videoName: media.videoName, audioName: media.audioName, videoUrl: media.videoUrl, audioUrl: media.audioUrl }];
  selectedTaskIndex.value = 0;
};

const loadMedia = async (event, kind) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  const [path] = WebAssetPool.registerFiles([file]);
  const url = WebAssetPool.getUrl(path);

  if (kind === 'video') {
    media.videoFile = file;
    media.videoUrl = url;
    media.videoName = file.name;
    videoEl.value.src = url;
    videoEl.value.loop = true;
    videoEl.value.muted = true;
    await waitForMetadata(videoEl.value);
    media.videoDuration = videoEl.value.duration || 0;
  } else {
    media.audioFile = file;
    media.audioUrl = url;
    media.audioName = file.name;
    audioEl.value.src = url;
    await waitForMetadata(audioEl.value);
    media.audioDuration = audioEl.value.duration || 0;
  }

  previewTime.value = 0;
  syncSelectedTask();
  drawPreview();
};

const waitForMetadata = (element) => new Promise((resolve) => {
  if (element.readyState >= 1 && Number.isFinite(element.duration)) {
    resolve();
    return;
  }
  element.onloadedmetadata = () => resolve();
  element.onerror = () => resolve();
});

const drawVideoBackground = (ctx, canvas, video) => {
  if (!video || !media.videoUrl || !video.videoWidth || !video.videoHeight) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(0.5, '#0f172a');
    gradient.addColorStop(1, '#030712');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }

  if (exportOptions.fitMode === 'stretch') {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return;
  }

  const scale = exportOptions.fitMode === 'contain'
    ? Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
    : Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
  const width = video.videoWidth * scale;
  const height = video.videoHeight * scale;
  ctx.drawImage(video, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
};

const normalizeOverlayForNative = () => ({
  ...JSON.parse(JSON.stringify(overlayState)),
  text_align: overlayState.align || overlayState.text_align || 'center',
  bg_opacity: overlayState.bg_opacity <= 1 ? Math.round(overlayState.bg_opacity * 255) : overlayState.bg_opacity,
  bg_padding_top: overlayState.bg_padding_top ?? overlayState.bg_pt ?? 46,
  bg_padding_bottom: overlayState.bg_padding_bottom ?? overlayState.bg_pb ?? 46,
  bg_padding_left: overlayState.bg_padding_left ?? overlayState.bg_px ?? 22,
  bg_padding_right: overlayState.bg_padding_right ?? overlayState.bg_px ?? 22,
  scroll_title_shadow_enabled: overlayState.scroll_title_shadow_enabled ?? true,
  end: activeDuration.value,
});

const drawPreview = () => {
  const canvas = previewCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawVideoBackground(ctx, canvas, videoEl.value);

  try {
    ReelsOverlay.drawOverlay(ctx, normalizeOverlayForNative(), previewTime.value, canvas.width, canvas.height);
  } catch (error) {
    console.warn('[ReelsOverlay] fallback renderer:', error);
    drawScrollOverlay(ctx, overlayState, previewTime.value, canvas.width, canvas.height);
  }
};

const renderLoop = () => {
  if (isPlaying.value && !wasExporting) {
    previewTime.value = media.audioUrl && audioEl.value ? audioEl.value.currentTime : (videoEl.value?.currentTime || previewTime.value);
    if (previewTime.value >= activeDuration.value) stopPlayback();
  }
  drawPreview();
  animationFrameId = requestAnimationFrame(renderLoop);
};

const seekPreview = () => {
  const t = Math.min(previewTime.value, activeDuration.value);
  if (videoEl.value && media.videoUrl && media.videoDuration) videoEl.value.currentTime = t % media.videoDuration;
  if (audioEl.value && media.audioUrl && t <= media.audioDuration) audioEl.value.currentTime = t;
  drawPreview();
};

const startPlayback = async () => {
  if (activeDuration.value <= 0) return;
  isPlaying.value = true;
  if (videoEl.value && media.videoUrl) {
    videoEl.value.loop = true;
    videoEl.value.muted = true;
    videoEl.value.currentTime = media.videoDuration ? previewTime.value % media.videoDuration : 0;
    await videoEl.value.play().catch(() => {});
  }
  if (audioEl.value && media.audioUrl) {
    audioEl.value.currentTime = Math.min(previewTime.value, media.audioDuration || previewTime.value);
    await audioEl.value.play().catch(() => {});
  }
};

const stopPlayback = () => {
  isPlaying.value = false;
  videoEl.value?.pause();
  audioEl.value?.pause();
};

const togglePlay = () => {
  if (isPlaying.value) stopPlayback();
  else startPlayback();
};

const ensureAudioGraph = async (useSeparateAudio) => {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') await audioContext.resume();
  mediaDestination ||= audioContext.createMediaStreamDestination();

  if (audioEl.value && !audioSourceNode) audioSourceNode = audioContext.createMediaElementSource(audioEl.value);
  if (videoEl.value && !videoSourceNode) videoSourceNode = audioContext.createMediaElementSource(videoEl.value);

  try { audioSourceNode?.disconnect(); } catch (_) {}
  try { videoSourceNode?.disconnect(); } catch (_) {}

  const activeSource = useSeparateAudio ? audioSourceNode : videoSourceNode;
  if (activeSource) {
    activeSource.connect(mediaDestination);
    activeSource.connect(audioContext.destination);
  }
};

const supportedMime = () => {
  const candidates = ['video/mp4;codecs=h264,aac', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return candidates.find((mime) => MediaRecorder.isTypeSupported(mime)) || '';
};

const bitrateForQuality = () => ({ high: 8000000, medium: 5000000, low: 2500000 }[exportOptions.quality] || 5000000);

const exportCurrentTask = async () => {
  if (isExporting.value) return;
  const canvas = previewCanvas.value;
  if (!canvas) return;
  if (!media.videoUrl && !overlayState.content.trim()) {
    window.alert('请先上传视频或填写字幕内容');
    return;
  }

  syncSelectedTask();
  stopPlayback();
  exportedUrl.value = '';
  isExporting.value = true;
  wasExporting = true;

  const duration = activeDuration.value;
  const useSeparateAudio = Boolean(media.audioUrl);
  const useVideoAudio = !useSeparateAudio && Boolean(media.videoUrl);
  if (useSeparateAudio || useVideoAudio) await ensureAudioGraph(useSeparateAudio);

  previewTime.value = 0;
  if (videoEl.value && media.videoUrl) {
    videoEl.value.loop = true;
    videoEl.value.muted = useSeparateAudio;
    videoEl.value.currentTime = 0;
    await videoEl.value.play().catch(() => {});
  }
  if (audioEl.value && useSeparateAudio) {
    audioEl.value.currentTime = 0;
    await audioEl.value.play().catch(() => {});
  }

  const stream = canvas.captureStream(exportOptions.fps || 30);
  if (mediaDestination?.stream.getAudioTracks().length) {
    stream.addTrack(mediaDestination.stream.getAudioTracks()[0]);
  }
  const mimeType = supportedMime();
  const chunks = [];

  mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrateForQuality() });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  mediaRecorder.onstop = () => {
    stream.getTracks().forEach((track) => track.stop());
    const type = mimeType || 'video/webm';
    const blob = new Blob(chunks, { type });
    const url = URL.createObjectURL(blob);
    exportedUrl.value = url;
    const ext = type.includes('mp4') ? 'mp4' : 'webm';
    triggerDownload(url, `${tasks.value[selectedTaskIndex.value]?.baseName || 'reels'}_${Date.now()}.${ext}`);
    isExporting.value = false;
    wasExporting = false;
    stopPlayback();
    previewTime.value = 0;
    drawPreview();
  };

  mediaRecorder.start(250);
  const startedAt = performance.now();
  const tick = () => {
    if (!isExporting.value) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    previewTime.value = Math.min(elapsed, duration);
    if (videoEl.value && media.videoUrl && media.videoDuration && videoEl.value.ended) {
      videoEl.value.currentTime = elapsed % media.videoDuration;
      videoEl.value.play().catch(() => {});
    }
    drawPreview();
    if (elapsed >= duration) {
      if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
      return;
    }
    exportStopTimer = requestAnimationFrame(tick);
  };
  exportStopTimer = requestAnimationFrame(tick);
};

const exportQueue = async () => {
  if (isExporting.value) return;
  for (let i = 0; i < tasks.value.length; i += 1) {
    selectedTaskIndex.value = i;
    await applyTaskToEditor(tasks.value[i]);
    await exportCurrentTask();
    await waitUntilExportDone();
  }
};

const waitUntilExportDone = () => new Promise((resolve) => {
  const check = () => {
    if (!isExporting.value) resolve();
    else setTimeout(check, 300);
  };
  check();
});

const triggerDownload = (url, name) => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
};

const downloadJson = (name, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, name);
  URL.revokeObjectURL(url);
};

const downloadProject = () => {
  syncSelectedTask();
  downloadJson(`videokit_reels_project_${Date.now()}.json`, {
    version: '2.0.0-web',
    app: 'VideoKit Reels Web',
    exportOptions: JSON.parse(JSON.stringify(exportOptions)),
    tasks: tasks.value.map((task) => ({
      ...task,
      videoUrl: undefined,
      audioUrl: undefined,
    })),
  });
};

const handleGeneratedTasks = (generatedTasks) => {
  syncSelectedTask();
  const inherited = {
    videoUrl: media.videoUrl,
    audioUrl: media.audioUrl,
    videoName: media.videoName,
    audioName: media.audioName,
    videoDuration: media.videoDuration,
    audioDuration: media.audioDuration,
  };
  tasks.value.push(...generatedTasks.map((task) => ({ ...task, ...inherited })));
  selectedTaskIndex.value = tasks.value.length - generatedTasks.length;
  applyTaskToEditor(tasks.value[selectedTaskIndex.value]);
  showBulkModal.value = false;
};

watch(overlayState, () => {
  syncSelectedTask();
  drawPreview();
}, { deep: true });
watch(activeDuration, () => {
  if (previewTime.value > activeDuration.value) previewTime.value = 0;
});

onMounted(() => {
  store.loadDraft();
  animationFrameId = requestAnimationFrame(renderLoop);
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (exportStopTimer) cancelAnimationFrame(exportStopTimer);
  stopPlayback();
});
</script>
