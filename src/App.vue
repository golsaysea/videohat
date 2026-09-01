<template>
  <div class="flex h-screen flex-col bg-[#0a0a14] font-sans text-gray-200">
    <header class="z-10 flex items-center justify-between border-b border-[#333] bg-[#1a1a2e] px-6 py-3 shadow-md">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-purple-600 to-blue-500 font-bold text-white shadow-lg">
          R
        </div>
        <h1 class="m-0 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-lg font-bold text-transparent">
          Reels Web Pro
        </h1>
      </div>
      <button class="rounded bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-2 font-bold text-white shadow-lg shadow-purple-500/20 transition-all hover:scale-105 hover:from-purple-500 hover:to-fuchsia-500" @click="generateTasks">
        立即生成批量任务 JSON
      </button>
    </header>

    <main v-if="store.isLoaded" class="flex flex-1 overflow-hidden">
      <div class="min-w-0 flex-[5]">
        <BulkTable />
      </div>
      <div class="min-w-[300px] flex-[2] border-l border-[#2a2a3a]">
        <TemplateBindings />
      </div>
    </main>
    <div v-else class="flex flex-1 animate-pulse items-center justify-center text-gray-500">
      读取本地大型工程缓存中...
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useBulkStore } from './stores/bulkStore';
import BulkTable from './components/BulkTable.vue';
import TemplateBindings from './components/TemplateBindings.vue';

const store = useBulkStore();

onMounted(() => store.loadDraft());

const generateTasks = () => {
  const validRows = store.rows.filter((row) => row.some((cell) => String(cell).trim() !== ''));
  if (validRows.length === 0) {
    window.alert('表格中没有有效数据！');
    return;
  }
  if (store.templates.length === 0) {
    window.alert('请先在右侧添加至少一个模板！');
    return;
  }

  const generatedTasks = [];

  validRows.forEach((row, rowIndex) => {
    store.templates.forEach((tpl) => {
      const task = JSON.parse(JSON.stringify(tpl.task));
      task.baseName = `矩阵任务_Row${rowIndex + 1}_${tpl.label}`;

      for (const [fieldKey, colIdx] of Object.entries(tpl.bindings)) {
        if (colIdx === undefined || colIdx < 0 || colIdx >= store.columns.length) continue;
        const cellValue = row[colIdx] || '';
        if (!cellValue) continue;

        if (fieldKey === '__bg__') {
          task.bgPath = cellValue;
          task.videoPath = cellValue;
          task.bgMode = 'single';
        } else if (fieldKey.startsWith('L')) {
          const match = fieldKey.match(/^L(\d+)_(.+)$/);
          if (match && task.overlays?.[match[1]]) {
            task.overlays[match[1]][match[2]] = cellValue;
          }
        }
      }

      generatedTasks.push(task);
    });
  });

  const blob = new Blob([JSON.stringify(generatedTasks, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `reels_tasks_${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  window.alert(`成功派生 ${generatedTasks.length} 个任务！\n已自动下载 JSON，您可以将其传给 Canvas 渲染器。`);
};
</script>
