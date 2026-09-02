<template>
  <div class="flex h-full flex-col bg-[#0a0a14]">
    <div class="flex shrink-0 items-center gap-2 border-b border-[#2a2a3a] bg-[#121222] p-3">
      <button class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10" @click="store.addRow()">
        添加行
      </button>
      <button class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10" @click="handleAddColumn">
        添加列
      </button>
      <button class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10" @click="pasteFromClipboard">
        粘贴表格文案
      </button>
      <label class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10">
        导入表格文件
        <input class="hidden" type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" @change="importTableFile" />
      </label>
      <span class="text-xs text-gray-500">支持 Excel/Sheets 复制、CSV、TSV、TXT</span>
      <button class="ml-auto rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20" @click="store.clearAll()">
        清空数据
      </button>
    </div>

    <div class="flex-1 overflow-auto">
      <table class="w-max min-w-full border-collapse">
        <thead>
          <tr>
            <th class="sticky top-0 z-20 w-12 border border-[#2a2a3a] bg-[#1a1a2e] py-2 text-xs text-gray-500">#</th>
            <th v-for="(col, ci) in store.columns" :key="`th-${ci}`" class="sticky top-0 z-10 min-w-[220px] border border-[#2a2a3a] bg-[#1a1a2e] p-1">
              <div class="flex items-center gap-1">
                <input v-model="col.name" class="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm text-white outline-none focus:border-b focus:border-purple-500" placeholder="列名" @blur="store.saveDraft" />
                <button class="px-2 font-bold text-red-500 hover:text-red-400" @click="store.removeColumn(ci)">x</button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, ri) in store.rows" :key="`tr-${ri}`" class="group hover:bg-[#121222]">
            <td class="relative border border-[#222235] bg-[#0a0a14] text-center text-xs text-gray-600">
              {{ ri + 1 }}
              <button class="absolute inset-0 flex items-center justify-center bg-red-500/80 font-bold text-white opacity-0 group-hover:opacity-100" @click="store.removeRow(ri)">
                x
              </button>
            </td>
            <td v-for="(col, ci) in store.columns" :key="`td-${ri}-${ci}`" class="h-10 border border-[#222235] p-0">
              <input
                :value="row[ci]"
                class="h-full w-full border-none bg-transparent px-3 text-sm text-gray-300 outline-none focus:bg-purple-900/30 focus:ring-1 focus:ring-purple-500"
                placeholder="填入数据..."
                @input="event => store.updateCell(ri, ci, event.target.value)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useBulkStore } from '../stores/bulkStore';

const store = useBulkStore();

const handleAddColumn = () => {
  const name = window.prompt('输入新列名', '新列');
  if (name?.trim()) store.addColumn(name.trim());
};

const parseCsvLine = (line, delimiter) => {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
};

const parseTableText = (text, fileName = '') => {
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n').filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = fileName.toLowerCase().endsWith('.csv') || (lines[0].includes(',') && !lines[0].includes('\t')) ? ',' : '\t';
  return lines.map((line) => parseCsvLine(line, delimiter));
};

const applyParsedRows = (parsedRows) => {
  if (!parsedRows.length) return;

  const firstRow = parsedRows[0];
  const useHeader = parsedRows.length > 1 && window.confirm('第一行是否作为列标题？');
  const dataRows = useHeader ? parsedRows.slice(1) : parsedRows;
  const width = Math.max(...parsedRows.map((row) => row.length));

  if (useHeader) {
    store.columns = firstRow.map((name, index) => ({ name: name.trim() || `列${index + 1}`, type: 'text' }));
  } else {
    while (store.columns.length < width) store.columns.push({ name: `列${store.columns.length + 1}`, type: 'text' });
  }

  store.rows = dataRows.map((row) => {
    const next = new Array(store.columns.length).fill('');
    row.forEach((value, index) => {
      if (index < next.length) next[index] = value;
    });
    return next;
  });
  store.templates.forEach((template, index) => store.autoBindTemplate(index));
  store.normalizeRows();
  store.saveDraft();
};

const pasteFromClipboard = async () => {
  let text = '';
  try {
    text = await navigator.clipboard.readText();
  } catch (error) {
    text = window.prompt('粘贴从 Excel 或 Google Sheets 复制的表格文案', '') || '';
  }
  applyParsedRows(parseTableText(text));
};

const importTableFile = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (/\.xlsx?$/i.test(file.name)) {
    window.alert('浏览器版当前请先从 Excel 导出 CSV/TSV，或直接复制表格后点“粘贴表格文案”。');
    return;
  }
  const text = await file.text();
  applyParsedRows(parseTableText(text, file.name));
};
</script>