<template>
  <div class="flex h-screen flex-col overflow-hidden bg-[#0b0d14] font-sans text-gray-200">
    <header class="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#2a2f3a] bg-[#151827] px-5 shadow-md">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-cyan-400 font-bold text-white shadow-lg">V</div>
        <h1 class="m-0 text-lg font-bold tracking-wide text-white">VideoKit Reels Web</h1>
      </div>
      <div class="flex items-center gap-3">
        <div v-if="isExporting" class="w-48 rounded border border-[#2f374c] bg-black/30 px-3 py-1.5">
          <div class="mb-1 flex items-center justify-between text-[11px] text-gray-400">
            <span>{{ exportStatus }}</span>
            <span>{{ Math.round(exportProgress * 100) }}%</span>
          </div>
          <div class="h-1.5 overflow-hidden rounded-full bg-[#30384d]">
            <div class="h-full rounded-full bg-blue-500 transition-all" :style="{ width: `${Math.round(exportProgress * 100)}%` }"></div>
          </div>
        </div>
        <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-1.5 text-sm transition hover:bg-[#2b3146]" @click="showBulkModal = true">批量表格</button>
        <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-1.5 text-sm transition hover:bg-[#2b3146]" @click="downloadProject">保存工程 JSON</button>
        <button class="rounded bg-blue-600 px-5 py-1.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500" :disabled="isExporting" @click="exportCurrentTask">
          {{ isExporting ? '导出中...' : '导出当前视频' }}
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
          <p v-if="mediaError" class="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs leading-relaxed text-red-200">{{ mediaError }}</p>
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
            <SelectField v-model="exportOptions.format" label="导出格式" :options="formatOptions" />
            <NumberField v-model="exportOptions.fps" label="帧率" :min="15" :max="60" />
          </Panel>

          <Panel title="字幕内容">
            <TextField v-model="overlayState.scroll_title" label="滚动标题" />
            <TextAreaField v-model="overlayState.content" label="滚动正文" :rows="7" />
          </Panel>

          <Panel title="正文样式">
            <SelectField v-model="overlayState.text_align" label="正文对齐" :options="alignOptions" />
            <SelectField v-model="overlayState.body_case" label="正文大小写" :options="caseOptions" />
            <SliderControl v-model="overlayState.fontsize" label="正文字号" :min="20" :max="140" />
            <SliderControl v-model="overlayState.font_weight" label="正文粗细" :min="100" :max="900" :step="100" />
            <SliderControl v-model="overlayState.text_width" label="折行宽度" :min="300" :max="1080" :step="10" />
            <SliderControl v-model="overlayState.line_spacing" label="行距" :min="0" :max="80" />
            <SliderControl v-model="overlayState.scroll_letter_spacing" label="字距" :min="0" :max="20" />
            <ColorField v-model="overlayState.color" label="正文颜色" />
            <CheckField v-model="overlayState.use_stroke" label="开启正文描边" />
            <ColorField v-model="overlayState.stroke_color" label="描边颜色" />
            <SliderControl v-model="overlayState.stroke_width" label="描边宽度" :min="0" :max="12" />
            <CheckField v-model="overlayState.shadow_enabled" label="开启正文阴影" />
            <ColorField v-model="overlayState.shadow_color" label="阴影颜色" />
            <SliderControl v-model="overlayState.shadow_blur" label="阴影模糊" :min="0" :max="30" />
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.scroll_shadow_x" label="阴影 X" />
              <NumberField v-model="overlayState.scroll_shadow_y" label="阴影 Y" />
            </div>
          </Panel>

          <Panel title="标题样式">
            <SelectField v-model="overlayState.scroll_title_align" label="标题对齐" :options="alignOptions" />
            <SelectField v-model="overlayState.title_case" label="标题大小写" :options="caseOptions" />
            <SliderControl v-model="overlayState.scroll_title_fontsize" label="标题字号" :min="20" :max="140" />
            <SliderControl v-model="overlayState.scroll_title_font_weight" label="标题粗细" :min="100" :max="900" :step="100" />
            <SliderControl v-model="overlayState.scroll_title_text_width" label="标题宽度" :min="300" :max="1080" :step="10" />
            <SliderControl v-model="overlayState.scroll_title_gap" label="标题间距" :min="0" :max="160" />
            <SliderControl v-model="overlayState.scroll_title_line_spacing" label="标题行距" :min="0" :max="60" />
            <SliderControl v-model="overlayState.scroll_title_letter_spacing" label="标题字距" :min="0" :max="20" />
            <ColorField v-model="overlayState.scroll_title_color" label="标题颜色" />
            <CheckField v-model="overlayState.scroll_title_fixed" label="固定标题" />
            <CheckField v-model="overlayState.scroll_title_auto_fit" label="标题智能缩放" />
            <NumberField v-model="overlayState.scroll_title_max_height" label="标题最大高度" :min="0" />
            <CheckField v-model="overlayState.scroll_title_shadow_enabled" label="标题阴影" />
            <ColorField v-model="overlayState.scroll_title_shadow_color" label="标题阴影颜色" />
            <SliderControl v-model="overlayState.scroll_title_shadow_blur" label="标题阴影模糊" :min="0" :max="30" />
            <CheckField v-model="overlayState.titleStrokeEnabled" label="标题描边" />
            <ColorField v-model="overlayState.scroll_title_stroke_color" label="标题描边颜色" />
            <SliderControl v-model="overlayState.scroll_title_stroke_width" label="标题描边宽度" :min="0" :max="12" />
          </Panel>

          <Panel title="位置与滚动">
            <button class="rounded border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-200 hover:bg-blue-500/20" @click="centerOverlayDefaults">居中复位</button>
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.scroll_from_x" label="正文起点 X" />
              <NumberField v-model="overlayState.scroll_to_x" label="正文终点 X" />
              <NumberField v-model="overlayState.scroll_from_y" label="正文起点 Y" />
              <NumberField v-model="overlayState.scroll_to_y" label="正文终点 Y" />
            </div>
            <SliderControl v-model="overlayState.scroll_speed" label="滚动速度" :min="0.2" :max="2" :step="0.1" suffix="x" />
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.scroll_offset_x" label="整体偏移 X" />
              <NumberField v-model="overlayState.scroll_offset_y" label="整体偏移 Y" />
              <NumberField v-model="overlayState.scroll_title_x" label="标题中心 X" />
              <NumberField v-model="overlayState.scroll_title_y" label="标题顶部 Y" />
            </div>
            <CheckField v-model="overlayState.scroll_static" label="正文固定显示" />
            <CheckField v-model="overlayState.scroll_auto_stop" label="智能自动停止" />
            <NumberField v-model="overlayState.scroll_auto_stop_lead" label="提前停稳秒数" :min="0" />
            <CheckField v-model="overlayState.scroll_auto_fit" label="正文智能缩小" />
            <NumberField v-model="overlayState.scroll_min_fontsize" label="最小字号" :min="8" />
          </Panel>

          <Panel title="裁切与羽化">
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.x" label="裁切 X" />
              <NumberField v-model="overlayState.y" label="裁切 Y" />
              <NumberField v-model="overlayState.w" label="裁切 W" />
              <NumberField v-model="overlayState.h" label="裁切 H" />
            </div>
            <SliderControl v-model="overlayState.feather_top" label="顶部羽化" :min="0" :max="500" />
            <SliderControl v-model="overlayState.feather_bottom" label="底部羽化" :min="0" :max="500" />
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.feather_top_offset" label="上羽化偏移" />
              <NumberField v-model="overlayState.feather_bottom_offset" label="下羽化偏移" />
            </div>
          </Panel>

          <Panel title="背景框">
            <CheckField v-model="overlayState.bg_enabled" label="开启背景框" />
            <ColorField v-model="overlayState.bg_color" label="背景颜色" />
            <SliderControl v-model="overlayState.bg_opacity" label="透明度" :min="0" :max="255" />
            <SliderControl v-model="overlayState.bg_radius" label="圆角" :min="0" :max="80" />
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.bg_padding_top" label="Padding 上" />
              <NumberField v-model="overlayState.bg_padding_bottom" label="Padding 下" />
              <NumberField v-model="overlayState.bg_padding_left" label="Padding 左" />
              <NumberField v-model="overlayState.bg_padding_right" label="Padding 右" />
            </div>
            <CheckField v-model="overlayState.bg_blur_enabled" label="磨砂模糊" />
            <SliderControl v-model="overlayState.bg_blur_amount" label="模糊强度" :min="1" :max="40" />
            <CheckField v-model="overlayState.bg_border_enabled" label="背景边框" />
            <ColorField v-model="overlayState.bg_border_color" label="边框颜色" />
            <SliderControl v-model="overlayState.bg_border_width" label="边框宽度" :min="1" :max="16" />
            <SelectField v-model="overlayState.bg_border_style" label="边框样式" :options="borderStyleOptions" />
            <SliderControl v-model="overlayState.bg_border_opacity" label="边框透明度" :min="0" :max="100" />
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
import { transcodeWebmToMp4 } from './utils/ffmpegTranscoder.js';

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
const exportProgress = ref(0);
const exportStatus = ref('准备导出');
const mediaError = ref('');
const selectedTaskIndex = ref(0);
const overlayState = reactive(createScrollOverlay({
  scroll_title: 'IN SEPTEMBER, SAY THIS PRAYER!',
  content: '1. God walks with me.\n2. God guides my steps.\n3. God has a beautiful plan for me.\n4. I am protected from all evil.\n5. Every challenge is a stepping stone.',
  fontsize: 64,
  font_weight: 800,
  text_align: 'center',
  align: 'center',
  body_case: 'upper',
  scroll_uppercase: false,
  text_width: 900,
  line_spacing: 8,
  scroll_letter_spacing: 0,
  use_stroke: true,
  stroke_color: '#000000',
  stroke_width: 3,
  shadow_enabled: true,
  shadow_color: '#000000',
  shadow_blur: 6,
  scroll_shadow_x: 0,
  scroll_shadow_y: 3,
  scroll_title_fontsize: 48,
  scroll_title_font_weight: 900,
  scroll_title_align: 'center',
  title_case: 'upper',
  scroll_title_uppercase: false,
  scroll_title_text_width: 860,
  scroll_title_line_spacing: 0,
  scroll_title_letter_spacing: 0,
  scroll_title_auto_fit: true,
  scroll_title_max_height: 150,
  scroll_title_x: 540,
  scroll_title_y: 400,
  scroll_title_stroke_color: '#000000',
  scroll_title_stroke_width: 3,
  scroll_title_shadow_enabled: true,
  scroll_title_shadow_color: '#000000',
  scroll_title_shadow_blur: 8,
  titleStrokeEnabled: true,
  feather_top: 150,
  feather_bottom: 100,
  feather_top_offset: 0,
  feather_bottom_offset: 0,
  bg_opacity: 160,
  bg_radius: 16,
  bg_padding_top: 50,
  bg_padding_bottom: 50,
  bg_padding_left: 20,
  bg_padding_right: 20,
  bg_blur_enabled: false,
  bg_blur_amount: 10,
  bg_border_enabled: false,
  bg_border_color: '#FFD700',
  bg_border_width: 3,
  bg_border_style: 'solid',
  bg_border_opacity: 100,
  scroll_x_anchor: 'center',
  scroll_from_x: 540,
  scroll_to_x: 540,
  scroll_from_y: 1800,
  scroll_to_y: -200,
  scroll_offset_x: 0,
  scroll_offset_y: 0,
  scroll_static: false,
  scroll_auto_stop: true,
  scroll_auto_stop_lead: 0.5,
  scroll_auto_fit: false,
  scroll_min_fontsize: 18,
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
  format: 'mp4',
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
const formatOptions = [
  { value: 'mp4', label: 'MP4：发帖兼容' },
  { value: 'webm', label: 'WebM：快速导出' },
];
const alignOptions = [
  { value: 'center', label: '居中对齐' },
  { value: 'left', label: '左对齐' },
  { value: 'right', label: '右对齐' },
  { value: 'justify', label: '两端对齐' },
];
const caseOptions = [
  { value: 'upper', label: '全部大写' },
  { value: 'preserve', label: '保持原文' },
  { value: 'lower', label: '全部小写' },
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
const applyTextCase = (value, mode = 'preserve') => {
  const text = String(value || '');
  if (mode === 'upper') return text.toUpperCase();
  if (mode === 'lower') return text.toLowerCase();
  return text;
};

const centerOverlayDefaults = () => {
  overlayState.x = 40;
  overlayState.y = 400;
  overlayState.w = 1000;
  overlayState.h = 1120;
  overlayState.text_align = 'center';
  overlayState.align = 'center';
  overlayState.scroll_title_align = 'center';
  overlayState.scroll_x_anchor = 'center';
  overlayState.text_width = 900;
  overlayState.scroll_title_text_width = 860;
  overlayState.scroll_from_x = 540;
  overlayState.scroll_to_x = 540;
  overlayState.scroll_from_y = 1800;
  overlayState.scroll_to_y = -200;
  overlayState.scroll_offset_x = 0;
  overlayState.scroll_offset_y = 0;
  overlayState.scroll_title_x = 540;
  overlayState.scroll_title_y = 400;
  overlayState.feather_top_offset = 0;
  overlayState.feather_bottom_offset = 0;
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
  mediaError.value = '';
  const [path] = WebAssetPool.registerFiles([file]);
  const url = WebAssetPool.getUrl(path);

  if (kind === 'video') {
    media.videoFile = file;
    media.videoUrl = url;
    media.videoName = file.name;
    videoEl.value.preload = 'metadata';
    videoEl.value.src = url;
    videoEl.value.loop = true;
    videoEl.value.muted = true;
    videoEl.value.load();
    const result = await waitForMetadata(videoEl.value);
    media.videoDuration = Number.isFinite(videoEl.value.duration) ? videoEl.value.duration : 0;
    if (!result.ok || !media.videoDuration || !videoEl.value.videoWidth) {
      mediaError.value = `浏览器无法解码这个视频：${file.name}。大多数是 HEVC/H.265、10-bit HDR、ProRes 或相机 MOV；请先转成 H.264 + AAC 的 MP4 后再导入。`;
      media.videoUrl = '';
      media.videoName = '';
      media.videoDuration = 0;
      videoEl.value.removeAttribute('src');
      videoEl.value.load();
    }
  } else {
    media.audioFile = file;
    media.audioUrl = url;
    media.audioName = file.name;
    audioEl.value.preload = 'metadata';
    audioEl.value.src = url;
    audioEl.value.load();
    const result = await waitForMetadata(audioEl.value);
    media.audioDuration = Number.isFinite(audioEl.value.duration) ? audioEl.value.duration : 0;
    if (!result.ok || !media.audioDuration) {
      mediaError.value = `浏览器无法读取这个音频：${file.name}。请换成 MP3、M4A 或 WAV。`;
      media.audioUrl = '';
      media.audioName = '';
      media.audioDuration = 0;
      audioEl.value.removeAttribute('src');
      audioEl.value.load();
    }
  }

  previewTime.value = 0;
  syncSelectedTask();
  drawPreview();
};

const waitForMetadata = (element, timeoutMs = 30000) => new Promise((resolve) => {
  if (element.readyState >= 1 && Number.isFinite(element.duration)) {
    resolve({ ok: true });
    return;
  }

  let settled = false;
  let timer = 0;
  const finish = (result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    element.onloadedmetadata = null;
    element.onerror = null;
    resolve(result);
  };

  timer = window.setTimeout(() => finish({ ok: false, reason: 'timeout' }), timeoutMs);
  element.onloadedmetadata = () => finish({ ok: true });
  element.onerror = () => finish({ ok: false, reason: 'decode' });
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

const normalizeOverlayForNative = () => {
  const normalized = {
    ...JSON.parse(JSON.stringify(overlayState)),
    content: applyTextCase(overlayState.content, overlayState.body_case),
    scroll_title: applyTextCase(overlayState.scroll_title, overlayState.title_case),
    text_align: overlayState.text_align || overlayState.align || 'center',
    align: overlayState.text_align || overlayState.align || 'center',
    scroll_title_align: overlayState.scroll_title_align || overlayState.text_align || 'center',
    scroll_uppercase: false,
    scroll_title_uppercase: false,
    scroll_x_anchor: overlayState.scroll_x_anchor || 'center',
    _exporting: wasExporting,
    debug_layout: false,
    debug_body: false,
    debug_title: false,
    debug_footer: false,
    bg_opacity: overlayState.bg_opacity <= 1 ? Math.round(overlayState.bg_opacity * 255) : overlayState.bg_opacity,
    bg_padding_top: overlayState.bg_padding_top ?? overlayState.bg_pt ?? 46,
    bg_padding_bottom: overlayState.bg_padding_bottom ?? overlayState.bg_pb ?? 46,
    bg_padding_left: overlayState.bg_padding_left ?? overlayState.bg_px ?? 22,
    bg_padding_right: overlayState.bg_padding_right ?? overlayState.bg_px ?? 22,
    scroll_title_shadow_enabled: overlayState.scroll_title_shadow_enabled ?? true,
    scroll_title_stroke_width: overlayState.titleStrokeEnabled ? overlayState.scroll_title_stroke_width : 0,
    end: activeDuration.value,
  };
  return normalized;
};

const drawPreview = () => {
  const canvas = previewCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawVideoBackground(ctx, canvas, videoEl.value);

  const overlayForRender = normalizeOverlayForNative();
  const needsFallbackRenderer = overlayForRender.text_align === 'justify' || overlayForRender.scroll_title_align === 'justify';
  try {
    if (needsFallbackRenderer) {
      drawScrollOverlay(ctx, overlayForRender, previewTime.value, canvas.width, canvas.height);
    } else {
      ReelsOverlay.drawOverlay(ctx, overlayForRender, previewTime.value, canvas.width, canvas.height);
    }
  } catch (error) {
    console.warn('[ReelsOverlay] fallback renderer:', error);
    drawScrollOverlay(ctx, overlayForRender, previewTime.value, canvas.width, canvas.height);
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

const syncVideoForExport = (elapsed) => {
  const video = videoEl.value;
  if (!video || !media.videoUrl || !media.videoDuration) return;

  const targetTime = elapsed % media.videoDuration;
  const drift = Math.abs((video.currentTime || 0) - targetTime);
  if (!video.seeking && (video.ended || drift > 0.45)) {
    video.currentTime = targetTime;
  }
  if (video.paused || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    video.play().catch(() => {});
  }
};
const supportedMime = () => {
  const candidates = ['video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9,opus', 'video/webm'];
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
  exportProgress.value = 0;
  exportStatus.value = '准备素材';
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
  if (!mimeType) {
    window.alert('当前浏览器不支持 canvas 视频录制，请换 Chrome / Edge 最新版。');
    isExporting.value = false;
    wasExporting = false;
    stopPlayback();
    return;
  }
  const chunks = [];

  mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrateForQuality() });
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  mediaRecorder.onstop = async () => {
    exportStatus.value = '生成文件';
    stream.getTracks().forEach((track) => track.stop());
    const type = mimeType || 'video/webm';
    const recordedBlob = new Blob(chunks, { type });
    let outputBlob = recordedBlob;
    let ext = 'webm';

    if (exportOptions.format === 'mp4') {
      try {
        exportStatus.value = '转码 MP4';
        outputBlob = await transcodeWebmToMp4(recordedBlob, {
          fps: exportOptions.fps || 30,
          quality: exportOptions.quality,
          onProgress: (progress, status) => {
            exportProgress.value = Math.min(0.99, 0.85 + progress * 0.14);
            exportStatus.value = status;
          },
        });
        ext = 'mp4';
      } catch (error) {
        console.error(error);
        window.alert('MP4 转码失败，已自动保留 WebM 文件。大素材可能需要更长时间或更多内存。');
      }
    }

    const url = URL.createObjectURL(outputBlob);
    exportedUrl.value = url;
    triggerDownload(url, `${tasks.value[selectedTaskIndex.value]?.baseName || 'reels'}_${Date.now()}.${ext}`);
    exportProgress.value = 1;
    exportStatus.value = `已导出 ${ext.toUpperCase()}`;
    isExporting.value = false;
    wasExporting = false;
    stopPlayback();
    previewTime.value = 0;
    drawPreview();
  };

  mediaRecorder.start();
  const startedAt = performance.now();
  const tick = () => {
    if (!isExporting.value) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    previewTime.value = Math.min(elapsed, duration);
    const recordProgressMax = exportOptions.format === 'mp4' ? 0.85 : 0.99;
    exportProgress.value = Math.min(recordProgressMax, (previewTime.value / duration) * recordProgressMax);
    exportStatus.value = `导出 ${formatDuration(previewTime.value)} / ${formatDuration(duration)}`;
    syncVideoForExport(elapsed);
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
