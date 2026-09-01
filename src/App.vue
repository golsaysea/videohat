<template>
  <div class="flex h-screen flex-col overflow-hidden bg-[#0a0a14] font-sans text-gray-200">
    <header class="z-20 flex h-14 shrink-0 items-center justify-between border-b border-[#333] bg-[#1a1a2e] px-6 shadow-md">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-blue-500 to-cyan-400 font-bold text-white shadow-lg">S</div>
        <h1 class="m-0 text-lg font-bold tracking-wide text-white">滚动字幕专家 Web 版</h1>
      </div>
      <div class="flex gap-4">
        <button class="flex items-center gap-2 rounded border border-[#444] bg-[#2a2a3a] px-5 py-1.5 text-sm transition hover:bg-[#3a3a4a]" @click="showBulkModal = true">
          批量表格队列
        </button>
        <button class="flex items-center gap-2 rounded bg-blue-600 px-6 py-1.5 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500" @click="downloadCurrentPreset">
          保存当前模板
        </button>
      </div>
    </header>

    <main class="flex flex-1 overflow-hidden" v-if="store.isLoaded">
      <section class="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#05050a] p-8">
        <div class="absolute left-6 top-4 text-xs text-gray-500">竖屏画布预览 (1080 x 1920)</div>
        <div class="relative flex h-full w-auto aspect-[9/16] items-center justify-center overflow-hidden rounded border border-[#222] bg-black shadow-[0_0_40px_rgba(0,0,0,0.6)]">
          <canvas ref="previewCanvas" width="1080" height="1920" class="h-full w-full object-contain"></canvas>
        </div>

        <div class="absolute bottom-6 flex items-center gap-4 rounded-full border border-[#333] bg-[#1a1a2e]/90 px-6 py-2.5 shadow-lg backdrop-blur">
          <button class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow transition hover:bg-blue-500" @click="togglePlay">
            {{ isPlaying ? 'Pause' : 'Play' }}
          </button>
          <input v-model.number="previewTime" type="range" min="0" max="15" step="0.01" class="w-64 cursor-pointer accent-blue-500" />
          <span class="w-12 text-right font-mono text-xs text-gray-400">{{ previewTime.toFixed(1) }}s</span>
        </div>
      </section>

      <aside class="z-10 flex w-[380px] flex-col overflow-y-auto border-l border-[#2a2a3a] bg-[#121222] shadow-[-10px_0_20px_rgba(0,0,0,0.4)]">
        <div class="sticky top-0 z-10 border-b border-[#333] bg-[#121222] p-4 font-bold text-cyan-400">
          字幕效果控制台
        </div>

        <div class="flex flex-col gap-6 p-5">
          <label class="space-y-2">
            <span class="block text-xs font-bold text-gray-400">主标题 (固定吸顶)</span>
            <input v-model="overlayState.scroll_title" class="w-full rounded border border-[#333] bg-[#0a0a14] px-3 py-2 text-sm text-white outline-none transition focus:border-blue-500" />
          </label>

          <label class="space-y-2">
            <span class="block text-xs font-bold text-gray-400">滚动正文内容</span>
            <textarea v-model="overlayState.content" rows="7" class="w-full resize-none rounded border border-[#333] bg-[#0a0a14] px-3 py-2 text-sm leading-relaxed text-white outline-none transition focus:border-blue-500"></textarea>
          </label>

          <section class="flex flex-col gap-5 rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 class="m-0 border-b border-[#333] pb-2 text-xs font-bold text-gray-500">排版与滚动参数</h3>
            <SliderControl v-model="overlayState.fontsize" label="正文字号" :min="20" :max="120" />
            <SliderControl v-model="overlayState.scroll_speed" label="滚动速度" :min="0.2" :max="2" :step="0.1" suffix="x" />
            <SliderControl v-model="overlayState.text_width" label="折行宽度" :min="360" :max="1000" :step="10" />
            <SliderControl v-model="overlayState.line_spacing" label="行距" :min="0" :max="40" />
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400">文字颜色</span>
              <input v-model="overlayState.color" type="color" class="h-8 w-8 cursor-pointer rounded bg-transparent" />
            </div>
            <label class="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
              <input v-model="overlayState.use_stroke" type="checkbox" class="h-4 w-4 accent-blue-500" /> 开启文字黑边
            </label>
            <label class="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
              <input v-model="overlayState.shadow_enabled" type="checkbox" class="h-4 w-4 accent-blue-500" /> 开启正文阴影
            </label>
          </section>

          <section class="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 class="m-0 border-b border-[#333] pb-2 text-xs font-bold text-gray-500">标题参数</h3>
            <SliderControl v-model="overlayState.scroll_title_fontsize" label="标题字号" :min="24" :max="120" />
            <SliderControl v-model="overlayState.scroll_title_gap" label="标题间距" :min="0" :max="100" />
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400">标题颜色</span>
              <input v-model="overlayState.scroll_title_color" type="color" class="h-8 w-8 cursor-pointer rounded bg-transparent" />
            </div>
            <label class="flex cursor-pointer items-center gap-2 text-xs text-gray-400">
              <input v-model="overlayState.scroll_title_fixed" type="checkbox" class="h-4 w-4 accent-blue-500" /> 固定标题
            </label>
          </section>

          <section class="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 class="m-0 border-b border-[#333] pb-2 text-xs font-bold text-gray-500">羽化遮罩区</h3>
            <SliderControl v-model="overlayState.feather_top" label="顶部羽化" :min="0" :max="400" />
            <SliderControl v-model="overlayState.feather_bottom" label="底部羽化" :min="0" :max="400" />
          </section>

          <section class="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 class="m-0 border-b border-[#333] pb-2 text-xs font-bold text-gray-500">裁切窗口</h3>
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.x" label="X" />
              <NumberField v-model="overlayState.y" label="Y" />
              <NumberField v-model="overlayState.w" label="W" />
              <NumberField v-model="overlayState.h" label="H" />
            </div>
          </section>
        </div>
      </aside>
    </main>
    <div v-else class="flex flex-1 animate-pulse items-center justify-center text-gray-500">读取本地大型工程缓存中...</div>

    <BulkModal v-if="showBulkModal" :template-overlay="overlayState" @close="showBulkModal = false" @generate="handleGenerateTasks" />
  </div>
</template>

<script setup>
import { defineComponent, h, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import BulkModal from './components/BulkModal.vue';
import { useBulkStore } from './stores/bulkStore';
import { createScrollOverlay, drawScrollOverlay } from './utils/scrollOverlayRenderer';

const SliderControl = defineComponent({
  props: {
    modelValue: { type: Number, required: true },
    label: { type: String, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    step: { type: Number, default: 1 },
    suffix: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex items-center justify-between gap-3' }, [
      h('span', { class: 'text-xs text-gray-400' }, props.label),
      h('div', { class: 'flex items-center gap-2' }, [
        h('input', {
          type: 'range',
          min: props.min,
          max: props.max,
          step: props.step,
          value: props.modelValue,
          class: 'w-28 accent-blue-500',
          onInput: (event) => emit('update:modelValue', Number(event.target.value)),
        }),
        h('span', { class: 'w-12 text-right font-mono text-xs text-blue-400' }, `${props.modelValue}${props.suffix}`),
      ]),
    ]);
  },
});

const NumberField = defineComponent({
  props: {
    modelValue: { type: Number, required: true },
    label: { type: String, required: true },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('label', { class: 'space-y-1' }, [
      h('span', { class: 'block text-xs text-gray-500' }, props.label),
      h('input', {
        type: 'number',
        value: props.modelValue,
        class: 'w-full rounded border border-[#333] bg-[#0a0a14] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500',
        onInput: (event) => emit('update:modelValue', Number(event.target.value)),
      }),
    ]);
  },
});

const store = useBulkStore();
const showBulkModal = ref(false);
const previewCanvas = ref(null);
const isPlaying = ref(true);
const previewTime = ref(0);
const overlayState = reactive(createScrollOverlay());
let animationFrameId = 0;
let lastTimestamp = 0;

const drawPreview = () => {
  const canvas = previewCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#101016';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGradient.addColorStop(0, '#111827');
  bgGradient.addColorStop(0.5, '#0f172a');
  bgGradient.addColorStop(1, '#030712');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let y = 120; y < canvas.height; y += 180) {
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(canvas.width - 80, y + 60);
    ctx.stroke();
  }
  ctx.restore();

  drawScrollOverlay(ctx, overlayState, previewTime.value, canvas.width, canvas.height);
};

const renderLoop = (timestamp) => {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  if (isPlaying.value) {
    previewTime.value += delta;
    if (previewTime.value > 15) previewTime.value = 0;
  }

  drawPreview();
  animationFrameId = requestAnimationFrame(renderLoop);
};

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
  lastTimestamp = 0;
};

const downloadJson = (name, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const downloadCurrentPreset = () => {
  downloadJson(`scroll_overlay_preset_${Date.now()}.json`, {
    version: '1.0',
    overlay: JSON.parse(JSON.stringify(overlayState)),
  });
};

const handleGenerateTasks = (generatedTasks) => {
  downloadJson(`reels_export_queue_${Date.now()}.json`, {
    version: '3.0',
    generatedAt: new Date().toISOString(),
    tasks: generatedTasks,
  });
  window.alert(`成功吸取当前特效参数，并派生 ${generatedTasks.length} 个视频蓝图！`);
  showBulkModal.value = false;
};

watch(overlayState, drawPreview, { deep: true });
watch(previewTime, drawPreview);

onMounted(() => {
  store.loadDraft();
  animationFrameId = requestAnimationFrame(renderLoop);
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
});
</script>
