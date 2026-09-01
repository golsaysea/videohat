<template>
  <div class="flex h-full flex-col overflow-auto bg-[#121222] p-5">
    <div class="mb-6 flex shrink-0 items-center justify-between">
      <h2 class="m-0 text-sm font-bold text-purple-400">数据列映射</h2>
      <button class="rounded border border-purple-500/30 bg-purple-600/20 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-600/40" @click="store.addTemplate">
        添加模板
      </button>
    </div>

    <div class="flex flex-col gap-4">
      <div v-for="(tpl, ti) in store.templates" :key="tpl.id" class="group rounded-xl border border-[#333] bg-[#1a1a2e] p-5">
        <div class="mb-4 flex items-center justify-between border-b border-[#333] pb-3">
          <input v-model="tpl.label" class="w-2/3 bg-transparent text-sm font-bold text-green-400 outline-none" placeholder="模板名称" @blur="store.saveDraft" />
          <div class="flex items-center gap-3">
            <button class="text-xs text-blue-400 opacity-0 group-hover:opacity-100" @click="store.autoBindTemplate(ti)">自动映射</button>
            <button class="text-xs text-red-500 opacity-0 group-hover:opacity-100" @click="store.removeTemplate(ti)">删除</button>
          </div>
        </div>
        <div class="flex flex-col gap-3">
          <div v-for="field in fields" :key="field.key" class="flex items-center gap-3">
            <span class="w-24 text-right text-xs font-medium text-gray-400">{{ field.label }}</span>
            <select v-model="tpl.bindings[field.key]" class="flex-1 rounded border border-[#444] bg-black px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-purple-500" @change="store.saveDraft">
              <option :value="undefined">使用面板当前值</option>
              <option v-for="(col, ci) in store.columns" :key="ci" :value="ci">{{ col.name }} (列 {{ ci + 1 }})</option>
            </select>
          </div>
        </div>
      </div>
      <div v-if="!store.templates.length" class="rounded-lg border border-dashed border-[#333] py-10 text-center text-xs text-gray-500">
        点击右上角添加您的第一个映射模板
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBulkStore } from '../stores/bulkStore';

const store = useBulkStore();
const fields = [
  { key: 'scroll_title', label: '滚动标题' },
  { key: 'content', label: '滚动正文' },
];
</script>
