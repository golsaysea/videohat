<template>
  <div class="flex h-full flex-col border-r border-[#2a2a3a] bg-[#0a0a14]">
    <div class="flex items-center gap-2 border-b border-[#2a2a3a] bg-[#121222] p-3">
      <button class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10" @click="store.addRow()">
        添加行
      </button>
      <button class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10" @click="handleAddColumn">
        添加列
      </button>
      <button class="ml-auto rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20" @click="store.clearAll()">
        清空数据
      </button>
    </div>

    <div class="flex-1 overflow-auto">
      <table class="w-max min-w-full border-collapse">
        <thead>
          <tr>
            <th class="sticky top-0 z-20 w-12 border border-[#2a2a3a] bg-[#1a1a2e] py-2 text-xs text-gray-500">#</th>
            <th v-for="(col, ci) in store.columns" :key="`th-${ci}`" class="sticky top-0 z-10 min-w-[160px] border border-[#2a2a3a] bg-[#1a1a2e] p-1">
              <div class="flex items-center gap-1">
                <select v-model="col.type" class="rounded border border-[#444] bg-black p-1 text-xs text-white outline-none" @change="store.saveDraft">
                  <option value="text">文本</option>
                  <option value="media">媒体</option>
                </select>
                <input v-model="col.name" class="min-w-0 flex-1 border-b border-[#444] bg-transparent px-1 text-sm text-white outline-none focus:border-purple-500" @blur="store.saveDraft" />
                <button class="px-1 text-red-500 hover:text-red-400" @click="store.removeColumn(ci)">x</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in store.rows" :key="`tr-${ri}`" class="hover:bg-[#121222]">
            <td class="group relative border border-[#222235] bg-[#0a0a14] text-center text-xs text-gray-600">
              {{ ri + 1 }}
              <button class="absolute inset-0 flex items-center justify-center bg-red-500 font-bold text-white opacity-0 transition-opacity group-hover:opacity-100" @click="store.removeRow(ri)">
                x
              </button>
            </td>
            <td v-for="(col, ci) in store.columns" :key="`td-${ri}-${ci}`" class="relative h-9 border border-[#222235] p-0" :class="{ 'bg-green-900/5': col.type === 'media' }">
              <input
                v-if="col.type === 'text'"
                :value="row[ci]"
                class="h-full w-full border-none bg-transparent px-2 text-sm text-gray-300 outline-none focus:bg-purple-900/30 focus:ring-1 focus:ring-purple-500"
                @input="event => store.updateCell(ri, ci, event.target.value)"
              />

              <div v-else class="flex h-full w-full cursor-pointer items-center px-2 text-xs text-gray-400 hover:bg-white/5" @click="pickMedia(ri, ci)">
                <span class="truncate" :class="{ 'text-blue-400': row[ci] }">
                  {{ row[ci] ? WebAssetPool.getFileName(row[ci]) : '点击选文件...' }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useBulkStore } from '../stores/bulkStore';
import { WebAssetPool } from '../utils/WebAssetPool';

const store = useBulkStore();

const handleAddColumn = () => {
  const name = window.prompt('输入新列名', '新列');
  if (name) store.addColumn(name);
};

const pickMedia = (rowIndex, columnIndex) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'video/*,image/*,audio/*';
  input.onchange = () => {
    if (!input.files.length) return;
    const paths = WebAssetPool.registerFiles(input.files);

    paths.forEach((path, offset) => {
      const targetRowIndex = rowIndex + offset;
      while (store.rows.length <= targetRowIndex) store.addRow(false);
      store.updateCell(targetRowIndex, columnIndex, path);
    });

    store.saveDraft();
  };
  input.click();
};
</script>
