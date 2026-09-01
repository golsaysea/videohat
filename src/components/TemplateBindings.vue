<template>
  <div class="flex h-full flex-col overflow-auto bg-[#121222] p-4">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="m-0 text-sm font-bold text-purple-400">模板与列绑定</h2>
      <button class="rounded border border-purple-500/30 bg-purple-600/20 px-3 py-1 text-xs text-purple-400 transition hover:bg-purple-600/40" @click="store.addTemplate">
        添加模板
      </button>
    </div>

    <div class="flex flex-col gap-4">
      <div v-for="(tpl, ti) in store.templates" :key="tpl.id" class="group relative rounded-lg border border-[#333] bg-white/5 p-4">
        <div class="mb-3 flex items-center justify-between border-b border-[#333] pb-2">
          <input v-model="tpl.label" class="border-none bg-transparent text-sm font-bold text-green-400 outline-none focus:border-b focus:border-green-500" @blur="store.saveDraft" />
          <button class="rounded px-2 py-0.5 text-xs text-red-500 opacity-0 transition hover:bg-red-500/20 group-hover:opacity-100" @click="store.removeTemplate(ti)">
            删除
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <div v-for="field in getFields(tpl)" :key="field.key" class="flex items-center gap-2 text-xs">
            <span class="w-24 truncate text-gray-400" :title="field.label">{{ field.label }}</span>
            <select v-model="tpl.bindings[field.key]" class="flex-1 rounded border border-[#444] bg-black p-1 text-gray-300 outline-none focus:border-purple-500" @change="store.saveDraft">
              <option :value="undefined">(不绑定)</option>
              <option v-for="col in getCompatibleCols(field.type)" :key="col.index" :value="col.index">
                {{ col.type === 'media' ? '媒体' : '文本' }} {{ col.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="!store.templates.length" class="rounded-lg border border-dashed border-[#333] py-10 text-center text-xs text-gray-600">
        点击右上角添加您的第一个矩阵模板
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBulkStore } from '../stores/bulkStore';

const store = useBulkStore();

const getFields = (tpl) => {
  const fields = [{ key: '__bg__', label: '背景素材', type: 'media' }];
  (tpl.task.overlays || []).forEach((overlay, index) => {
    if (overlay.type === 'textcard') {
      fields.push({ key: `L${index}_title_text`, label: `层${index + 1} 标题`, type: 'text' });
      fields.push({ key: `L${index}_body_text`, label: `层${index + 1} 正文`, type: 'text' });
    }
  });
  return fields;
};

const getCompatibleCols = (type) => {
  return store.columns
    .map((column, index) => ({ ...column, index }))
    .filter((column) => column.type === type || !type);
};
</script>
