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
        <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-1.5 text-sm transition hover:bg-[#2b3146]" @click="showSettingsModal = true">设置</button>
        <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-1.5 text-sm transition hover:bg-[#2b3146]" @click="showTemplateLibrary = true">工程模板库</button>
        <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-1.5 text-sm transition hover:bg-[#2b3146]" @click="showBulkModal = true">批量表格</button>
        <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-1.5 text-sm transition hover:bg-[#2b3146]" @click="downloadProject">保存工程 JSON</button>
        <button class="rounded bg-blue-600 px-5 py-1.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500" :disabled="isExporting" @click="openExportDialog('current')">
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
          <button type="button" class="block w-full rounded border border-dashed border-[#3a4152] bg-[#171b2b] p-3 text-left text-sm text-gray-300 transition hover:border-blue-500 hover:text-white" @click="chooseLocalMedia('video')">
            <span class="block font-semibold">选择本地实拍视频</span>
            <span class="mt-1 block text-xs text-gray-500">优先保存文件授权，刷新后可重新读取 MP4</span>
          </button>
          <button type="button" class="block w-full rounded border border-dashed border-[#3a4152] bg-[#171b2b] p-3 text-left text-sm text-gray-300 transition hover:border-blue-500 hover:text-white" @click="chooseLocalMedia('audio')">
            <span class="block font-semibold">上传音频</span>
            <span class="mt-1 block text-xs text-gray-500">有音频时默认按音频时长导出</span>
          </button>
          <input ref="videoFileInput" class="hidden" type="file" accept="video/*,.mp4,.mov,.m4v,.webm,.quicktime" @change="event => loadMedia(event, 'video')" />
          <input ref="audioFileInput" class="hidden" type="file" accept="audio/*" @change="event => loadMedia(event, 'audio')" />
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div class="rounded border border-[#2a2f3a] bg-black/20 p-2">视频：{{ formatDuration(media.videoDuration) }}</div>
            <div class="rounded border border-[#2a2f3a] bg-black/20 p-2">音频：{{ formatDuration(media.audioDuration) }}</div>
          </div>
          <div v-if="mediaProgress > 0 && mediaProgress < 1" class="space-y-1 rounded border border-blue-500/30 bg-blue-500/10 p-2">
            <div class="flex items-center justify-between text-xs text-blue-100">
              <span>本地处理 {{ Math.round(mediaProgress * 100) }}%</span>
              <span>{{ mediaEta }}</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded bg-black/40">
              <div class="h-full rounded bg-blue-400 transition-all" :style="{ width: `${Math.round(mediaProgress * 100)}%` }"></div>
            </div>
          </div>
          <p v-if="mediaError" class="rounded border border-blue-500/30 bg-blue-500/10 p-2 text-xs leading-relaxed text-blue-100">{{ mediaError }}</p>
          <p class="text-xs leading-relaxed text-gray-500">本地选择不会上传后台；只有点击“手动上传素材到 R2”才会占用 R2。</p>
          <p class="text-xs leading-relaxed text-gray-500">{{ localDraftStatus }}</p>
        </div>

        <div class="space-y-3 border-b border-[#2a2f3a] p-4">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-sm font-bold text-cyan-300">本地素材文件夹缓存</h3>
            <button class="text-xs text-blue-400 hover:text-blue-300" :disabled="localMediaBusy" @click="restoreLocalMediaFolder">恢复</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-2 text-xs hover:bg-[#2b3146]" :disabled="localMediaBusy" @click="selectLocalMediaFolder">授权素材路径</button>
            <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-2 text-xs hover:bg-[#2b3146]" :disabled="localMediaBusy || !localMediaItems.length" @click="scanLocalMediaDirectory">刷新列表</button>
          </div>
          <p class="text-xs leading-relaxed text-gray-500">{{ localMediaStatus }}</p>
          <div v-if="localMediaItems.length" class="max-h-40 space-y-2 overflow-y-auto">
            <div v-for="item in localMediaItems" :key="item.name" class="rounded border border-[#2a2f3a] bg-black/20 p-2">
              <div class="truncate text-xs font-semibold text-white">{{ item.kind === 'video' ? '视频' : '音频' }} · {{ item.name }}</div>
              <div class="mt-1 text-[11px] text-gray-500">{{ item.cacheName ? `缓存：${item.cacheName}` : '未生成旁路 MP4 缓存' }}</div>
              <button class="mt-2 rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-100 hover:bg-cyan-500/20" :disabled="localMediaBusy" @click="useLocalMediaForCurrent(item)">用于当前任务</button>
            </div>
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
              <span class="mt-1 block truncate text-xs text-gray-500">{{ task.videoName || '无视频' }} / {{ task.audioName || '无配音' }} / {{ task.musicName || '无配乐' }}</span>
              <div v-if="task.exportStatus" class="mt-2 space-y-1">
                <div class="flex items-center justify-between text-[11px] text-gray-500">
                  <span>{{ task.exportStatus }}</span>
                  <span>{{ Math.round((task.exportProgress || 0) * 100) }}%</span>
                </div>
                <div class="h-1 overflow-hidden rounded bg-black/40">
                  <div class="h-full rounded bg-cyan-400" :style="{ width: `${Math.round((task.exportProgress || 0) * 100)}%` }"></div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 border-t border-[#2a2f3a] p-3">
          <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-2 text-xs hover:bg-[#2b3146]" :disabled="isExporting" @click="openExportDialog('queue')">批量导出</button>
          <button class="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20" @click="clearQueue">清空队列</button>
        </div>
      </aside>

      <section class="relative flex min-h-0 flex-col items-center justify-center overflow-hidden bg-[#03050a] p-6">
        <div class="absolute left-5 top-4 text-xs text-gray-500">Canvas 预览 {{ previewResolutionLabel }}</div>
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
        <audio ref="musicEl" class="hidden" crossorigin="anonymous" loop></audio>
<video v-if="exportedUrl" class="absolute bottom-24 right-5 h-56 rounded border-2 border-blue-500 bg-black shadow-xl" :src="exportedUrl" controls autoplay playsinline></video>
      </section>

      <aside class="flex min-h-0 flex-col overflow-y-auto border-l border-[#2a2f3a] bg-[#121625]">
        <div class="sticky top-0 z-10 border-b border-[#2a2f3a] bg-[#121625] p-4 font-bold text-cyan-300">Reels 参数</div>
        <div class="flex flex-col gap-5 p-4">
          <Panel title="输出与时长">
            <SelectField v-model="exportOptions.durationMode" label="时长来源" :options="durationModeOptions" />
            <NumberField v-if="exportOptions.durationMode === 'custom'" v-model="exportOptions.customDuration" label="自定义秒数" :min="1" />
            <SelectField v-model="exportOptions.fitMode" label="视频匹配" :options="fitModeOptions" />
            <SelectField v-model="exportOptions.previewScale" label="预览性能" :options="previewScaleOptions" />
            <SelectField v-model="exportOptions.engine" label="渲染引擎" :options="engineOptions" />
            <SelectField v-model="exportOptions.format" label="导出格式" :options="formatOptions" />
            <SelectField v-model="exportOptions.quality" label="导出画质" :options="qualityOptions" />
            <SelectField v-model="exportOptions.resolution" label="导出分辨率" :options="resolutionOptions" />
            <div v-if="exportOptions.resolution === 'custom'" class="grid grid-cols-2 gap-3">
              <NumberField v-model="exportOptions.customWidth" label="宽" :min="240" />
              <NumberField v-model="exportOptions.customHeight" label="高" :min="240" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="exportOptions.fps" label="帧率" :min="15" :max="60" />
              <NumberField v-model="exportOptions.customBitrate" label="目标 Mbps" :min="1" />
            </div>
            <SelectField v-model="exportOptions.namingMode" label="命名策略" :options="namingModeOptions" />
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="exportOptions.concurrency" label="并发" :min="1" :max="4" />
              <NumberField v-model="exportOptions.recycleEvery" label="每 N 条续跑" :min="0" />
            </div>
            <CheckField v-model="exportOptions.useGpu" label="GPU/硬件编码（后端）" />
            <CheckField v-model="exportOptions.useMemoryDecoder" label="极速内存解码" />
            <CheckField v-model="exportOptions.fastAlphaMode" label="极速贴合模式" />
          </Panel>

          <Panel title="字幕内容">
            <TextField v-model="overlayState.scroll_title" label="滚动标题" />
            <TextAreaField v-model="overlayState.content" label="滚动正文" :rows="7" />
          </Panel>

          <Panel title="署名">
            <CheckField v-model="overlayState.signature_enabled" label="显示署名" />
            <TextField v-model="overlayState.signature_text" label="署名文字" />
            <FontPreviewPicker v-model="overlayState.signature_font_family" label="署名字体预览" sample="@ VideoHat" />
            <SelectField v-model="overlayState.signature_position" label="署名位置" :options="signaturePositionOptions" />
            <SelectField v-model="overlayState.signature_align" label="署名对齐" :options="alignOptions" />
            <SelectField v-model="overlayState.signature_case" label="署名大小写" :options="caseOptions" />
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.signature_x" label="中心 X" />
              <NumberField v-model="overlayState.signature_y" label="顶部 Y" />
              <NumberField v-model="overlayState.signature_width" label="署名宽度" />
              <NumberField v-model="overlayState.signature_line_spacing" label="署名行距" />
            </div>
            <SliderControl v-model="overlayState.signature_fontsize" label="署名字号" :min="14" :max="120" />
            <SliderControl v-model="overlayState.signature_font_weight" label="署名粗细" :min="100" :max="900" :step="100" />
            <ColorField v-model="overlayState.signature_color" label="署名颜色" />
            <CheckField v-model="overlayState.signature_bg_enabled" label="署名黑底背景" />
            <ColorField v-model="overlayState.signature_bg_color" label="署名背景颜色" />
            <SliderControl v-model="overlayState.signature_bg_opacity" label="背景透明度" :min="0" :max="100" suffix="%" />
            <div class="grid grid-cols-2 gap-3">
              <NumberField v-model="overlayState.signature_bg_radius" label="背景圆角" :min="0" />
              <NumberField v-model="overlayState.signature_bg_pad_x" label="背景横距" :min="0" />
              <NumberField v-model="overlayState.signature_bg_pad_y" label="背景纵距" :min="0" />
              <button class="self-end rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-500/20" @click="applySignaturePositionPreset">应用位置</button>
            </div>
            <CheckField v-model="overlayState.signature_stroke_enabled" label="署名描边" />
            <ColorField v-model="overlayState.signature_stroke_color" label="署名描边颜色" />
            <SliderControl v-model="overlayState.signature_stroke_width" label="署名描边宽度" :min="0" :max="12" />
            <CheckField v-model="overlayState.signature_shadow_enabled" label="署名阴影" />
            <ColorField v-model="overlayState.signature_shadow_color" label="署名阴影颜色" />
            <SliderControl v-model="overlayState.signature_shadow_blur" label="署名阴影模糊" :min="0" :max="30" />
          </Panel>
          <Panel title="正文样式">
            <SelectField v-model="overlayState.text_align" label="正文对齐" :options="alignOptions" />
            <SelectField v-model="overlayState.body_case" label="正文大小写" :options="caseOptions" />
            <FontPreviewPicker v-model="overlayState.font_family" label="正文字体预览" sample="1. GOD WALKS WITH ME." />
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
            <FontPreviewPicker v-model="overlayState.scroll_title_font_family" label="标题字体预览" sample="IN SEPTEMBER" />
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


    <div v-if="showExportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/90 p-6 backdrop-blur">
      <div class="flex max-h-[90vh] w-[min(980px,96vw)] flex-col overflow-hidden rounded border border-[#343b4f] bg-[#111522] shadow-2xl">
        <div class="flex items-center justify-between border-b border-[#2a2f3a] bg-[#171b2b] px-5 py-4">
          <div>
            <h2 class="m-0 text-lg font-bold text-cyan-300">VideoKit 导出队列</h2>
            <p class="mt-1 text-xs text-gray-500">{{ exportDialogMode === 'queue' ? `批量导出 ${tasks.length} 条任务` : '导出当前选中任务' }}</p>
          </div>
          <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-1.5 text-sm text-gray-200 hover:bg-[#2b3146]" :disabled="isExporting" @click="showExportModal = false">关闭</button>
        </div>

        <div class="grid min-h-0 flex-1 grid-cols-[340px_1fr] overflow-hidden">
          <div class="space-y-4 overflow-y-auto border-r border-[#2a2f3a] p-4">
            <Panel title="导出模式">
              <SelectField v-model="exportDialogMode" label="导出范围" :options="exportScopeOptions" />
              <SelectField v-model="exportOptions.engine" label="渲染引擎" :options="engineOptions" />
              <SelectField v-model="exportOptions.format" label="导出格式" :options="formatOptions" />
              <SelectField v-model="exportOptions.quality" label="导出画质" :options="qualityOptions" />
              <SelectField v-model="exportOptions.resolution" label="导出分辨率" :options="resolutionOptions" />
              <SelectField v-model="exportOptions.durationMode" label="时长来源" :options="durationModeOptions" />
              <SelectField v-model="exportOptions.fitMode" label="视频匹配" :options="fitModeOptions" />
              <div class="grid grid-cols-2 gap-3">
                <NumberField v-model="exportOptions.fps" label="帧率" :min="15" :max="60" />
                <NumberField v-model="exportOptions.customBitrate" label="目标 Mbps" :min="1" />
              </div>
              <CheckField v-model="exportOptions.useGpu" label="GPU/硬件编码（后端）" />
              <CheckField v-model="exportOptions.useMemoryDecoder" label="极速内存解码" />
            </Panel>
          </div>

          <div class="flex min-h-0 flex-col p-4">
            <div class="mb-4 rounded border border-[#303648] bg-black/20 p-3">
              <div class="mb-2 flex items-center justify-between text-xs text-gray-400">
                <span>{{ exportStatus }}</span>
                <span>{{ Math.round(exportProgress * 100) }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded bg-[#30384d]">
                <div class="h-full rounded bg-blue-500 transition-all" :style="{ width: `${Math.round(exportProgress * 100)}%` }"></div>
              </div>
              <p class="mt-2 text-xs text-gray-500">{{ exportPlanSummary }}</p>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto rounded border border-[#2a2f3a]">
              <div v-for="(job, index) in exportJobs" :key="job.id" class="border-b border-[#222838] p-3 last:border-b-0" :class="index === selectedTaskIndex ? 'bg-blue-500/10' : 'bg-[#151a29]'">
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-white">{{ index + 1 }}. {{ job.baseName }}</div>
                    <div class="mt-1 truncate text-xs text-gray-500">{{ job.videoName || '无视频' }} / {{ job.audioName || '无音频' }}</div>
                  </div>
                  <span class="shrink-0 rounded border border-[#3a4152] px-2 py-1 text-[11px] text-gray-300">{{ job.exportStatus || '等待导出' }}</span>
                </div>
                <div class="mt-2 h-1.5 overflow-hidden rounded bg-black/40">
                  <div class="h-full rounded bg-cyan-400" :style="{ width: `${Math.round((job.exportProgress || 0) * 100)}%` }"></div>
                </div>
              </div>
            </div>

            <div class="mt-4 flex justify-end gap-3">
              <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-2 text-sm hover:bg-[#2b3146]" :disabled="isExporting" @click="showExportModal = false">取消</button>
              <button class="rounded bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-60" :disabled="isExporting" @click="startExportFromDialog">{{ isExporting ? '导出中...' : '开始导出' }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showTemplateLibrary" class="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/90 p-6 backdrop-blur">
      <div class="flex max-h-[90vh] w-[min(760px,94vw)] flex-col overflow-hidden rounded border border-[#343b4f] bg-[#111522] shadow-2xl">
        <div class="flex items-center justify-between border-b border-[#2a2f3a] bg-[#171b2b] px-5 py-4">
          <div>
            <h2 class="m-0 text-lg font-bold text-cyan-300">官方工程模板库</h2>
            <p class="mt-1 text-xs text-gray-500">管理员保存音频、文案和参数；使用者只替换自己的实拍视频。</p>
          </div>
          <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-1.5 text-sm text-gray-200 hover:bg-[#2b3146]" @click="showTemplateLibrary = false">关闭</button>
        </div>
        <div class="grid min-h-0 flex-1 grid-cols-[1fr_280px] gap-4 overflow-y-auto p-5">
          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="m-0 text-sm font-bold text-white">选择工程</h3>
              <button class="text-xs text-blue-400 hover:text-blue-300" :disabled="templateBusy" @click="refreshOfficialTemplates">刷新</button>
            </div>
            <div v-if="officialTemplates.length" class="space-y-2">
              <button v-for="template in officialTemplates" :key="template.id" class="w-full rounded border p-3 text-left transition" :class="selectedTemplateId === template.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-[#2a2f3a] bg-black/20 hover:border-[#465066]'" @click="selectedTemplateId = template.id">
                <span class="block truncate text-sm font-semibold text-white">{{ template.title }}</span>
                <span class="mt-1 block truncate text-xs text-gray-500">{{ template.description || '官方工程模板' }}</span>
                <span class="mt-1 block text-[11px] text-gray-600">{{ formatCloudTime(template.updatedAt) }}</span>
              </button>
            </div>
            <div v-else class="rounded border border-dashed border-[#343b4f] p-8 text-center text-sm text-gray-500">暂无工程模板</div>
          </section>
          <aside class="space-y-3">
            <button class="w-full rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-60" :disabled="!selectedTemplateId || templateBusy" @click="applySelectedTemplate">套用选中工程</button>
            <button v-if="isAdminMode && selectedTemplateId" class="w-full rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-60" :disabled="templateBusy || !adminToken" @click="deleteSelectedOfficialTemplate">删除这个官方工程</button>
            <p class="min-h-10 text-xs leading-relaxed text-gray-500">{{ templateStatus }}</p>
            <div v-if="templateProgress > 0 || templateBusy" class="space-y-1 rounded border border-blue-500/30 bg-blue-500/10 p-2">
              <div class="flex items-center justify-between text-[11px] text-blue-100">
                <span>模板处理进度</span>
                <span>{{ Math.round(templateProgress * 100) }}%</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded bg-black/40">
                <div class="h-full rounded bg-blue-400 transition-all" :style="{ width: `${Math.round(templateProgress * 100)}%` }"></div>
              </div>
            </div>
            <div v-if="isAdminMode" class="space-y-2 rounded border border-amber-500/30 bg-amber-500/10 p-3">
              <div class="text-xs font-bold text-amber-200">管理员模板制作</div>
              <input v-model="adminToken" type="password" class="w-full rounded border border-[#33394a] bg-[#070a12] px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400" placeholder="ADMIN_TOKEN" @change="persistAdminToken" />
              <input v-model="templateTitle" class="w-full rounded border border-[#33394a] bg-[#070a12] px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400" placeholder="模板名称/中文文件名" />
              <button class="w-full rounded border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-400/20 disabled:opacity-60" :disabled="templateBusy || !adminToken" @click="publishCurrentAsTemplate">上传音频并保存工程模板</button>
            </div>
            <div v-else class="rounded border border-[#2a2f3a] bg-black/20 p-3 text-xs leading-relaxed text-gray-500">管理员入口：网址后加 <span class="font-mono text-gray-300">?admin=1</span>，输入 Cloudflare 的 ADMIN_TOKEN 后保存模板。</div>
          </aside>
        </div>
      </div>
    </div>

    <div v-if="fontLibraryModal.open" class="fixed inset-0 z-[60] flex items-center justify-center bg-[#05070d]/90 p-6 backdrop-blur">
      <div class="grid max-h-[92vh] w-[min(1120px,96vw)] grid-cols-[210px_minmax(0,1fr)_300px] overflow-hidden rounded-lg border border-[#343b4f] bg-[#141625] shadow-2xl">
        <aside class="border-r border-[#303648] bg-[#202236] p-4">
          <div class="mb-4 text-sm font-bold text-white">字体库</div>
          <button v-for="category in fontCategories" :key="category.value" class="mb-2 block w-full rounded px-3 py-2 text-left text-xs transition" :class="fontLibraryModal.category === category.value ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10'" @click="fontLibraryModal.category = category.value">{{ category.label }}</button>
        </aside>
        <section class="min-h-0 overflow-hidden">
          <div class="border-b border-[#303648] p-4">
            <input v-model="fontLibraryModal.query" class="w-full rounded border border-[#33394a] bg-[#070a12] px-3 py-2 text-sm text-white outline-none focus:border-blue-500" placeholder="搜索字体：如 英文、标题、中文、手写..." />
            <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>当前字段：{{ fontLibraryModal.label }}，点击字体卡片即可应用。</span>
              <span>{{ fontBusy ? '读取 R2 字体中...' : '可用字体 ' + fontChoices.length + ' 个' }}</span>
            </div>
          </div>
          <div class="grid max-h-[72vh] grid-cols-2 gap-3 overflow-y-auto p-4">
            <button v-for="font in filteredFontChoices" :key="font.value" class="rounded border bg-black/20 p-3 text-left transition hover:border-cyan-400 hover:bg-cyan-400/10" :class="fontLibraryModal.value === font.value ? 'border-cyan-400 ring-1 ring-cyan-400/50' : 'border-[#303648]'" @click="applyFontChoice(font)">
              <div class="flex items-center justify-between gap-2">
                <span class="truncate text-sm font-bold text-white" :style="fontPreviewStyle(font)">{{ font.label }}</span>
                <span class="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-100">应用</span>
              </div>
              <div class="mt-3 truncate text-lg text-white" :style="fontPreviewStyle(font)">{{ fontLibraryModal.sample || font.sample }}</div>
              <div class="mt-2 flex flex-wrap gap-1"><span v-for="tag in font.tags" :key="tag" class="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] text-blue-100">{{ tag }}</span></div>
            </button>
          </div>
        </section>
        <aside class="border-l border-[#303648] bg-[#101421] p-5">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-sm font-bold text-cyan-300">当前预览</h3>
            <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-1.5 text-xs text-gray-200 hover:bg-[#2b3146]" @click="fontLibraryModal.open = false">关闭</button>
          </div>
          <div class="mt-5 rounded border border-[#303648] bg-black/30 p-4">
            <div class="text-xs text-gray-500">正在使用</div>
            <div class="mt-2 truncate text-sm font-bold text-white">{{ fontLibraryModal.value || 'Arial' }}</div>
          </div>
          <div class="mt-5 flex aspect-[9/12] items-center justify-center rounded border border-[#303648] bg-gradient-to-b from-[#171b2b] to-black p-5 text-center">
            <div class="text-2xl leading-tight text-white" :style="fontPreviewStyle({ value: fontLibraryModal.value || 'Arial', weight: 900 })">{{ fontLibraryModal.sample || 'Make it unforgettable' }}</div>
          </div>
          <p class="mt-4 text-xs leading-relaxed text-gray-500">R2 字体首次点击会加载到浏览器，之后正文、标题、署名都会实时用同一套 Canvas 字体渲染。</p>
        </aside>
      </div>
    </div>

    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-[#05070d]/90 p-6 backdrop-blur">
      <div class="flex max-h-[90vh] w-[min(980px,94vw)] flex-col overflow-hidden rounded-lg border border-[#343b4f] bg-[#111522] shadow-2xl">
        <div class="flex shrink-0 items-center justify-between border-b border-[#2a2f3a] px-5 py-4">
          <div>
            <h2 class="m-0 text-base font-bold text-cyan-300">设置</h2>
            <p class="m-0 mt-1 text-xs text-gray-500">云端工程、官方模板、字体库和媒体池都收在这里。</p>
          </div>
          <button class="rounded border border-[#3a4152] bg-[#202538] px-4 py-2 text-xs text-gray-200 hover:bg-[#2b3146]" @click="showSettingsModal = false">关闭</button>
        </div>
        <div class="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto p-5">
        <div class="space-y-3 border-b border-[#2a2f3a] p-4">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-sm font-bold text-cyan-300">Google Drive 媒体池</h3>
            <button class="text-xs text-blue-400 hover:text-blue-300" :disabled="driveBusy" @click="connectGoogleDrive">连接</button>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-2 text-xs hover:bg-[#2b3146]" :disabled="driveBusy" @click="pickGoogleDriveMedia('video')">选云盘视频</button>
            <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-2 text-xs hover:bg-[#2b3146]" :disabled="driveBusy" @click="pickGoogleDriveMedia('audio')">选云盘音频</button>
          </div>
          <p class="text-xs leading-relaxed text-gray-500">{{ driveStatus }}</p>
          <div v-if="mediaPool.length" class="max-h-36 space-y-2 overflow-y-auto">
            <div v-for="item in mediaPool" :key="item.provider + '-' + item.id" class="rounded border border-[#2a2f3a] bg-black/20 p-2">
              <div class="truncate text-xs font-semibold text-white">{{ item.kind === 'video' ? '视频' : '音频' }} · {{ item.name }}</div>
              <div class="mt-2 flex gap-2">
                <button class="rounded border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-200 hover:bg-blue-500/20" :disabled="driveBusy" @click="useDriveMediaForCurrent(item)">用于当前任务</button>
                <button class="rounded border border-[#3a4152] px-2 py-1 text-[11px] text-gray-400 hover:bg-white/5" @click="removeMediaPoolItem(item)">移除</button>
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-3 border-b border-[#2a2f3a] p-4">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-sm font-bold text-cyan-300">云端工程</h3>
            <button class="text-xs text-blue-400 hover:text-blue-300" :disabled="cloudBusy" @click="refreshCloudProjects">刷新</button>
          </div>
          <label class="space-y-1">
            <span class="block text-xs text-gray-500">用户标识</span>
            <input v-model="cloudOwnerId" class="w-full rounded border border-[#33394a] bg-[#070a12] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500" placeholder="例如 your@email.com" @change="persistCloudOwner" />
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-2 text-xs hover:bg-[#2b3146]" :disabled="cloudBusy" @click="saveProjectOnline">保存云端</button>
            <button class="rounded border border-[#3a4152] bg-[#202538] px-3 py-2 text-xs hover:bg-[#2b3146]" :disabled="cloudBusy" @click="uploadCurrentAssets">手动上传素材到 R2</button>
            <button v-if="isAdminMode" class="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/20" :disabled="cloudBusy || !adminToken" @click="clearOwnerMediaAssets">清空R2素材</button>
          </div>
          <p class="min-h-5 text-xs text-gray-500">{{ cloudStatus }}</p>
          <select v-if="cloudProjects.length" v-model="selectedCloudProjectId" class="w-full rounded border border-[#33394a] bg-[#070a12] px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500">
            <option value="">选择云端工程</option>
            <option v-for="project in cloudProjects" :key="project.id" :value="project.id">{{ project.title }} · {{ formatCloudTime(project.updatedAt) }}</option>
          </select>
          <div v-if="selectedCloudProjectId" class="grid grid-cols-2 gap-2">
            <button class="rounded border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs text-blue-200 hover:bg-blue-500/20" :disabled="cloudBusy" @click="loadSelectedCloudProject">加载选中工程</button>
            <button class="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/20" :disabled="cloudBusy" @click="deleteSelectedCloudProject">删除工程</button>
          </div>
        </div>

        <div class="space-y-3 border-b border-[#2a2f3a] p-4">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-sm font-bold text-cyan-300">官方工程模板</h3>
            <button class="text-xs text-blue-400 hover:text-blue-300" :disabled="templateBusy" @click="refreshOfficialTemplates">刷新</button>
          </div>
          <select v-model="selectedTemplateId" class="w-full rounded border border-[#33394a] bg-[#070a12] px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500">
            <option value="">选择工程模板</option>
            <option v-for="template in officialTemplates" :key="template.id" :value="template.id">{{ template.title }}</option>
          </select>
          <p class="min-h-5 text-xs text-gray-500">{{ templateStatus }}</p>
          <div v-if="templateProgress > 0 || templateBusy" class="space-y-1 rounded border border-blue-500/30 bg-blue-500/10 p-2">
            <div class="flex items-center justify-between text-[11px] text-blue-100">
              <span>模板处理</span>
              <span>{{ Math.round(templateProgress * 100) }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded bg-black/40">
              <div class="h-full rounded bg-blue-400 transition-all" :style="{ width: `${Math.round(templateProgress * 100)}%` }"></div>
            </div>
          </div>
          <div v-if="selectedTemplateId" class="grid grid-cols-2 gap-2">
            <button class="rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-500/20" :disabled="templateBusy" @click="applySelectedTemplate">套用模板</button>
            <button v-if="isAdminMode" class="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/20" :disabled="templateBusy || !adminToken" @click="deleteSelectedOfficialTemplate">删除模板</button>
          </div>
          <div v-if="isAdminMode" class="space-y-2 rounded border border-amber-500/30 bg-amber-500/10 p-3">
            <label class="space-y-1">
              <span class="block text-xs text-amber-200">管理员 Token</span>
              <input v-model="adminToken" type="password" class="w-full rounded border border-[#33394a] bg-[#070a12] px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400" placeholder="Cloudflare ADMIN_TOKEN" @change="persistAdminToken" />
            </label>
            <input v-model="templateTitle" class="w-full rounded border border-[#33394a] bg-[#070a12] px-2 py-1.5 text-xs text-white outline-none focus:border-amber-400" placeholder="模板名称，例如：祷告主题-中文文案-001" />
            <button class="w-full rounded border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-xs text-amber-100 hover:bg-amber-400/20" :disabled="templateBusy || !adminToken" @click="publishCurrentAsTemplate">上传音频并保存工程模板</button>
          </div>
        </div>

        <div class="space-y-3 border-b border-[#2a2f3a] p-4">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-sm font-bold text-cyan-300">官方字体库</h3>
            <button class="text-xs text-blue-400 hover:text-blue-300" :disabled="fontBusy" @click="refreshCloudFonts">刷新</button>
          </div>
          <p class="min-h-5 text-xs leading-relaxed text-gray-500">{{ fontLibraryStatus }}</p>
          <div v-if="fontUploadProgress > 0 || fontBusy" class="space-y-1 rounded border border-cyan-500/30 bg-cyan-500/10 p-2">
            <div class="flex items-center justify-between text-[11px] text-cyan-100">
              <span>字体处理</span>
              <span>{{ Math.round(fontUploadProgress * 100) }}%</span>
            </div>
            <div class="h-1.5 overflow-hidden rounded bg-black/40">
              <div class="h-full rounded bg-cyan-400 transition-all" :style="{ width: `${Math.round(fontUploadProgress * 100)}%` }"></div>
            </div>
          </div>
          <label v-if="isAdminMode" class="block cursor-pointer rounded border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-center text-xs text-amber-100 hover:bg-amber-400/20">
            批量上传字体到 R2
            <input class="hidden" type="file" multiple accept=".woff2,.woff,.ttf,.otf,.ttc,font/*" @change="uploadOfficialFonts" />
          </label>
          <div v-if="cloudFonts.length" class="max-h-32 space-y-1 overflow-y-auto rounded border border-[#2a2f3a] bg-black/20 p-2">
            <button v-for="font in cloudFonts" :key="font.id" class="w-full truncate rounded px-2 py-1 text-left text-xs text-gray-300 hover:bg-white/10" :style="{ fontFamily: `'${font.family}', Arial, sans-serif` }" @click="ensureCloudFontLoaded(font)">
              {{ font.family }}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>

    <BulkModal v-if="showBulkModal" :template-overlay="overlayState" @close="showBulkModal = false" @generate="handleGeneratedTasks" />
  </div>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import localforage from 'localforage';
import BulkModal from './components/BulkModal.vue';
import { useBulkStore } from './stores/bulkStore';
import { createScrollOverlay, drawScrollOverlay } from './utils/scrollOverlayRenderer';
import { ReelsOverlay } from './utils/reels-overlay.js';
import { WebAssetPool } from './utils/WebAssetPool.js';
import { transcodeInputVideoToMp4, transcodeWebmToMp4 } from './utils/ffmpegTranscoder.js';
import { assetUrl, deleteCloudProject, deleteOfficialTemplate, deleteOwnerMediaAssets, listCloudFonts, listCloudProjects, listOfficialTemplates, saveCloudProject, saveOfficialTemplate, uploadCloudAsset, uploadCloudFont } from './utils/cloudProjectApi.js';
import { downloadDriveFile, isGoogleDriveConfigured, openDrivePicker, requestDriveToken } from './utils/googleDriveMedia.js';

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

const cloudFonts = ref([]);
const fontLibraryStatus = ref('字体库未读取');
const fontBusy = ref(false);
const fontUploadProgress = ref(0);
const loadedCloudFontKeys = new Set();

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

const fontPresets = [
  { value: 'Arial', label: 'Arial', sample: 'Make it unforgettable', category: 'sans', tags: ['sans', 'system'], weight: 800 },
  { value: 'Arial Black', label: 'Arial Black', sample: 'PRAYER NOW', category: 'display', tags: ['display', 'heavy'], weight: 900 },
  { value: 'Georgia', label: 'Georgia', sample: 'Grace & Hope', category: 'serif', tags: ['serif', 'classic'], weight: 700 },
  { value: 'Trebuchet MS', label: 'Trebuchet MS', sample: 'Beautiful Plan', category: 'sans', tags: ['sans', 'soft'], weight: 800 },
  { value: 'Verdana', label: 'Verdana', sample: 'Every Step', category: 'sans', tags: ['sans', 'wide'], weight: 800 },
  { value: 'Tahoma', label: 'Tahoma', sample: 'Stay Protected', category: 'sans', tags: ['sans', 'sharp'], weight: 800 },
  { value: 'Impact', label: 'Impact', sample: 'BREAKING FAITH', category: 'display', tags: ['display', 'viral'], weight: 900 },
  { value: 'Courier New', label: 'Courier New', sample: 'Psalm 91', category: 'mono', tags: ['mono'], weight: 700 },
];

const inferFontCategory = (family) => {
  const name = String(family || '').toLowerCase();
  if (name.includes('noto') || name.includes('zcool') || name.includes('cang') || name.includes('zheng') || name.includes('sc') || name.includes('tc') || name.includes('jp') || name.includes('kr')) return 'cjk';
  if (name.includes('serif') || name.includes('lora') || name.includes('playfair') || name.includes('bitter') || name.includes('crimson') || name.includes('cormorant')) return 'serif';
  if (name.includes('script') || name.includes('caveat') || name.includes('pacifico') || name.includes('dancing')) return 'script';
  if (name.includes('anton') || name.includes('bebas') || name.includes('display') || name.includes('black') || name.includes('impact') || name.includes('teko') || name.includes('rajdhani') || name.includes('bangers')) return 'display';
  if (name.includes('mono')) return 'mono';
  return 'sans';
};

const fontChoices = computed(() => [
  ...fontPresets,
  ...cloudFonts.value.map((font) => {
    const category = inferFontCategory(font.family);
    return {
      ...font,
      value: font.family,
      label: font.family,
      sample: category === 'cjk' ? '高级字幕预览' : 'Make it unforgettable',
      category,
      tags: ['R2', category],
      weight: category === 'serif' ? 700 : 900,
    };
  }),
]);

const fontCategories = [
  { value: 'all', label: '所有字体' },
  { value: 'display', label: '展示体 / 标题' },
  { value: 'sans', label: '无衬线 Sans' },
  { value: 'serif', label: '衬线 Serif' },
  { value: 'script', label: '手写 Script' },
  { value: 'mono', label: '等宽 Mono' },
  { value: 'cjk', label: '中文/日韩 CJK' },
];

const fontLibraryModal = reactive({
  open: false,
  label: '',
  sample: '',
  value: 'Arial',
  query: '',
  category: 'all',
  apply: null,
});

const filteredFontChoices = computed(() => {
  const query = fontLibraryModal.query.trim().toLowerCase();
  return fontChoices.value.filter((font) => {
    const categoryOk = fontLibraryModal.category === 'all' || font.category === fontLibraryModal.category;
    const haystack = [font.value, font.label, font.sample, ...(font.tags || [])].join(' ').toLowerCase();
    return categoryOk && (!query || haystack.includes(query));
  });
});

const openFontLibraryPicker = (payload) => {
  fontLibraryModal.open = true;
  fontLibraryModal.label = payload.label || '字体';
  fontLibraryModal.sample = payload.sample || 'Make it unforgettable';
  fontLibraryModal.value = payload.value || 'Arial';
  fontLibraryModal.apply = payload.apply;
  fontLibraryModal.query = '';
  if (!cloudFonts.value.length && !fontBusy.value) refreshCloudFonts();
};

const applyFontChoice = async (font) => {
  await ensureCloudFontLoaded(font);
  fontLibraryModal.value = font.value;
  if (fontLibraryModal.apply) fontLibraryModal.apply(font.value);
};

const fontPreviewStyle = (font) => ({
  fontFamily: '"' + (font?.value || 'Arial') + '", Arial, sans-serif',
  fontWeight: font?.weight || 800,
});

const FontPreviewPicker = defineComponent({
  props: { modelValue: String, label: String, sample: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'space-y-2' }, [
      h('div', { class: 'flex items-center justify-between' }, [
        h('span', { class: 'text-xs text-gray-500' }, props.label),
        h('span', { class: 'max-w-[160px] truncate text-[11px] text-cyan-300' }, props.modelValue || 'Arial'),
      ]),
      h('button', {
        type: 'button',
        class: 'w-full rounded border border-[#303648] bg-black/20 p-3 text-left transition hover:border-cyan-400 hover:bg-cyan-400/10',
        onClick: () => openFontLibraryPicker({
          label: props.label,
          sample: props.sample,
          value: props.modelValue || 'Arial',
          apply: (value) => emit('update:modelValue', value),
        }),
      }, [
        h('span', { class: 'block truncate text-[11px] text-gray-500' }, '打开字体库 / 点击选择应用'),
        h('span', {
          class: 'mt-2 block truncate leading-tight text-white',
          style: {
            fontFamily: `"${props.modelValue || 'Arial'}", Arial, sans-serif`,
            fontWeight: 900,
            fontSize: '19px',
            letterSpacing: '0',
          },
        }, props.sample || 'Make it unforgettable'),
      ]),
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
const musicEl = ref(null);
const videoFileInput = ref(null);
const audioFileInput = ref(null);
const showBulkModal = ref(false);
const showSettingsModal = ref(false);
const showTemplateLibrary = ref(false);
const showExportModal = ref(false);
const exportDialogMode = ref('current');
const exportJobs = ref([]);
const isPlaying = ref(false);
const isExporting = ref(false);
const previewTime = ref(0);
const exportedUrl = ref('');
const exportProgress = ref(0);
const exportStatus = ref('准备导出');
const mediaError = ref('');
const driveToken = ref('');
const localMediaBusy = ref(false);
const localMediaStatus = ref('先授权素材路径；普通选择/任务读取都会优先使用旁边已转换 MP4。');
const localMediaItems = ref([]);
const driveBusy = ref(false);
const driveStatus = ref(isGoogleDriveConfigured() ? 'Google Drive 未连接' : '未配置 Google Drive 环境变量');
const mediaPool = ref([]);
const mediaProgress = ref(0);
const mediaEta = ref('');
const localDraftStatus = ref('本地草稿未保存');
let mediaProgressStartedAt = 0;
let localDraftTimer = 0;
const selectedTaskIndex = ref(0);
const overlayState = reactive(createScrollOverlay({
  scroll_title: '',
  content: '1. God walks with me.\n2. God guides my steps.\n3. God has a beautiful plan for me.\n4. I am protected from all evil.\n5. Every challenge is a stepping stone.',
  x: 40,
  y: 800,
  w: 1000,
  h: 800,
  fontsize: 64,
  font_weight: 800,
  font_family: 'Arial Black',
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
  scroll_title_font_family: 'Arial Black',
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
  titleStrokeEnabled: false,
  feather_top: 150,
  feather_bottom: 100,
  feather_top_offset: 0,
  feather_bottom_offset: 0,
  bg_enabled: false,
  bg_color: '#000000',
  bg_opacity: 0,
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
  signature_enabled: false,
  signature_text: '',
  signature_x: 540,
  signature_y: 1640,
  signature_width: 900,
  signature_fontsize: 34,
  signature_font_weight: 700,
  signature_font_family: 'Georgia',
  signature_color: '#FFFFFF',
  signature_align: 'right',
  signature_position: 'top-right',
  signature_case: 'preserve',
  signature_line_spacing: 4,
  signature_stroke_enabled: true,
  signature_stroke_color: '#000000',
  signature_stroke_width: 2,
  signature_shadow_enabled: true,
  signature_shadow_color: '#000000',
  signature_shadow_blur: 5,
  signature_bg_enabled: true,
  signature_bg_color: '#000000',
  signature_bg_opacity: 55,
  signature_bg_radius: 18,
  signature_bg_pad_x: 22,
  signature_bg_pad_y: 12,
  scroll_x_anchor: 'center',
  scroll_from_x: 540,
  scroll_to_x: 540,
  scroll_from_y: 1200,
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
  musicFile: null,
  videoUrl: '',
  audioUrl: '',
  musicUrl: '',
  videoName: '',
  audioName: '',
  musicName: '',
  videoDuration: 0,
  audioDuration: 0,
  musicDuration: 0,
  musicVolume: 30,
  videoAsset: null,
  audioAsset: null,
  musicAsset: null,
  videoDriveItem: null,
  audioDriveItem: null,
});

const exportOptions = reactive({
  durationMode: 'auto',
  customDuration: 15,
  fitMode: 'cover',
  quality: 'ultrafast',
  format: 'webm',
  engine: 'local-fast',
  resolution: '1080x1920',
  customWidth: 1080,
  customHeight: 1920,
  fps: 30,
  customBitrate: 5,
  maxBitrate: 7,
  namingMode: 'date-auto',
  concurrency: 1,
  recycleEvery: 0,
  useGpu: true,
  useMemoryDecoder: true,
  fastAlphaMode: true,
  previewScale: '0.5',
});

const tasks = ref([{ id: 'task_default', baseName: '当前 Reels 任务', overlays: [overlayState], videoName: '', audioName: '', musicName: '', musicVolume: 30, exportStatus: '等待导出', exportProgress: 0 }]);
const cloudOwnerId = ref(localStorage.getItem('videohat_owner_id') || 'local-user');
const cloudStatus = ref('云端未同步');
const cloudBusy = ref(false);
const cloudProjects = ref([]);
const selectedCloudProjectId = ref('');
const currentCloudProjectId = ref('');
const isAdminMode = new URLSearchParams(window.location.search).get('admin') === '1';
const adminToken = ref(localStorage.getItem('videohat_admin_token') || '');
const officialTemplates = ref([]);
const selectedTemplateId = ref('');
const templateTitle = ref('官方 Reels 工程模板');
const templateStatus = ref('读取官方工程模板中...');
const templateBusy = ref(false);
const templateProgress = ref(0);

const exportScopeOptions = [
  { value: 'current', label: '仅当前任务' },
  { value: 'queue', label: '全部任务队列' },
];
const signaturePositionOptions = [
  { value: 'top-right', label: '右上角' },
  { value: 'top-left', label: '左上角' },
  { value: 'bottom-right', label: '右下角' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-center', label: '底部居中' },
  { value: 'custom', label: '自定义坐标' },
];

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
const engineOptions = [
  { value: 'local-fast', label: '本地极速预览导出' },
  { value: 'precise', label: '精确合成（浏览器）' },
  { value: 'pipeline', label: '流水线导出（后端优先）' },
  { value: 'hardware', label: '硬件 H.264（后端优先）' },
];
const qualityOptions = [
  { value: 'ultrafast', label: '极速 2 Mbps' },
  { value: 'low', label: '快速 2.5 Mbps' },
  { value: 'medium', label: '中画质 5 Mbps' },
  { value: 'high', label: '高画质 8 Mbps' },
  { value: 'custom', label: '自定义码率' },
];
const formatOptions = [
  { value: 'webm', label: 'WebM：本地最快' },
  { value: 'mp4', label: 'MP4：浏览器慢转码' },
  { value: 'backend-mp4', label: 'MP4：后端/GPU' },
  { value: 'png-layers', label: 'PNG 分层' },
  { value: 'fcpxml', label: 'FCPXML' },
];
const resolutionOptions = [
  { value: '1080x1920', label: 'Reels 1080 x 1920' },
  { value: '1920x1080', label: '横屏 1920 x 1080' },
  { value: '800x1000', label: '口播 800 x 1000' },
  { value: 'custom', label: '自定义' },
];
const namingModeOptions = [
  { value: 'date-auto', label: '日期自动' },
  { value: 'text', label: '正文开头' },
  { value: 'background', label: '视频名' },
  { value: 'audio', label: '音频名' },
  { value: 'index', label: '序号' },
  { value: 'custom', label: '任务名' },
];
const previewScaleOptions = [
  { value: '0.5', label: '最高流畅 540p' },
  { value: '0.667', label: '均衡清晰 720p' },
  { value: '1', label: '高清预览 1080p' },
];

const exportPlanSummary = computed(() => {
  const scope = exportDialogMode.value === 'queue' ? `${tasks.value.length} 条批量任务` : '当前任务';
  const format = formatOptions.find((option) => option.value === exportOptions.format)?.label || exportOptions.format;
  const engine = engineOptions.find((option) => option.value === exportOptions.engine)?.label || exportOptions.engine;
  const quality = qualityOptions.find((option) => option.value === exportOptions.quality)?.label || exportOptions.quality;
  return `${scope} · ${engine} · ${format} · ${quality}`;
});
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

const borderStyleOptions = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
];

const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1920;

const activeDuration = computed(() => {
  if (exportOptions.durationMode === 'custom') return Math.max(1, exportOptions.customDuration || 1);
  if (exportOptions.durationMode === 'audio') return media.audioDuration || media.videoDuration || 15;
  if (exportOptions.durationMode === 'video') return media.videoDuration || media.audioDuration || 15;
  return media.audioDuration || media.videoDuration || 15;
});
const previewResolution = computed(() => {
  const scale = Number(exportOptions.previewScale) || 0.5;
  return {
    width: Math.max(1, Math.round(EXPORT_WIDTH * scale)),
    height: Math.max(1, Math.round(EXPORT_HEIGHT * scale)),
  };
});
const previewResolutionLabel = computed(() => `${previewResolution.value.width} x ${previewResolution.value.height}`);

let animationFrameId = 0;
let audioContext = null;
let videoSourceNode = null;
let audioSourceNode = null;
let musicSourceNode = null;
let musicGainNode = null;
let audioMonitorGainNode = null;
let musicMonitorGainNode = null;
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

const AUTO_TRANSCODE_WARN_BYTES = 80 * 1024 * 1024;
const AUTO_TRANSCODE_LIMIT_BYTES = 220 * 1024 * 1024;
const LOCAL_PROJECT_DRAFT_KEY = 'videohat_reels_local_project_v1';
const LOCAL_MEDIA_DIR_HANDLE_KEY = 'videohat_local_media_dir_handle_v1';
const LOCAL_MEDIA_FILE_HANDLES_KEY = 'videohat_local_media_file_handles_v1';

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '未知大小';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatEta = (seconds) => {
  const safeSeconds = Math.max(1, Math.round(Number(seconds) || 0));
  if (safeSeconds >= 60) return `${Math.floor(safeSeconds / 60)}分${String(safeSeconds % 60).padStart(2, '0')}秒`;
  return `${safeSeconds}秒`;
};

const resetMediaProgress = () => {
  mediaProgress.value = 0;
  mediaEta.value = '';
  mediaProgressStartedAt = performance.now();
};

const updateMediaProgress = (progress, status, fileName = '') => {
  const numeric = Number.isFinite(progress) ? progress : 0;
  const clamped = Math.max(0, Math.min(1, numeric));
  mediaProgress.value = clamped;
  const elapsed = (performance.now() - mediaProgressStartedAt) / 1000;
  const remaining = clamped > 0.03 && clamped < 0.99 ? Math.max(1, (elapsed / clamped) - elapsed) : 0;
  mediaEta.value = remaining ? `预计剩余 ${formatEta(remaining)}` : '';
  const pct = `${Math.round(clamped * 100)}%`;
  const eta = mediaEta.value ? ` · ${mediaEta.value}` : '';
  mediaError.value = `${status} ${pct}${eta}${fileName ? `：${fileName}` : ''}`;
};

let localMediaDirectoryHandle = null;
let localMediaFileHandles = { video: null, audio: null };
const videoExtensions = new Set(['.mp4', '.mov', '.m4v', '.webm', '.quicktime']);
const audioExtensions = new Set(['.mp3', '.m4a', '.wav', '.aac', '.ogg']);
const cacheSuffix = '.videohat-preview.mp4';

const fileExtension = (name) => {
  const index = String(name || '').lastIndexOf('.');
  return index >= 0 ? String(name).slice(index).toLowerCase() : '';
};

const cacheNameFor = (name) => String(name || 'video').replace(/\.[^.]+$/, '') + cacheSuffix;

const isPreviewCacheName = (name) => String(name || '').endsWith(cacheSuffix);

const ensureFileHandlePermission = async (handle, mode = 'read') => {
  if (!handle) return false;
  const options = { mode };
  if ((await handle.queryPermission(options)) === 'granted') return true;
  return (await handle.requestPermission(options)) === 'granted';
};

const loadLocalMediaFileHandles = async () => {
  localMediaFileHandles = await localforage.getItem(LOCAL_MEDIA_FILE_HANDLES_KEY)
    || { video: null, audio: null };
};

const saveLocalMediaFileHandle = async (kind, handle) => {
  if (!handle) return;
  localMediaFileHandles = {
    ...localMediaFileHandles,
    [kind]: { name: handle.name, handle },
  };
  await localforage.setItem(LOCAL_MEDIA_FILE_HANDLES_KEY, localMediaFileHandles).catch((error) => {
    console.warn('[local media handle] save failed', error);
  });
};

const ensureLocalFolderPermission = async (mode = 'readwrite') => {
  if (!localMediaDirectoryHandle) throw new Error('请先选择素材文件夹');
  const options = { mode };
  if ((await localMediaDirectoryHandle.queryPermission(options)) === 'granted') return true;
  return (await localMediaDirectoryHandle.requestPermission(options)) === 'granted';
};

const hasFileInLocalFolder = async (name) => {
  if (!localMediaDirectoryHandle) return false;
  try {
    await localMediaDirectoryHandle.getFileHandle(name);
    return true;
  } catch (_) {
    return false;
  }
};


const readFileFromLocalFolder = async (name) => {
  if (!localMediaDirectoryHandle || !name) return null;
  try {
    if (!(await ensureLocalFolderPermission('readwrite'))) return null;
    const handle = await localMediaDirectoryHandle.getFileHandle(name);
    return handle.getFile();
  } catch (_) {
    return null;
  }
};

const mergeLocalMediaItems = (...groups) => {
  const keyed = new Map();
  groups.flat().filter(Boolean).forEach((item) => {
    const key = `${item.kind}:${item.name}`;
    keyed.set(key, {
      ...keyed.get(key),
      ...item,
      cacheName: item.cacheName || keyed.get(key)?.cacheName || '',
    });
  });
  return [...keyed.values()].sort((a, b) => a.name.localeCompare(b.name));
};

const findLocalMediaItem = (name) => localMediaItems.value.find((item) => item.name === name || item.cacheName === name) || null;

const rememberLocalMediaItem = async (file, kind, cacheName = '') => {
  if (!localMediaDirectoryHandle || !file?.name) return;
  const sourceName = isPreviewCacheName(file.name) ? file.name.replace(cacheSuffix, '') : file.name;
  const existing = findLocalMediaItem(sourceName);
  const next = {
    provider: 'local-folder',
    kind,
    name: sourceName,
    cacheName: cacheName || existing?.cacheName || (kind === 'video' && await hasFileInLocalFolder(cacheNameFor(sourceName)) ? cacheNameFor(sourceName) : ''),
  };
  const others = localMediaItems.value.filter((item) => item.name !== next.name);
  localMediaItems.value = [...others, next].sort((a, b) => a.name.localeCompare(b.name));
};

const resolveLocalPreviewCache = async (file, kind) => {
  if (kind !== 'video' || !localMediaDirectoryHandle || !file?.name || isPreviewCacheName(file.name)) return null;
  const cacheName = cacheNameFor(file.name);
  const cached = await readFileFromLocalFolder(cacheName);
  if (!cached) return null;
  await rememberLocalMediaItem(file, kind, cacheName);
  return {
    file: cached,
    displayName: `${file.name} -> 已转换 MP4`,
    sourceName: file.name,
    cacheName,
  };
};

const scanLocalMediaDirectory = async () => {
  localMediaBusy.value = true;
  try {
    if (!(await ensureLocalFolderPermission('readwrite'))) throw new Error('没有文件夹读写授权');
    const items = [];
    for await (const [name, handle] of localMediaDirectoryHandle.entries()) {
      if (handle.kind !== 'file' || isPreviewCacheName(name)) continue;
      const ext = fileExtension(name);
      const kind = videoExtensions.has(ext) ? 'video' : (audioExtensions.has(ext) ? 'audio' : '');
      if (!kind) continue;
      const cacheName = kind === 'video' ? cacheNameFor(name) : '';
      items.push({
        provider: 'local-folder',
        kind,
        name,
        cacheName: kind === 'video' && await hasFileInLocalFolder(cacheName) ? cacheName : '',
      });
    }
    localMediaItems.value = mergeLocalMediaItems(localMediaItems.value, items);
    localMediaStatus.value = `已读取 ${items.length} 个本地素材；视频会优先使用旁边的已转换 MP4。`;
  } catch (error) {
    console.error(error);
    localMediaStatus.value = `本地素材文件夹读取失败：${error.message}`;
  } finally {
    localMediaBusy.value = false;
  }
};

const selectLocalMediaFolder = async () => {
  if (!window.showDirectoryPicker) {
    localMediaStatus.value = '当前浏览器不支持文件夹读写授权，请使用 Chrome 或 Edge。';
    return;
  }
  localMediaBusy.value = true;
  try {
    localMediaDirectoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await localforage.setItem(LOCAL_MEDIA_DIR_HANDLE_KEY, localMediaDirectoryHandle);
    await scanLocalMediaDirectory();
    await rehydrateSelectedTaskMediaFromLocalFolder();
  } catch (error) {
    if (error?.name !== 'AbortError') localMediaStatus.value = `选择素材文件夹失败：${error.message}`;
  } finally {
    localMediaBusy.value = false;
  }
};

const restoreLocalMediaFolder = async () => {
  localMediaBusy.value = true;
  try {
    localMediaDirectoryHandle = await localforage.getItem(LOCAL_MEDIA_DIR_HANDLE_KEY);
    if (!localMediaDirectoryHandle) {
      localMediaStatus.value = '还没有保存过素材文件夹授权，请先点“授权素材路径”。';
      return;
    }
    await scanLocalMediaDirectory();
    await rehydrateSelectedTaskMediaFromLocalFolder();
  } catch (error) {
    console.error(error);
    localMediaStatus.value = `恢复素材文件夹失败：${error.message}`;
  } finally {
    localMediaBusy.value = false;
  }
};

const autoRestoreLocalMediaFolder = async () => {
  localMediaBusy.value = true;
  try {
    localMediaDirectoryHandle = await localforage.getItem(LOCAL_MEDIA_DIR_HANDLE_KEY);
    if (!localMediaDirectoryHandle) {
      localMediaStatus.value = '首次使用请点“授权素材路径”；浏览器不允许网页自动弹出文件夹选择。';
      return;
    }

    const permission = await localMediaDirectoryHandle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') {
      await scanLocalMediaDirectory();
      await rehydrateSelectedTaskMediaFromLocalFolder();
      return;
    }

    const requested = await localMediaDirectoryHandle
      .requestPermission({ mode: 'readwrite' })
      .catch(() => 'prompt');

    if (requested === 'granted') {
      await scanLocalMediaDirectory();
      await rehydrateSelectedTaskMediaFromLocalFolder();
    } else {
      localMediaStatus.value = '已找到上次素材路径记录；浏览器需要你点一次“恢复”完成授权。';
    }
  } catch (error) {
    console.error(error);
    localMediaStatus.value = `自动恢复素材路径失败：${error.message}`;
  } finally {
    localMediaBusy.value = false;
  }
};

const writeConvertedCache = async (sourceName, convertedFile) => {
  if (!localMediaDirectoryHandle || !sourceName || !convertedFile) return '';
  if (!(await ensureLocalFolderPermission('readwrite'))) return '';
  const cacheName = cacheNameFor(sourceName);
  const handle = await localMediaDirectoryHandle.getFileHandle(cacheName, { create: true });
  const writable = await handle.createWritable();
  await writable.write(convertedFile);
  await writable.close();
  return cacheName;
};

const useLocalMediaForCurrent = async (item) => {
  if (!localMediaDirectoryHandle) return;
  localMediaBusy.value = true;
  try {
    if (!(await ensureLocalFolderPermission('readwrite'))) throw new Error('没有文件夹读写授权');
    let fileName = item.name;
    let displayName = item.name;
    if (item.kind === 'video') {
      const cacheName = item.cacheName || cacheNameFor(item.name);
      if (await hasFileInLocalFolder(cacheName)) {
        fileName = cacheName;
        displayName = `${item.name} -> 已转换 MP4`;
      }
    }
    const fileHandle = await localMediaDirectoryHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    await processMediaFile(file, item.kind, {
      displayName,
      convertedDisplayName: `${item.name} -> 已转换 MP4`,
      onConverted: async (converted) => {
        if (item.kind !== 'video') return;
        const cacheName = await writeConvertedCache(item.name, converted);
        if (cacheName) {
          item.cacheName = cacheName;
          localMediaStatus.value = `已写入旁路 MP4 缓存：${cacheName}`;
          await scanLocalMediaDirectory();
        }
      },
    });
    localMediaStatus.value = `已用于当前任务：${displayName}`;
  } catch (error) {
    console.error(error);
    localMediaStatus.value = `读取本地素材失败：${error.message}`;
  } finally {
    localMediaBusy.value = false;
  }
};
const applyTextCase = (value, mode = 'preserve') => {
  const text = String(value || '');
  if (mode === 'upper') return text.toUpperCase();
  if (mode === 'lower') return text.toLowerCase();
  return text;
};

const centerOverlayDefaults = () => {
  overlayState.x = 40;
  overlayState.y = 800;
  overlayState.w = 1000;
  overlayState.h = 800;
  overlayState.text_align = 'center';
  overlayState.align = 'center';
  overlayState.scroll_title_align = 'center';
  overlayState.scroll_x_anchor = 'center';
  overlayState.text_width = 900;
  overlayState.scroll_title_text_width = 860;
  overlayState.scroll_from_x = 540;
  overlayState.scroll_to_x = 540;
  overlayState.scroll_from_y = 1200;
  overlayState.scroll_to_y = -200;
  overlayState.scroll_offset_x = 0;
  overlayState.scroll_offset_y = 0;
  overlayState.scroll_title_x = 540;
  overlayState.scroll_title_y = 400;
  overlayState.scroll_title = '';
  overlayState.titleStrokeEnabled = false;
  overlayState.bg_enabled = false;
  overlayState.bg_opacity = 0;
  overlayState.bg_border_enabled = false;
  overlayState.signature_enabled = false;
  overlayState.signature_text = '';
  overlayState.signature_position = 'top-right';
  overlayState.signature_x = 980;
  overlayState.signature_y = 115;
  overlayState.signature_width = 420;
  overlayState.feather_top_offset = 0;
  overlayState.feather_bottom_offset = 0;
};




const normalizeOriginalMediaName = (name) => String(name || '')
  .replace(/ -> 已转换 MP4$/, '')
  .replace(/ -> 预览代理 MP4$/, '')
  .replace(cacheSuffix, '');

const findLocalItemForTask = (name, kind) => {
  const normalized = normalizeOriginalMediaName(name);
  return localMediaItems.value.find((item) => item.kind === kind && (item.name === normalized || item.cacheName === normalized || item.name === name || item.cacheName === name)) || null;
};

const hydrateNamedLocalMedia = async (name, kind) => {
  if (!name) return false;
  const normalized = normalizeOriginalMediaName(name);
  const saved = localMediaFileHandles?.[kind];
  if (saved?.handle && normalizeOriginalMediaName(saved.name) === normalized) {
    const granted = await ensureFileHandlePermission(saved.handle, 'read').catch(() => false);
    if (granted) {
      const file = await saved.handle.getFile();
      await processMediaFile(file, kind, {
        displayName: file.name,
        sourceName: file.name,
        persistentFileHandle: true,
      });
      return true;
    }
    localDraftStatus.value = '已找到本地文件授权记录，但浏览器需要你重新点一次选择文件。';
  }

  if (!localMediaDirectoryHandle) return false;
  const item = findLocalItemForTask(name, kind);
  if (item) {
    await useLocalMediaForCurrent(item);
    return true;
  }

  const candidates = kind === 'video' ? [cacheNameFor(normalized), normalized] : [normalized];
  for (const fileName of candidates) {
    const file = await readFileFromLocalFolder(fileName);
    if (!file) continue;
    await processMediaFile(file, kind, {
      displayName: kind === 'video' && isPreviewCacheName(fileName) ? `${normalized} -> 已转换 MP4` : normalized,
      sourceName: normalized,
      ignoreLocalCache: isPreviewCacheName(fileName),
    });
    return true;
  }
  return false;
};

const hydrateTaskMediaFromLocalFolder = async (task) => {
  if (!task) return;
  if (!task.videoUrl && task.videoName) await hydrateNamedLocalMedia(task.videoName, 'video');
  if (!task.audioUrl && task.audioName) await hydrateNamedLocalMedia(task.audioName, 'audio');
};
const syncSelectedTask = () => {
  const current = tasks.value[selectedTaskIndex.value];
  if (!current) return;
  current.overlays = [JSON.parse(JSON.stringify(overlayState))];
  current.videoName = media.videoName;
  current.audioName = media.audioName;
  current.musicName = media.musicName;
  current.videoUrl = media.videoUrl;
  current.audioUrl = media.audioUrl;
  current.musicUrl = media.musicUrl;
  current.videoDuration = media.videoDuration;
  current.audioDuration = media.audioDuration;
  current.musicDuration = media.musicDuration;
  current.musicVolume = media.musicVolume;
  current.videoFile = media.videoFile;
  current.audioFile = media.audioFile;
  current.musicFile = media.musicFile;
  current.videoAsset = media.videoAsset;
  current.audioAsset = media.audioAsset;
  current.musicAsset = media.musicAsset;
  current.videoDriveItem = media.videoDriveItem;
  current.audioDriveItem = media.audioDriveItem;
};

const resetMediaElement = (element) => {
  if (!element) return;
  element.pause();
  element.removeAttribute('src');
  element.load();
};

const applyTaskToEditor = async (task) => {
  if (!task) return;
  resetMediaElement(videoEl.value);
  resetMediaElement(audioEl.value);
  resetMediaElement(musicEl.value);
  Object.assign(overlayState, createScrollOverlay(task.overlays?.[0] || {}));
  media.videoFile = task.videoFile || null;
  media.audioFile = task.audioFile || null;
  media.musicFile = task.musicFile || null;
  media.videoUrl = task.videoUrl || '';
  media.audioUrl = task.audioUrl || '';
  media.musicUrl = task.musicUrl || '';
  media.videoName = task.videoName || '';
  media.audioName = task.audioName || '';
  media.musicName = task.musicName || '';
  media.videoDuration = task.videoDuration || 0;
  media.audioDuration = task.audioDuration || 0;
  media.musicDuration = task.musicDuration || 0;
  media.musicVolume = Number.isFinite(Number(task.musicVolume)) ? Number(task.musicVolume) : media.musicVolume;
  media.videoAsset = task.videoAsset || null;
  media.audioAsset = task.audioAsset || null;
  media.musicAsset = task.musicAsset || null;
  media.videoDriveItem = task.videoDriveItem || null;
  media.audioDriveItem = task.audioDriveItem || null;
  if (!media.videoUrl && media.videoAsset?.objectKey) media.videoUrl = assetUrl(media.videoAsset.ownerId || cloudOwnerId.value, media.videoAsset.objectKey);
  if (!media.audioUrl && media.audioAsset?.objectKey) media.audioUrl = assetUrl(media.audioAsset.ownerId || cloudOwnerId.value, media.audioAsset.objectKey);
  if (!media.musicUrl && media.musicAsset?.objectKey) media.musicUrl = assetUrl(media.musicAsset.ownerId || cloudOwnerId.value, media.musicAsset.objectKey);
  if ((!media.videoUrl && media.videoName) || (!media.audioUrl && media.audioName)) await hydrateTaskMediaFromLocalFolder(task);
  task.videoUrl = media.videoUrl;
  task.audioUrl = media.audioUrl;
  task.musicUrl = media.musicUrl;
  task.videoFile = media.videoFile;
  task.audioFile = media.audioFile;
  task.musicFile = media.musicFile;
  await nextTick();
  if (videoEl.value && media.videoUrl) {
    videoEl.value.preload = 'auto';
    videoEl.value.src = media.videoUrl;
    videoEl.value.loop = true;
    videoEl.value.muted = true;
    videoEl.value.load();
    await waitForMetadata(videoEl.value);
    media.videoDuration = Number.isFinite(videoEl.value.duration) ? videoEl.value.duration : media.videoDuration;
    task.videoDuration = media.videoDuration;
    await waitForVideoFrameReady(videoEl.value, 15000);
  }
  if (audioEl.value && media.audioUrl) {
    audioEl.value.preload = 'metadata';
    audioEl.value.src = media.audioUrl;
    audioEl.value.load();
    await waitForMetadata(audioEl.value);
    media.audioDuration = Number.isFinite(audioEl.value.duration) ? audioEl.value.duration : media.audioDuration;
    task.audioDuration = media.audioDuration;
  }
  if (musicEl.value && media.musicUrl) {
    musicEl.value.preload = 'metadata';
    musicEl.value.loop = true;
    musicEl.value.src = media.musicUrl;
    musicEl.value.load();
    await waitForMetadata(musicEl.value, 12000);
    media.musicDuration = Number.isFinite(musicEl.value.duration) ? musicEl.value.duration : 0;
    task.musicDuration = media.musicDuration;
  } else if (musicEl.value) {
    musicEl.value.pause();
    musicEl.value.removeAttribute('src');
    musicEl.value.load();
  }
  previewTime.value = 0;
  drawPreview();
};

const rehydrateSelectedTaskMediaFromLocalFolder = async () => {
  const task = tasks.value[selectedTaskIndex.value];
  if (!task) return false;
  const hadVideo = Boolean(media.videoUrl);
  const hadAudio = Boolean(media.audioUrl);
  await hydrateTaskMediaFromLocalFolder(task);
  const restored = (!hadVideo && Boolean(media.videoUrl)) || (!hadAudio && Boolean(media.audioUrl));
  if (restored) {
    await nextTick();
    drawPreview();
    syncSelectedTask();
    scheduleLocalProjectSave();
    localDraftStatus.value = '素材已从本地文件夹重新挂载，预览已恢复。';
  }
  return restored;
};

const selectTask = async (index) => {
  stopPlayback();
  syncSelectedTask();
  selectedTaskIndex.value = index;
  await applyTaskToEditor(tasks.value[index]);
  drawPreview();
  scheduleLocalProjectSave();
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
    musicName: media.musicName,
    videoDuration: media.videoDuration,
    audioDuration: media.audioDuration,
    musicDuration: media.musicDuration,
    musicVolume: media.musicVolume,
    videoAsset: media.videoAsset,
    audioAsset: media.audioAsset,
    musicAsset: media.musicAsset,
    videoDriveItem: media.videoDriveItem,
    audioDriveItem: media.audioDriveItem,
    exportStatus: '等待导出',
    exportProgress: 0,
  });
  selectedTaskIndex.value = tasks.value.length - 1;
};

const clearQueue = () => {
  if (!window.confirm('清空全部任务队列？')) return;
  tasks.value = [{ id: 'task_default', baseName: '当前 Reels 任务', overlays: [JSON.parse(JSON.stringify(overlayState))], videoName: media.videoName, audioName: media.audioName, videoUrl: media.videoUrl, audioUrl: media.audioUrl, videoFile: media.videoFile, audioFile: media.audioFile, videoAsset: media.videoAsset, audioAsset: media.audioAsset, exportStatus: '等待导出', exportProgress: 0 }];
  selectedTaskIndex.value = 0;
};

const attachVideoFile = async (file, displayName = file.name) => {
  const [path] = WebAssetPool.registerFiles([file]);
  const url = WebAssetPool.getUrl(path);
  media.videoFile = file;
  media.videoUrl = url;
  media.videoName = displayName;
  videoEl.value.preload = 'auto';
  videoEl.value.src = url;
  videoEl.value.loop = true;
  videoEl.value.muted = true;
  videoEl.value.load();
  const result = await waitForMetadata(videoEl.value, 8000);
  media.videoDuration = Number.isFinite(videoEl.value.duration) ? videoEl.value.duration : 0;
  if (result.ok && media.videoDuration && videoEl.value.videoWidth) {
    const frameReady = await waitForVideoFrameReady(videoEl.value, 8000);
    media.videoAsset = null;
    return frameReady.ok;
  }
  media.videoAsset = null;
  return false;
};

const clearVideoFile = () => {
  media.videoFile = null;
  media.videoUrl = '';
  media.videoName = '';
  media.videoDuration = 0;
  media.videoAsset = null;
  videoEl.value.removeAttribute('src');
  videoEl.value.load();
};

const likelyNeedsPreviewProxy = (file) => {
  if (!file) return false;
  const ext = fileExtension(file.name);
  return ['.mov', '.m4v', '.quicktime'].includes(ext) || file.size > AUTO_TRANSCODE_WARN_BYTES;
};

const ensureLocalFolderForSelectedVideo = async (file) => {
  if (!file || localMediaDirectoryHandle || !window.showDirectoryPicker || !likelyNeedsPreviewProxy(file)) return;
  localMediaStatus.value = '检测到这个视频可能需要转换，请授权素材所在文件夹，用来读取/写入旁路 MP4 缓存。';
  try {
    await selectLocalMediaFolder();
  } catch (error) {
    console.error(error);
  }
};

const processMediaFile = async (file, kind, options = {}) => {
  if (!file) return;
  const sourceName = options.sourceName || file.name;
  const cached = await resolveLocalPreviewCache(file, kind);
  if (cached && !options.ignoreLocalCache) {
    localMediaStatus.value = `命中旁路 MP4 缓存：${cached.cacheName}`;
    return processMediaFile(cached.file, kind, {
      ...options,
      displayName: cached.displayName,
      sourceName: cached.sourceName,
      ignoreLocalCache: true,
    });
  }
  const displayName = options.displayName || file.name;
  resetMediaProgress();
  updateMediaProgress(0.02, kind === 'video' ? '读取本地实拍素材' : '读取本地音频', file.name);

  if (kind === 'video') {
    media.videoName = displayName;
    await rememberLocalMediaItem({ name: sourceName }, kind);
    let loaded = await attachVideoFile(file, displayName);
    let transcodeError = '';
    if (!loaded) {
      clearVideoFile();
      const fileSize = formatFileSize(file.size);
      if (file.size > AUTO_TRANSCODE_LIMIT_BYTES) {
        transcodeError = `文件 ${fileSize}，超过浏览器安全转码上限`;
        mediaProgress.value = 0;
      } else if (file.size > AUTO_TRANSCODE_WARN_BYTES && !window.confirm(`这个实拍素材有 ${fileSize}，浏览器内转码可能会卡几分钟。继续尝试转换吗？`)) {
        transcodeError = '已取消浏览器内转码';
        mediaProgress.value = 0;
      } else {
        updateMediaProgress(0.08, '浏览器无法直接预览，开始生成轻量预览代理', file.name);
        try {
          const converted = await transcodeInputVideoToMp4(file, {
            previewProxy: true,
            onProgress: (progress, status) => updateMediaProgress(progress, status, file.name),
          });
          updateMediaProgress(0.98, '挂载预览代理', converted.name);
          loaded = await attachVideoFile(converted, `${file.name} -> 预览代理 MP4`);
          if (loaded) {
            const cacheName = await writeConvertedCache(sourceName, converted);
            if (cacheName) {
              await rememberLocalMediaItem({ name: sourceName }, 'video', cacheName);
              localMediaStatus.value = `已写入旁路 MP4 缓存：${cacheName}`;
            }
          }
          if (!loaded) transcodeError = '预览代理 MP4 仍无法被浏览器读取';
        } catch (error) {
          console.error(error);
          transcodeError = error?.message || '转码器执行失败';
          loaded = false;
        }
      }
    }
    if (!loaded) {
      mediaProgress.value = 0;
      mediaEta.value = '';
      mediaError.value = `暂时无法解码这个视频：${file.name}。${transcodeError ? `原因：${transcodeError}。` : ''}这类 MOV/HEVC 在浏览器里经常不能直接预览；请先转成 H.264 + AAC 的 MP4，或等待后端 FFmpeg/GPU 导出服务接入。`;
      clearVideoFile();
    } else {
      updateMediaProgress(1, media.videoName.includes('预览代理') ? '预览代理已就绪' : '本地实拍素材已就绪', file.name);
      if (media.videoName.includes('预览代理')) mediaError.value += '。高清成片请走后端 FFmpeg/GPU 导出。';
    }
  } else {
    const [path] = WebAssetPool.registerFiles([file]);
    const url = WebAssetPool.getUrl(path);
    await rememberLocalMediaItem({ name: sourceName }, kind);
    media.audioFile = file;
    media.audioUrl = url;
    media.audioName = displayName;
    media.audioAsset = null;
    audioEl.value.preload = 'metadata';
    audioEl.value.src = url;
    audioEl.value.load();
    updateMediaProgress(0.35, '读取音频时长', file.name);
    const result = await waitForMetadata(audioEl.value, 12000);
    media.audioDuration = Number.isFinite(audioEl.value.duration) ? audioEl.value.duration : 0;
    if (!result.ok || !media.audioDuration) {
      mediaProgress.value = 0;
      mediaEta.value = '';
      mediaError.value = `浏览器无法读取这个音频：${file.name}。请换成 MP3、M4A 或 WAV。`;
      media.audioUrl = '';
      media.audioName = '';
      media.audioDuration = 0;
      audioEl.value.removeAttribute('src');
      audioEl.value.load();
    } else {
      updateMediaProgress(1, '音频已就绪', file.name);
    }
  }

  previewTime.value = 0;
  syncSelectedTask();
  scheduleLocalProjectSave();
  drawPreview();

};

const chooseLocalMedia = async (kind) => {
  const input = kind === 'video' ? videoFileInput.value : audioFileInput.value;
  if (!window.showOpenFilePicker) {
    input?.click();
    return;
  }

  try {
    const accept = kind === 'video'
      ? { 'video/*': ['.mp4', '.mov', '.m4v', '.webm'] }
      : { 'audio/*': ['.mp3', '.m4a', '.wav', '.aac', '.ogg'] };
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [{ description: kind === 'video' ? 'VideoHat 视频素材' : 'VideoHat 音频素材', accept }],
    });
    if (!handle) return;
    await saveLocalMediaFileHandle(kind, handle);
    const file = await handle.getFile();
    if (kind === 'video') await ensureLocalFolderForSelectedVideo(file);
    await processMediaFile(file, kind, { sourceName: file.name, persistentFileHandle: true });
    localDraftStatus.value = `${kind === 'video' ? '视频' : '音频'}文件授权已保存，刷新后会尝试自动恢复。`;
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error(error);
      mediaError.value = `选择本地${kind === 'video' ? '视频' : '音频'}失败：${error.message}`;
    }
  }
};

const loadMedia = async (event, kind) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (kind === 'video') await ensureLocalFolderForSelectedVideo(file);
  await processMediaFile(file, kind, { sourceName: file?.name });
};

const ensureDriveToken = async () => {
  if (driveToken.value) return driveToken.value;
  driveStatus.value = '等待 Google 授权...';
  driveToken.value = await requestDriveToken({ prompt: 'consent' });
  driveStatus.value = 'Google Drive 已连接';
  return driveToken.value;
};

const connectGoogleDrive = async () => {
  driveBusy.value = true;
  try {
    await ensureDriveToken();
  } catch (error) {
    console.error(error);
    driveStatus.value = `Google Drive 连接失败：${error.message}`;
  } finally {
    driveBusy.value = false;
  }
};

const mergeMediaPool = (items) => {
  const keyed = new Map(mediaPool.value.map((item) => [`${item.provider}:${item.id}`, item]));
  items.forEach((item) => keyed.set(`${item.provider}:${item.id}`, item));
  mediaPool.value = Array.from(keyed.values());
};

const pickGoogleDriveMedia = async (kind) => {
  driveBusy.value = true;
  try {
    const token = await ensureDriveToken();
    const picked = await openDrivePicker({ token, kind });
    if (picked.length) {
      mergeMediaPool(picked);
      driveStatus.value = `已加入 ${picked.length} 个 Google Drive ${kind === 'video' ? '视频' : '音频'}到媒体池`;
      scheduleLocalProjectSave();
    } else {
      driveStatus.value = '没有选择文件';
    }
  } catch (error) {
    console.error(error);
    driveStatus.value = `选择 Google Drive 素材失败：${error.message}`;
  } finally {
    driveBusy.value = false;
  }
};

const removeMediaPoolItem = (item) => {
  mediaPool.value = mediaPool.value.filter((candidate) => !(candidate.provider === item.provider && candidate.id === item.id));
  scheduleLocalProjectSave();
};

const useDriveMediaForCurrent = async (item) => {
  driveBusy.value = true;
  resetMediaProgress();
  updateMediaProgress(0.02, '准备读取 Google Drive 素材', item.name);
  try {
    const token = await ensureDriveToken();
    const file = await downloadDriveFile(item, token, (progress, status) => {
      updateMediaProgress(0.02 + Math.min(0.68, progress * 0.68), status, item.name);
    });
    await processMediaFile(file, item.kind);
    if (item.kind === 'video') media.videoDriveItem = item;
    else media.audioDriveItem = item;
    syncSelectedTask();
    scheduleLocalProjectSave();
    driveStatus.value = `已用于当前任务：${item.name}`;
  } catch (error) {
    console.error(error);
    mediaProgress.value = 0;
    mediaEta.value = '';
    mediaError.value = `Google Drive 素材读取失败：${error.message}`;
    driveStatus.value = mediaError.value;
  } finally {
    driveBusy.value = false;
  }
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

const waitForVideoFrameReady = (video, timeoutMs = 30000) => new Promise((resolve) => {
  if (!video) {
    resolve({ ok: false, reason: 'missing-video' });
    return;
  }
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth) {
    resolve({ ok: true });
    return;
  }

  let settled = false;
  let timer = 0;
  let frameHandle = 0;
  const finish = (result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    video.onloadeddata = null;
    video.oncanplay = null;
    video.onseeked = null;
    video.onerror = null;
    if (frameHandle && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameHandle);
    resolve(result);
  };
  const ready = () => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth) finish({ ok: true });
  };

  timer = window.setTimeout(() => finish({ ok: false, reason: 'timeout' }), timeoutMs);
  video.onloadeddata = ready;
  video.oncanplay = ready;
  video.onseeked = ready;
  video.onerror = () => finish({ ok: false, reason: 'decode' });
  if (video.requestVideoFrameCallback) frameHandle = video.requestVideoFrameCallback(() => finish({ ok: true }));
});

const waitForNextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

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

const wrapCanvasText = (ctx, text, maxWidth) => {
  const rawLines = String(text || '').split(/\r?\n/);
  const lines = [];
  rawLines.forEach((rawLine) => {
    const words = rawLine.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      return;
    }
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !current) {
        current = next;
      } else {
        lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
  });
  return lines;
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, r);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
};

const drawSignature = (ctx) => {
  if (!overlayState.signature_enabled) return;
  const text = applyTextCase(overlayState.signature_text, overlayState.signature_case).trim();
  if (!text) return;

  const fontSize = Number(overlayState.signature_fontsize) || 34;
  const fontWeight = Number(overlayState.signature_font_weight) || 700;
  const width = Math.max(40, Number(overlayState.signature_width) || 900);
  const x = Number(overlayState.signature_x) || EXPORT_WIDTH / 2;
  const y = Number(overlayState.signature_y) || 1640;
  const lineHeight = fontSize * 1.25 + (Number(overlayState.signature_line_spacing) || 0);
  const boxX = x - width / 2;
  const align = overlayState.signature_align || 'center';

  ctx.save();
  const fontFamily = overlayState.signature_font_family || 'Arial';
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", Arial, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  const lines = wrapCanvasText(ctx, text, width);
  const measuredLines = lines.map((line) => ctx.measureText(line).width);
  const textW = Math.max(1, ...measuredLines);
  const textH = Math.max(fontSize, (lines.length - 1) * lineHeight + fontSize * 1.15);
  const padX = Number(overlayState.signature_bg_pad_x) || 0;
  const padY = Number(overlayState.signature_bg_pad_y) || 0;
  let contentX = boxX;
  if (align === 'center' || align === 'justify') contentX = x - textW / 2;
  if (align === 'right') contentX = boxX + width - textW;

  if (overlayState.signature_bg_enabled && Number(overlayState.signature_bg_opacity) > 0) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, Number(overlayState.signature_bg_opacity) / 100));
    ctx.fillStyle = overlayState.signature_bg_color || '#000000';
    drawRoundedRect(ctx, contentX - padX, y - padY, textW + padX * 2, textH + padY * 2, Number(overlayState.signature_bg_radius) || 0);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = overlayState.signature_color || '#FFFFFF';
  if (overlayState.signature_shadow_enabled) {
    ctx.shadowColor = overlayState.signature_shadow_color || '#000000';
    ctx.shadowBlur = Number(overlayState.signature_shadow_blur) || 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.08));
  }
  lines.forEach((line, index) => {
    const measured = ctx.measureText(line).width;
    let lineX = boxX;
    if (align === 'center' || align === 'justify') lineX = boxX + (width - measured) / 2;
    if (align === 'right') lineX = boxX + width - measured;
    const lineY = y + index * lineHeight;
    if (overlayState.signature_stroke_enabled && Number(overlayState.signature_stroke_width) > 0) {
      ctx.strokeStyle = overlayState.signature_stroke_color || '#000000';
      ctx.lineWidth = Number(overlayState.signature_stroke_width) || 2;
      ctx.strokeText(line, lineX, lineY);
    }
    ctx.fillText(line, lineX, lineY);
  });
  ctx.restore();
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

const setCanvasResolution = (fullResolution = false) => {
  const canvas = previewCanvas.value;
  if (!canvas) return 1;
  const scale = fullResolution ? 1 : (Number(exportOptions.previewScale) || 0.5);
  const width = Math.max(1, Math.round(EXPORT_WIDTH * scale));
  const height = Math.max(1, Math.round(EXPORT_HEIGHT * scale));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  return scale;
};

const drawPreview = ({ fullResolution = false } = {}) => {
  const canvas = previewCanvas.value;
  if (!canvas) return;
  const scale = setCanvasResolution(fullResolution || wasExporting);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = scale < 1 ? 'medium' : 'high';
  if (scale !== 1) ctx.scale(scale, scale);

  const renderCanvas = { width: EXPORT_WIDTH, height: EXPORT_HEIGHT };
  drawVideoBackground(ctx, renderCanvas, videoEl.value);

  const overlayForRender = normalizeOverlayForNative();
  const needsFallbackRenderer = overlayForRender.text_align === 'justify' || overlayForRender.scroll_title_align === 'justify';
  try {
    if (needsFallbackRenderer) {
      drawScrollOverlay(ctx, overlayForRender, previewTime.value, EXPORT_WIDTH, EXPORT_HEIGHT);
    } else {
      ReelsOverlay.drawOverlay(ctx, overlayForRender, previewTime.value, EXPORT_WIDTH, EXPORT_HEIGHT);
    }
  } catch (error) {
    console.warn('[ReelsOverlay] fallback renderer:', error);
    drawScrollOverlay(ctx, overlayForRender, previewTime.value, EXPORT_WIDTH, EXPORT_HEIGHT);
  } finally {
    drawSignature(ctx);
    ctx.restore();
  }
};
const renderLoop = () => {
  if (isPlaying.value && !wasExporting) {
    previewTime.value = media.audioUrl && audioEl.value ? audioEl.value.currentTime : (videoEl.value?.currentTime || previewTime.value);
    if (previewTime.value >= activeDuration.value) stopPlayback();
    drawPreview();
  }
  animationFrameId = requestAnimationFrame(renderLoop);
};

const seekPreview = () => {
  const t = Math.min(previewTime.value, activeDuration.value);
  if (videoEl.value && media.videoUrl && media.videoDuration) videoEl.value.currentTime = t % media.videoDuration;
  if (audioEl.value && media.audioUrl && t <= media.audioDuration) audioEl.value.currentTime = t;
  if (musicEl.value && media.musicUrl && media.musicDuration) musicEl.value.currentTime = t % media.musicDuration;
  drawPreview();
};

const startPlayback = async () => {
  if (activeDuration.value <= 0) return;
  isPlaying.value = true;
  if (audioSourceNode || videoSourceNode || musicSourceNode) await connectPreviewAudioGraph();
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
  if (musicEl.value && media.musicUrl) {
    musicEl.value.volume = Math.max(0, Math.min(1, Number(media.musicVolume || 0) / 100));
    musicEl.value.currentTime = media.musicDuration ? previewTime.value % media.musicDuration : 0;
    await musicEl.value.play().catch(() => {});
  }
};

const stopPlayback = () => {
  isPlaying.value = false;
  videoEl.value?.pause();
  audioEl.value?.pause();
  musicEl.value?.pause();
};

const togglePlay = () => {
  if (isPlaying.value) stopPlayback();
  else startPlayback();
};

const disconnectNode = (node) => {
  try { node?.disconnect(); } catch (_) {}
};

const resetAudioGraphConnections = () => {
  disconnectNode(audioSourceNode);
  disconnectNode(videoSourceNode);
  disconnectNode(musicSourceNode);
  disconnectNode(musicGainNode);
  disconnectNode(audioMonitorGainNode);
  disconnectNode(musicMonitorGainNode);
  musicGainNode = null;
  audioMonitorGainNode = null;
  musicMonitorGainNode = null;
  mediaDestination = null;
};

const ensureAudioSources = async () => {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") await audioContext.resume();
  if (audioEl.value && !audioSourceNode) audioSourceNode = audioContext.createMediaElementSource(audioEl.value);
  if (videoEl.value && !videoSourceNode) videoSourceNode = audioContext.createMediaElementSource(videoEl.value);
  if (musicEl.value && !musicSourceNode) musicSourceNode = audioContext.createMediaElementSource(musicEl.value);
};

const connectPreviewAudioGraph = async () => {
  await ensureAudioSources();
  resetAudioGraphConnections();
  if (media.audioUrl && audioSourceNode) {
    audioMonitorGainNode = audioContext.createGain();
    audioMonitorGainNode.gain.value = 1;
    audioSourceNode.connect(audioMonitorGainNode);
    audioMonitorGainNode.connect(audioContext.destination);
  }
  if (media.musicUrl && musicSourceNode) {
    musicMonitorGainNode = audioContext.createGain();
    musicMonitorGainNode.gain.value = Math.max(0, Math.min(1, Number(media.musicVolume || 0) / 100));
    musicSourceNode.connect(musicMonitorGainNode);
    musicMonitorGainNode.connect(audioContext.destination);
  }
};

const ensureAudioGraph = async (useSeparateAudio) => {
  await ensureAudioSources();
  resetAudioGraphConnections();
  mediaDestination = audioContext.createMediaStreamDestination();

  const activeSource = useSeparateAudio ? audioSourceNode : videoSourceNode;
  if (activeSource) activeSource.connect(mediaDestination);
  if (media.musicUrl && musicSourceNode) {
    musicGainNode = audioContext.createGain();
    musicGainNode.gain.value = Math.max(0, Math.min(1, Number(media.musicVolume || 0) / 100));
    musicSourceNode.connect(musicGainNode);
    musicGainNode.connect(mediaDestination);
  }
  return mediaDestination.stream.getAudioTracks();
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

const browserUnsupportedFormats = new Set(['backend-mp4', 'png-layers', 'fcpxml']);
const bitrateForQuality = () => {
  if (exportOptions.quality === 'custom') return Math.max(1, Number(exportOptions.customBitrate) || 5) * 1000000;
  return ({ high: 8000000, medium: 5000000, low: 2500000, ultrafast: 2000000 }[exportOptions.quality] || 5000000);
};

const needsBackendExporter = () => (
  browserUnsupportedFormats.has(exportOptions.format)
  || exportOptions.resolution !== '1080x1920'
);

const safeFilePart = (value, fallback = 'reels') => String(value || fallback)
  .trim()
  .slice(0, 60)
  .replace(/[\\/:*?"<>|]+/g, '-')
  .replace(/\s+/g, '-');

const exportFileName = (ext) => {
  const task = tasks.value[selectedTaskIndex.value] || {};
  const mode = exportOptions.namingMode || 'date-auto';
  const base = {
    custom: task.baseName,
    text: overlayState.content.split(/\r?\n/).find(Boolean),
    background: media.videoName,
    audio: media.audioName,
    index: `reels-${selectedTaskIndex.value + 1}`,
    'date-auto': `${task.baseName || 'reels'}-${Date.now()}`,
  }[mode] || `${task.baseName || 'reels'}-${Date.now()}`;
  return `${safeFilePart(base)}.${ext}`;
};


const setTaskExportState = (index, status, progress = null) => {
  const task = tasks.value[index];
  if (!task) return;
  task.exportStatus = status;
  if (progress !== null) task.exportProgress = Math.max(0, Math.min(1, Number(progress) || 0));
  exportJobs.value = tasks.value.map((item) => ({ ...item }));
};

const openExportDialog = (mode = 'current') => {
  syncSelectedTask();
  exportDialogMode.value = mode;
  exportJobs.value = tasks.value.map((task, index) => ({
    ...task,
    exportStatus: task.exportStatus || (index === selectedTaskIndex.value && mode === 'current' ? '准备导出' : '等待导出'),
    exportProgress: task.exportProgress || 0,
  }));
  exportStatus.value = mode === 'queue' ? `准备批量导出 ${tasks.value.length} 条` : '准备导出当前任务';
  exportProgress.value = 0;
  showExportModal.value = true;
};

const startExportFromDialog = async () => {
  if (exportDialogMode.value === 'queue') await exportQueue();
  else await exportCurrentTask({ confirmMp4: true });
};
const exportCurrentTask = async ({ confirmMp4 = true } = {}) => {
  if (isExporting.value) return;
  const canvas = previewCanvas.value;
  if (!canvas) return;
  if (!media.videoUrl && !overlayState.content.trim()) {
    window.alert('请先上传视频或填写字幕内容');
    return;
  }
  if (needsBackendExporter()) {
    exportStatus.value = '等待后端导出服务';
    window.alert('这个导出格式或分辨率需要后端 FFmpeg/GPU 服务。当前浏览器本地可导出：WebM 或浏览器慢转 MP4，分辨率=Reels 1080 x 1920；高画质 8 Mbps 可以本地导出。');
    return;
  }
  if (confirmMp4 && exportOptions.format === 'mp4' && !window.confirm('浏览器 MP4 会先录 WebM 再用 ffmpeg.wasm 转码，可能要等几分钟。要继续吗？\n\n想最快出片请改选 WebM：本地最快。')) {
    return;
  }

  syncSelectedTask();
  stopPlayback();
  exportedUrl.value = '';
  exportProgress.value = 0;
  exportStatus.value = '准备素材';
  setTaskExportState(selectedTaskIndex.value, '准备素材', 0);
  isExporting.value = true;
  wasExporting = true;
  const duration = activeDuration.value;
  const useSeparateAudio = Boolean(media.audioUrl);
  const useVideoAudio = !useSeparateAudio && Boolean(media.videoUrl);
  const recordingAudioTracks = (useSeparateAudio || useVideoAudio || media.musicUrl)
    ? await ensureAudioGraph(useSeparateAudio)
    : [];

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
  if (musicEl.value && media.musicUrl) {
    musicEl.value.loop = true;
    musicEl.value.volume = Math.max(0, Math.min(1, Number(media.musicVolume || 0) / 100));
    musicEl.value.currentTime = 0;
    await musicEl.value.play().catch(() => {});
  }
  if (videoEl.value && media.videoUrl) {
    exportStatus.value = '等待视频帧';
    setTaskExportState(selectedTaskIndex.value, '等待视频帧', exportProgress.value);
    const frameReady = await waitForVideoFrameReady(videoEl.value, 15000);
    if (!frameReady.ok) {
      window.alert('视频素材还没解码出第一帧，已停止导出。请重新上传 H.264 MP4，或先用“WebM：本地最快”测试预览。');
      exportStatus.value = '视频帧未就绪';
      setTaskExportState(selectedTaskIndex.value, '视频帧未就绪', 0);
      isExporting.value = false;
      wasExporting = false;
      stopPlayback();
      drawPreview();
      return;
    }
  }

  drawPreview({ fullResolution: true });
  await waitForNextPaint();
  const stream = canvas.captureStream(exportOptions.fps || 30);
  if (recordingAudioTracks.length) {
    stream.addTrack(recordingAudioTracks[0]);
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
    setTaskExportState(selectedTaskIndex.value, '生成文件', exportProgress.value);
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
            setTaskExportState(selectedTaskIndex.value, status, exportProgress.value);
          },
        });
        ext = 'mp4';
      } catch (error) {
        console.error(error);
        window.alert('MP4 转码失败，没有下载 WebM。你可以改选“WebM：本地最快”作为备用，或换 Chrome / Edge 再试。');
        exportStatus.value = 'MP4 转码失败';
        setTaskExportState(selectedTaskIndex.value, 'MP4 转码失败', exportProgress.value);
        isExporting.value = false;
        wasExporting = false;
        stopPlayback();
        previewTime.value = 0;
        drawPreview();
        return;
      }
    }

    const url = URL.createObjectURL(outputBlob);
    exportedUrl.value = url;
    triggerDownload(url, exportFileName(ext));
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
    const recordProgressMax = exportOptions.format === 'mp4' ? 0.82 : 0.99;
    exportProgress.value = Math.min(recordProgressMax, (previewTime.value / duration) * recordProgressMax);
    exportStatus.value = `导出 ${formatDuration(previewTime.value)} / ${formatDuration(duration)}`;
    syncVideoForExport(elapsed);
    drawPreview({ fullResolution: true });
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
  if (exportOptions.format === 'mp4' && !window.confirm('批量 MP4 会逐条录 WebM 再转码，可能很慢。要继续吗？')) return;
  exportProgress.value = 0;
  exportStatus.value = `准备批量导出 ${tasks.value.length} 条`;
  exportJobs.value = tasks.value.map((task) => ({ ...task, exportStatus: '等待导出', exportProgress: 0 }));
  for (let i = 0; i < tasks.value.length; i += 1) {
    selectedTaskIndex.value = i;
    setTaskExportState(i, '载入任务素材', 0.02);
    await applyTaskToEditor(tasks.value[i]);
    await exportCurrentTask({ confirmMp4: false });
    await waitUntilExportDone();
    if ((tasks.value[i].exportProgress || 0) < 1) setTaskExportState(i, tasks.value[i].exportStatus || '导出未完成', tasks.value[i].exportProgress || 0);
  }
  exportStatus.value = '批量导出完成';
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

const makeStorageSafe = (value) => JSON.parse(JSON.stringify(value, (key, item) => {
  if (key === 'videoUrl' || key === 'audioUrl' || key === 'musicUrl' || key === 'videoFile' || key === 'audioFile' || key === 'musicFile') return undefined;
  if (typeof File !== 'undefined' && item instanceof File) return undefined;
  if (typeof Blob !== 'undefined' && item instanceof Blob) return undefined;
  if (item && typeof item === 'object' && typeof item.queryPermission === 'function') return undefined;
  if (typeof item === 'function') return undefined;
  return item;
}));

const createProjectPayload = () => ({
  version: '2.0.0-web',
  app: 'VideoKit Reels Web',
  exportOptions: JSON.parse(JSON.stringify(exportOptions)),
  assets: {
    video: media.videoAsset,
    audio: media.audioAsset,
    music: media.musicAsset,
  },
  tasks: tasks.value.map((task) => ({
    ...task,
    videoUrl: undefined,
    audioUrl: undefined,
    musicUrl: undefined,
    videoFile: undefined,
    audioFile: undefined,
    musicFile: undefined,
  })),
});

const createLocalDraftPayload = () => ({
  ...createProjectPayload(),
  selectedTaskIndex: selectedTaskIndex.value,
  media: {
    videoName: media.videoName,
    audioName: media.audioName,
    musicName: media.musicName,
    videoDuration: media.videoDuration,
    audioDuration: media.audioDuration,
    musicDuration: media.musicDuration,
    musicVolume: media.musicVolume,
    videoAsset: media.videoAsset,
    audioAsset: media.audioAsset,
    musicAsset: media.musicAsset,
    videoDriveItem: media.videoDriveItem,
    audioDriveItem: media.audioDriveItem,
    exportStatus: '等待导出',
    exportProgress: 0,
  },
  mediaPool: mediaPool.value,
  localMediaItems: localMediaItems.value,
  savedAt: new Date().toISOString(),
});

const saveLocalProjectDraft = async () => {
  let payload = null;
  try {
    syncSelectedTask();
    payload = makeStorageSafe(createLocalDraftPayload());
    localStorage.setItem(LOCAL_PROJECT_DRAFT_KEY, JSON.stringify(payload));
    await localforage.setItem(LOCAL_PROJECT_DRAFT_KEY, payload);
    localDraftStatus.value = `本地草稿已保存 ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error(error);
    if (payload) {
      try {
        localStorage.setItem(LOCAL_PROJECT_DRAFT_KEY, JSON.stringify(payload));
        localDraftStatus.value = `本地草稿已保存到备用缓存 ${new Date().toLocaleTimeString()}`;
        return;
      } catch (fallbackError) {
        console.error(fallbackError);
      }
    }
    localDraftStatus.value = `本地草稿保存失败：${error.message}`;
  }
};

const scheduleLocalProjectSave = () => {
  if (!store.isLoaded) return;
  if (localDraftTimer) window.clearTimeout(localDraftTimer);
  localDraftStatus.value = '本地草稿待保存...';
  localDraftTimer = window.setTimeout(saveLocalProjectDraft, 500);
};

const restoreLocalProjectDraft = async () => {
  try {
    const draft = await localforage.getItem(LOCAL_PROJECT_DRAFT_KEY)
      || JSON.parse(localStorage.getItem(LOCAL_PROJECT_DRAFT_KEY) || 'null');
    if (!draft?.tasks?.length) {
      localDraftStatus.value = '本地草稿未保存';
      return;
    }
    Object.assign(exportOptions, draft.exportOptions || {});
    tasks.value = draft.tasks;
    selectedTaskIndex.value = Math.min(Number(draft.selectedTaskIndex) || 0, tasks.value.length - 1);
    media.videoFile = null;
    media.audioFile = null;
    media.musicFile = null;
    media.videoUrl = '';
    media.audioUrl = '';
    media.musicUrl = '';
    media.videoName = draft.media?.videoName || '';
    media.audioName = draft.media?.audioName || '';
    media.musicName = draft.media?.musicName || '';
    media.videoDuration = Number(draft.media?.videoDuration) || 0;
    media.audioDuration = Number(draft.media?.audioDuration) || 0;
    media.musicDuration = Number(draft.media?.musicDuration) || 0;
    media.musicVolume = Number.isFinite(Number(draft.media?.musicVolume)) ? Number(draft.media.musicVolume) : 30;
    media.videoAsset = draft.media?.videoAsset || null;
    media.audioAsset = draft.media?.audioAsset || null;
    media.musicAsset = draft.media?.musicAsset || null;
    media.videoDriveItem = draft.media?.videoDriveItem || null;
    media.audioDriveItem = draft.media?.audioDriveItem || null;
    mediaPool.value = Array.isArray(draft.mediaPool) ? draft.mediaPool : [];
    localMediaItems.value = mergeLocalMediaItems(localMediaItems.value, Array.isArray(draft.localMediaItems) ? draft.localMediaItems : []);
    await applyTaskToEditor(tasks.value[selectedTaskIndex.value]);
    const restoredVideo = Boolean(media.videoUrl);
    const restoredAudio = Boolean(media.audioUrl);
    const savedAt = draft.savedAt ? formatCloudTime(draft.savedAt) : '';
    localDraftStatus.value = `已恢复本地草稿${savedAt ? ` ${savedAt}` : ''}；${restoredVideo || restoredAudio ? '素材已从本地缓存重新挂载。' : '素材文件需要先授权同一个文件夹才能重新挂载。'}`;
  } catch (error) {
    console.error(error);
    localDraftStatus.value = `本地草稿恢复失败：${error.message}`;
  }
};

const downloadJson = (name, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, name);
  URL.revokeObjectURL(url);
};

const downloadProject = () => {
  syncSelectedTask();
  downloadJson(`videokit_reels_project_${Date.now()}.json`, createProjectPayload());
};

const persistCloudOwner = () => {
  const owner = cloudOwnerId.value.trim() || 'local-user';
  cloudOwnerId.value = owner;
  localStorage.setItem('videohat_owner_id', owner);
};

const formatCloudTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString();
};

const persistAdminToken = () => {
  if (adminToken.value) localStorage.setItem('videohat_admin_token', adminToken.value);
  else localStorage.removeItem('videohat_admin_token');
};

const ensureCloudFontLoaded = async (font) => {
  if (!font?.objectKey || typeof FontFace === 'undefined' || !document?.fonts) return;
  const key = font.objectKey;
  if (loadedCloudFontKeys.has(key)) return;
  loadedCloudFontKeys.add(key);
  try {
    const family = font.family || font.value;
    const face = new FontFace(family, `url("${assetUrl(font.ownerId || cloudOwnerId.value, font.objectKey)}")`);
    await face.load();
    document.fonts.add(face);
  } catch (error) {
    loadedCloudFontKeys.delete(key);
    console.warn('Cloud font load failed', error);
  }
};

const refreshCloudFonts = async () => {
  fontBusy.value = true;
  fontUploadProgress.value = 0.12;
  fontLibraryStatus.value = '读取 R2 官方字体库...';
  try {
    const { fonts } = await listCloudFonts();
    cloudFonts.value = fonts || [];
    fontUploadProgress.value = 0.55;
    fontLibraryStatus.value = `读取到 ${cloudFonts.value.length} 个字体，正在预热前 24 个预览...`;
    await Promise.allSettled(cloudFonts.value.slice(0, 24).map((font) => ensureCloudFontLoaded(font)));
    fontUploadProgress.value = 1;
    fontLibraryStatus.value = cloudFonts.value.length ? `已加载 ${cloudFonts.value.length} 个 R2 字体` : 'R2 字体库为空，管理员可批量上传字体';
  } catch (error) {
    console.error(error);
    fontLibraryStatus.value = `字体库读取失败：${error.message}`;
  } finally {
    fontBusy.value = false;
    if (fontUploadProgress.value >= 1) window.setTimeout(() => { fontUploadProgress.value = 0; }, 900);
  }
};

const uploadOfficialFonts = async (event) => {
  const files = [...(event.target.files || [])];
  event.target.value = '';
  if (!files.length) return;
  persistAdminToken();
  persistCloudOwner();
  fontBusy.value = true;
  fontUploadProgress.value = 0.02;
  try {
    const validFiles = files.filter((file) => /\.(woff2?|ttf|otf|ttc)$/i.test(file.name));
    if (!validFiles.length) throw new Error('请选择 WOFF2、WOFF、TTF、OTF 或 TTC 字体文件');
    let uploaded = 0;
    for (const file of validFiles) {
      fontLibraryStatus.value = `上传字体 ${uploaded + 1}/${validFiles.length}：${file.name}`;
      await uploadCloudFont(cloudOwnerId.value, adminToken.value, file);
      uploaded += 1;
      fontUploadProgress.value = uploaded / validFiles.length;
    }
    fontLibraryStatus.value = `已上传 ${uploaded} 个字体，正在刷新字体库...`;
    await refreshCloudFonts();
  } catch (error) {
    console.error(error);
    fontLibraryStatus.value = `字体上传失败：${error.message}`;
  } finally {
    fontBusy.value = false;
  }
};
const templatePayloadFromCurrent = () => {
  syncSelectedTask();
  const payload = createProjectPayload();
  return {
    ...payload,
    kind: 'official-project-template',
    assets: {
      audio: media.audioAsset || null,
    },
    tasks: payload.tasks.map((task) => ({
      ...task,
      videoName: '',
      videoDuration: 0,
      videoAsset: null,
      videoDriveItem: null,
    })),
  };
};

const refreshOfficialTemplates = async () => {
  templateBusy.value = true;
  templateProgress.value = 0.12;
  templateStatus.value = '读取官方工程模板...';
  try {
    const { templates } = await listOfficialTemplates(isAdminMode ? adminToken.value : '');
    officialTemplates.value = templates || [];
    if (!selectedTemplateId.value && officialTemplates.value.length) selectedTemplateId.value = officialTemplates.value[0].id;
    templateProgress.value = 1;
    templateStatus.value = officialTemplates.value.length ? `已读取 ${officialTemplates.value.length} 个模板` : '暂无官方模板';
  } catch (error) {
    console.error(error);
    templateStatus.value = `模板读取失败：${error.message}`;
  } finally {
    templateBusy.value = false;
    if (templateProgress.value >= 1) window.setTimeout(() => { templateProgress.value = 0; }, 900);
  }
};

const applySelectedTemplate = async () => {
  const template = officialTemplates.value.find((item) => item.id === selectedTemplateId.value);
  if (!template?.payload) return;
  templateBusy.value = true;
  templateStatus.value = `套用工程模板：${template.title}`;
  try {
    const currentVideo = {
      videoFile: media.videoFile,
      videoUrl: media.videoUrl,
      videoName: media.videoName,
      videoDuration: media.videoDuration,
      videoAsset: media.videoAsset,
      videoDriveItem: media.videoDriveItem,
    };
    Object.assign(exportOptions, template.payload.exportOptions || {});
    const templateTasks = template.payload.tasks?.length ? template.payload.tasks : [{ ...tasks.value[0], overlays: [template.payload.overlay || overlayState] }];
    const templateAudio = template.payload.assets?.audio || templateTasks.find((task) => task.audioAsset)?.audioAsset || null;
    const templateAudioName = normalizeOriginalMediaName(templateAudio?.fileName || templateAudio?.name || '');
    let missingCloudAudio = 0;
    tasks.value = templateTasks.map((task, index) => {
      const taskAudioName = normalizeOriginalMediaName(task.audioName || '');
      const canUseGlobalAudio = templateAudio && (!taskAudioName || taskAudioName === templateAudioName);
      const audioAsset = task.audioAsset || (canUseGlobalAudio ? templateAudio : null);
      if (taskAudioName && !audioAsset) missingCloudAudio += 1;
      return {
        ...task,
        ...currentVideo,
        audioAsset,
        audioName: task.audioName || audioAsset?.fileName || '',
        audioDuration: audioAsset ? (task.audioDuration || 0) : 0,
        audioUrl: audioAsset?.objectKey ? assetUrl(audioAsset.ownerId || cloudOwnerId.value, audioAsset.objectKey) : '',
        audioFile: null,
        audioDriveItem: null,
        id: `template_${Date.now()}_${index}`,
        baseName: task.baseName || `${template.title} ${index + 1}`,
        exportStatus: audioAsset || !taskAudioName ? '等待导出' : '音频未绑定 R2，请重新发布模板',
        exportProgress: 0,
      };
    });
    selectedTaskIndex.value = 0;
    await applyTaskToEditor(tasks.value[0]);
    syncSelectedTask();
    scheduleLocalProjectSave();
    templateStatus.value = missingCloudAudio
      ? `已套用工程模板：${template.title}，但 ${missingCloudAudio} 条音频没有绑定 R2。请管理员用新版重新上传音频并保存工程模板。`
      : `已套用工程模板：${template.title}。请替换/选择自己的实拍视频后导出。`;
  } catch (error) {
    console.error(error);
    templateStatus.value = `模板套用失败：${error.message}`;
  } finally {
    templateBusy.value = false;
  }
};

const publishCurrentAsTemplate = async () => {
  persistAdminToken();
  persistCloudOwner();
  syncSelectedTask();
  templateBusy.value = true;
  templateProgress.value = 0.08;
  templateStatus.value = '准备官方工程模板...';
  try {
    const projectId = currentCloudProjectId.value || selectedCloudProjectId.value || 'official-template';
    const audioUploadTasks = tasks.value.filter((task) => task.audioFile && !task.audioAsset);
    if (media.audioFile && !media.audioAsset && !audioUploadTasks.includes(tasks.value[selectedTaskIndex.value])) {
      audioUploadTasks.unshift(tasks.value[selectedTaskIndex.value]);
    }
    for (let index = 0; index < audioUploadTasks.length; index += 1) {
      const task = audioUploadTasks[index];
      templateProgress.value = 0.18 + ((index + 1) / Math.max(1, audioUploadTasks.length)) * 0.45;
      templateStatus.value = `上传官方音频到 R2：${index + 1}/${audioUploadTasks.length} ${task.audioName || task.audioFile.name}`;
      task.audioAsset = (await uploadCloudAsset(cloudOwnerId.value, task.audioFile, { kind: 'template-audio', projectId })).asset;
      task.audioName = task.audioName || task.audioAsset.fileName || task.audioFile.name;
      if (tasks.value[selectedTaskIndex.value] === task) {
        media.audioAsset = task.audioAsset;
        media.audioName = task.audioName;
      }
    }
    if (media.audioFile && !media.audioAsset) {
      templateProgress.value = 0.65;
      templateStatus.value = '上传当前官方音频到 R2...';
      media.audioAsset = (await uploadCloudAsset(cloudOwnerId.value, media.audioFile, { kind: 'template-audio', projectId })).asset;
    }
    syncSelectedTask();
    templateProgress.value = 0.72;
    templateStatus.value = '保存工程参数和表格任务到 D1...';
    const { template } = await saveOfficialTemplate(cloudOwnerId.value, adminToken.value, {
      title: templateTitle.value || tasks.value[selectedTaskIndex.value]?.baseName || '官方 Reels 工程模板',
      description: `官方工程模板：${tasks.value.length} 条任务，${media.audioAsset ? '已绑定 R2 音频' : '未绑定音频'}`,
      payload: templatePayloadFromCurrent(),
      isPublished: true,
    });
    templateProgress.value = 1;
    templateStatus.value = `已发布工程模板：${template.title}`;
    selectedTemplateId.value = template.id;
    await refreshOfficialTemplates();
  } catch (error) {
    console.error(error);
    templateStatus.value = `模板保存失败：${error.message}`;
  } finally {
    templateBusy.value = false;
    if (templateProgress.value >= 1) window.setTimeout(() => { templateProgress.value = 0; }, 1200);
  }
};

const refreshCloudProjects = async () => {
  persistCloudOwner();
  cloudBusy.value = true;
  cloudStatus.value = '读取云端工程...';
  try {
    const { projects } = await listCloudProjects(cloudOwnerId.value);
    cloudProjects.value = projects || [];
    cloudStatus.value = `已读取 ${cloudProjects.value.length} 个工程`;
  } catch (error) {
    console.error(error);
    cloudStatus.value = `云端读取失败：${error.message}`;
  } finally {
    cloudBusy.value = false;
  }
};

const saveProjectOnline = async () => {
  persistCloudOwner();
  syncSelectedTask();
  cloudBusy.value = true;
  cloudStatus.value = '保存工程到 D1...';
  try {
    const title = tasks.value[selectedTaskIndex.value]?.baseName || 'VideoHat Reels 工程';
    const { project } = await saveCloudProject(cloudOwnerId.value, {
      id: currentCloudProjectId.value || undefined,
      title,
      payload: createProjectPayload(),
    });
    currentCloudProjectId.value = project.id;
    selectedCloudProjectId.value = project.id;
    cloudStatus.value = `已保存：${project.title}`;
    await refreshCloudProjects();
  } catch (error) {
    console.error(error);
    cloudStatus.value = `保存失败：${error.message}`;
  } finally {
    cloudBusy.value = false;
  }
};

const uploadCurrentAssets = async () => {
  persistCloudOwner();
  cloudBusy.value = true;
  cloudStatus.value = '上传素材到 R2...';
  try {
    const uploaded = [];
    const projectId = currentCloudProjectId.value || selectedCloudProjectId.value || '';
    if (media.videoFile) {
      media.videoAsset = (await uploadCloudAsset(cloudOwnerId.value, media.videoFile, { kind: 'video', projectId })).asset;
      uploaded.push(media.videoAsset);
    }
    if (media.audioFile) {
      media.audioAsset = (await uploadCloudAsset(cloudOwnerId.value, media.audioFile, { kind: 'audio', projectId })).asset;
      uploaded.push(media.audioAsset);
    }
    syncSelectedTask();
    cloudStatus.value = uploaded.length ? `已上传 ${uploaded.length} 个素材到 R2` : '当前没有可上传的新素材';
  } catch (error) {
    console.error(error);
    cloudStatus.value = `上传失败：${error.message}`;
  } finally {
    cloudBusy.value = false;
  }
};

const deleteSelectedCloudProject = async () => {
  const project = cloudProjects.value.find((item) => item.id === selectedCloudProjectId.value);
  if (!project) return;
  if (!window.confirm(`确定删除云端工程“${project.title}”？会同时删除这个工程关联的 R2 音频/视频素材，字体不会删除。`)) return;
  persistCloudOwner();
  cloudBusy.value = true;
  cloudStatus.value = `删除工程：${project.title}`;
  try {
    await deleteCloudProject(cloudOwnerId.value, project.id);
    if (currentCloudProjectId.value === project.id) currentCloudProjectId.value = '';
    selectedCloudProjectId.value = '';
    cloudStatus.value = `已删除工程：${project.title}`;
    await refreshCloudProjects();
  } catch (error) {
    console.error(error);
    cloudStatus.value = `删除失败：${error.message}`;
  } finally {
    cloudBusy.value = false;
  }
};

const deleteSelectedOfficialTemplate = async () => {
  const template = officialTemplates.value.find((item) => item.id === selectedTemplateId.value);
  if (!template) return;
  persistAdminToken();
  persistCloudOwner();
  if (!window.confirm(`确定删除官方工程“${template.title}”？会同时删除这个模板关联的 R2 音频素材，字体不会删除。`)) return;
  templateBusy.value = true;
  templateProgress.value = 0.25;
  templateStatus.value = `删除官方工程：${template.title}`;
  try {
    await deleteOfficialTemplate(cloudOwnerId.value, adminToken.value, template.id);
    selectedTemplateId.value = '';
    templateProgress.value = 1;
    templateStatus.value = `已删除官方工程：${template.title}`;
    await refreshOfficialTemplates();
  } catch (error) {
    console.error(error);
    templateStatus.value = `模板删除失败：${error.message}`;
  } finally {
    templateBusy.value = false;
    if (templateProgress.value >= 1) window.setTimeout(() => { templateProgress.value = 0; }, 900);
  }
};
const loadSelectedCloudProject = async () => {
  const project = cloudProjects.value.find((item) => item.id === selectedCloudProjectId.value);
  if (!project?.payload) return;
  currentCloudProjectId.value = project.id;
  Object.assign(exportOptions, project.payload.exportOptions || {});
  tasks.value = project.payload.tasks || tasks.value;
  media.videoAsset = project.payload.assets?.video || tasks.value[0]?.videoAsset || null;
  media.audioAsset = project.payload.assets?.audio || tasks.value[0]?.audioAsset || null;
  media.videoUrl = media.videoAsset?.objectKey ? assetUrl(media.videoAsset.ownerId || cloudOwnerId.value, media.videoAsset.objectKey) : '';
  media.audioUrl = media.audioAsset?.objectKey ? assetUrl(media.audioAsset.ownerId || cloudOwnerId.value, media.audioAsset.objectKey) : '';
  selectedTaskIndex.value = 0;
  await applyTaskToEditor(tasks.value[0]);
  cloudStatus.value = `已加载：${project.title}`;
};
const handleGeneratedTasks = (generatedTasks) => {
  syncSelectedTask();
  const inherited = {
    videoFile: media.videoFile,
    audioFile: media.audioFile,
    musicFile: media.musicFile,
    videoUrl: media.videoUrl,
    audioUrl: media.audioUrl,
    musicUrl: media.musicUrl,
    videoName: media.videoName,
    audioName: media.audioName,
    musicName: media.musicName,
    videoDuration: media.videoDuration,
    audioDuration: media.audioDuration,
    musicDuration: media.musicDuration,
    musicVolume: media.musicVolume,
  };
  const nextTasks = generatedTasks.map((task) => {
    const hasVideoName = Boolean(task.videoName);
    const hasAudioName = Boolean(task.audioName);
    const hasMusicName = Boolean(task.musicName);
    return {
      ...inherited,
      ...task,
      videoUrl: hasVideoName ? (task.videoUrl || '') : (task.videoUrl || inherited.videoUrl),
      audioUrl: hasAudioName ? (task.audioUrl || '') : (task.audioUrl || inherited.audioUrl),
      musicUrl: hasMusicName ? (task.musicUrl || '') : (task.musicUrl || inherited.musicUrl),
      videoName: task.videoName || inherited.videoName,
      audioName: task.audioName || inherited.audioName,
      musicName: task.musicName || inherited.musicName,
      videoDuration: task.videoDuration || inherited.videoDuration,
      audioDuration: task.audioDuration || inherited.audioDuration,
      musicDuration: task.musicDuration || inherited.musicDuration,
      musicVolume: Number.isFinite(Number(task.musicVolume)) ? Number(task.musicVolume) : inherited.musicVolume,
      exportStatus: '等待导出',
      exportProgress: 0,
    };
  });
  tasks.value = nextTasks;
  selectedTaskIndex.value = 0;
  if (tasks.value[0]) applyTaskToEditor(tasks.value[0]);
  showBulkModal.value = false;
};

const applySignaturePositionPreset = () => {
  const preset = overlayState.signature_position || 'top-right';
  if (preset === 'custom') return;
  const marginX = 82;
  const marginY = 115;
  if (preset === 'top-right') {
    overlayState.signature_x = EXPORT_WIDTH - marginX;
    overlayState.signature_y = marginY;
    overlayState.signature_width = 420;
    overlayState.signature_align = 'right';
  } else if (preset === 'top-left') {
    overlayState.signature_x = marginX;
    overlayState.signature_y = marginY;
    overlayState.signature_width = 420;
    overlayState.signature_align = 'left';
  } else if (preset === 'bottom-right') {
    overlayState.signature_x = EXPORT_WIDTH - marginX;
    overlayState.signature_y = EXPORT_HEIGHT - 250;
    overlayState.signature_width = 420;
    overlayState.signature_align = 'right';
  } else if (preset === 'bottom-left') {
    overlayState.signature_x = marginX;
    overlayState.signature_y = EXPORT_HEIGHT - 250;
    overlayState.signature_width = 420;
    overlayState.signature_align = 'left';
  } else if (preset === 'bottom-center') {
    overlayState.signature_x = EXPORT_WIDTH / 2;
    overlayState.signature_y = EXPORT_HEIGHT - 230;
    overlayState.signature_width = 760;
    overlayState.signature_align = 'center';
  }
};

watch(overlayState, () => {
  syncSelectedTask();
  scheduleLocalProjectSave();
  drawPreview();

}, { deep: true });
watch(exportOptions, scheduleLocalProjectSave, { deep: true });
watch(() => overlayState.signature_position, applySignaturePositionPreset);
watch(activeDuration, () => {
  if (previewTime.value > activeDuration.value) previewTime.value = 0;
});

onMounted(async () => {
  await store.loadDraft();
  await loadLocalMediaFileHandles();
  await autoRestoreLocalMediaFolder();
  await restoreLocalProjectDraft();
  await rehydrateSelectedTaskMediaFromLocalFolder();
  refreshOfficialTemplates();
  refreshCloudFonts();
  animationFrameId = requestAnimationFrame(renderLoop);
});

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (exportStopTimer) cancelAnimationFrame(exportStopTimer);
  if (localDraftTimer) window.clearTimeout(localDraftTimer);
  stopPlayback();
});
</script>
