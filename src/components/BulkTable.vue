<template>
  <div class="flex h-full flex-col bg-[#0a0a14]">
    <div class="flex shrink-0 items-center gap-2 border-b border-[#2a2a3a] bg-[#121222] p-3">
      <button class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10" @click="store.addRow()">添加行</button>
      <button class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10" @click="handleAddColumn">添加列</button>
      <button class="rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-500/20" @click="pasteSmartCopy">智能粘贴文案</button>
      <button class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10" @click="pasteFromClipboard">粘贴表格</button>
      <label class="rounded border border-[#333] bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10">
        导入表格文件
        <input class="hidden" type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" @change="importTableFile" />
      </label>
      <button class="rounded border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-200 hover:bg-blue-500/20" @click="ensureStandardColumns">恢复标准列</button>
      <span class="text-xs text-gray-500">纯文案自动进“滚动正文”；Excel/Sheets 会保留视频、音频、配乐列</span>
      <button class="ml-auto rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20" @click="store.clearAll()">清空数据</button>
    </div>

    <div class="border-b border-[#222235] bg-[#0f1320] px-3 py-2 text-xs text-gray-500">
      <span class="mr-3 rounded bg-blue-500/15 px-2 py-1 text-blue-100">视频列只显示文件名</span>
      <span class="mr-3 rounded bg-green-500/15 px-2 py-1 text-green-100">配音列用于批量匹配</span>
      <span class="mr-3 rounded bg-purple-500/15 px-2 py-1 text-purple-100">配乐列支持音量%</span>
      <span>{{ tableHint }}</span>
    </div>

    <div class="flex-1 overflow-auto">
      <table class="w-max min-w-full border-collapse">
        <thead>
          <tr>
            <th class="sticky top-0 z-20 w-12 border border-[#2a2a3a] bg-[#1a1a2e] py-2 text-xs text-gray-500">#</th>
            <th v-for="(col, ci) in store.columns" :key="`th-${ci}`" class="sticky top-0 z-10 border border-[#2a2a3a] bg-[#1a1a2e] p-1" :class="columnClass(col.name)">
              <div class="flex items-center gap-1">
                <span class="shrink-0 rounded px-1.5 py-0.5 text-[10px]" :class="columnBadgeClass(col.name)">{{ columnIcon(col.name) }}</span>
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
              <button class="absolute inset-0 flex items-center justify-center bg-red-500/80 font-bold text-white opacity-0 group-hover:opacity-100" @click="store.removeRow(ri)">x</button>
            </td>
            <td v-for="(col, ci) in store.columns" :key="`td-${ri}-${ci}`" class="border border-[#222235] p-0" :class="isLongTextColumn(col.name) ? 'h-20' : 'h-10'">
              <textarea
                v-if="isLongTextColumn(col.name)"
                :value="row[ci]"
                class="h-20 w-full resize-none border-none bg-transparent px-3 py-2 text-sm leading-relaxed text-gray-300 outline-none focus:bg-purple-900/30 focus:ring-1 focus:ring-purple-500"
                placeholder="粘贴正文文案..."
                @input="event => store.updateCell(ri, ci, event.target.value)"
              ></textarea>
              <input
                v-else
                :value="row[ci]"
                class="h-full w-full border-none bg-transparent px-3 text-sm text-gray-300 outline-none focus:bg-purple-900/30 focus:ring-1 focus:ring-purple-500"
                :placeholder="placeholderFor(col.name)"
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
import { ref } from 'vue';
import { useBulkStore } from '../stores/bulkStore';

const store = useBulkStore();
const tableHint = ref('');
const STANDARD_NAMES = ['任务名称', '视频文件名', '音频文件名', '配乐文件名', '配乐音量%', '滚动标题', '滚动正文', '署名'];

const columnClass = (name) => {
  if (name.includes('正文') || name.includes('文案')) return 'min-w-[620px]';
  if (name.includes('视频') || name.includes('音频') || name.includes('配乐')) return 'min-w-[220px]';
  return 'min-w-[180px]';
};

const columnIcon = (name) => {
  if (name.includes('视频') || name.includes('实拍')) return '视频';
  if (name.includes('音频') || name.includes('配音')) return '配音';
  if (name.includes('配乐')) return '配乐';
  if (name.includes('标题')) return '标题';
  if (name.includes('正文') || name.includes('文案')) return '正文';
  if (name.includes('署名')) return '署名';
  return '列';
};

const columnBadgeClass = (name) => {
  if (name.includes('视频') || name.includes('实拍')) return 'bg-blue-500/20 text-blue-100';
  if (name.includes('音频') || name.includes('配音')) return 'bg-green-500/20 text-green-100';
  if (name.includes('配乐')) return 'bg-purple-500/20 text-purple-100';
  if (name.includes('正文') || name.includes('文案')) return 'bg-cyan-500/20 text-cyan-100';
  return 'bg-white/10 text-gray-300';
};

const isLongTextColumn = (name) => /正文|文案|content|body/i.test(name);

const placeholderFor = (name) => {
  if (name.includes('视频')) return '显示文件名，不会自动上传';
  if (name.includes('音频')) return '显示配音文件名';
  if (name.includes('配乐')) return name.includes('音量') ? '30' : '显示配乐文件名';
  return '填入数据...';
};

const ensureStandardColumns = () => {
  if (typeof store.ensureStandardColumns === 'function') store.ensureStandardColumns();
  STANDARD_NAMES.forEach((name) => {
    if (!store.columns.some((column) => column.name === name)) store.columns.push({ name, type: 'text' });
  });
  store.normalizeRows();
  store.templates.forEach((template) => { template.bindings = store.createAutoBindings(); });
  store.saveDraft();
  tableHint.value = '已恢复标准列：视频、配音、配乐、标题、正文、署名都保留。';
};

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
  return cells.map((cell) => cell.trim());
};

const parseTableText = (text, fileName = '') => {
  const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return { rows: [], kind: 'empty' };
  const lines = normalized.split('\n').filter((line) => line.trim());
  const hasTabs = normalized.includes('\t');
  const commaCells = lines[0]?.includes(',') && !hasTabs;
  if (hasTabs || fileName.toLowerCase().endsWith('.csv') || commaCells) {
    const delimiter = fileName.toLowerCase().endsWith('.csv') || commaCells ? ',' : '\t';
    return { rows: lines.map((line) => parseCsvLine(line, delimiter)), kind: 'table' };
  }
  const paragraphBlocks = normalized.split(/\n\s*\n+/).map((part) => part.trim()).filter(Boolean);
  const contentRows = paragraphBlocks.length > 1 ? paragraphBlocks : lines.map((line) => line.trim()).filter(Boolean);
  return { rows: contentRows.map((line) => [line]), kind: 'copy' };
};

const guessHeader = (row) => {
  const joined = row.map((cell) => String(cell || '').trim()).join('|').toLowerCase();
  return ['任务', '视频', '音频', '配乐', '标题', '正文', '文案', 'name', 'video', 'audio', 'content'].some((word) => joined.includes(word));
};

const nextWritableRow = () => {
  const contentIndex = store.columnIndex('滚动正文');
  const empty = store.rows.findIndex((row) => !String(row[contentIndex] || '').trim());
  return empty >= 0 ? empty : store.rows.length;
};

const ensureRow = (index) => {
  while (store.rows.length <= index) store.rows.push(new Array(store.columns.length).fill(''));
  store.normalizeRows();
};

const writeRowsIntoColumns = (rows, mapByIndex) => {
  let rowIndex = nextWritableRow();
  rows.forEach((sourceRow) => {
    ensureRow(rowIndex);
    Object.entries(mapByIndex).forEach(([sourceIndex, targetName]) => {
      const targetIndex = store.columnIndex(targetName);
      if (targetIndex >= 0 && sourceRow[sourceIndex] !== undefined) store.rows[rowIndex][targetIndex] = sourceRow[sourceIndex];
    });
    rowIndex += 1;
  });
};

const applyParsedRows = ({ rows, kind }) => {
  if (!rows.length) return;
  ensureStandardColumns();

  if (kind === 'copy' || rows[0].length === 1) {
    const start = nextWritableRow();
    writeRowsIntoColumns(rows, { 0: '滚动正文' });
    const nameIndex = store.columnIndex('任务名称');
    const contentIndex = store.columnIndex('滚动正文');
    rows.forEach((_, offset) => {
      const row = store.rows[start + offset];
      if (row && nameIndex >= 0 && !row[nameIndex]) row[nameIndex] = '文案 ' + (start + offset + 1);
      if (row && contentIndex >= 0) row[contentIndex] = String(row[contentIndex] || '').trim();
    });
    tableHint.value = '已按纯文案导入到滚动正文列，共 ' + rows.length + ' 行。';
  } else {
    const header = guessHeader(rows[0]) ? rows[0] : null;
    const dataRows = header ? rows.slice(1) : rows;
    const map = {};
    if (header) {
      header.forEach((name, index) => {
        const lower = String(name || '').toLowerCase();
        if (lower.includes('任务') || lower.includes('name')) map[index] = '任务名称';
        else if (lower.includes('视频') || lower.includes('实拍') || lower.includes('video')) map[index] = '视频文件名';
        else if ((lower.includes('配乐') || lower.includes('bgm') || lower.includes('music')) && (lower.includes('音量') || lower.includes('volume'))) map[index] = '配乐音量%';
        else if (lower.includes('配乐') || lower.includes('bgm') || lower.includes('music')) map[index] = '配乐文件名';
        else if (lower.includes('音频') || lower.includes('配音') || lower.includes('audio') || lower.includes('voice')) map[index] = '音频文件名';
        else if (lower.includes('标题') || lower.includes('title')) map[index] = '滚动标题';
        else if (lower.includes('正文') || lower.includes('内容') || lower.includes('文案') || lower.includes('content') || lower.includes('body')) map[index] = '滚动正文';
        else if (lower.includes('署名') || lower.includes('signature')) map[index] = '署名';
      });
    } else {
      ['任务名称', '视频文件名', '音频文件名', '配乐文件名', '配乐音量%', '滚动标题', '滚动正文', '署名'].forEach((name, index) => { map[index] = name; });
    }
    writeRowsIntoColumns(dataRows, map);
    tableHint.value = '已按表格导入，共 ' + dataRows.length + ' 行；标准素材列已保留。';
  }

  store.templates.forEach((template) => { template.bindings = store.createAutoBindings(); });
  store.normalizeRows();
  store.saveDraft();
};

const pasteClipboardText = async (promptText) => {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    return window.prompt(promptText, '') || '';
  }
};

const pasteSmartCopy = async () => {
  const text = await pasteClipboardText('粘贴一行一个任务的文案，或整段文案');
  applyParsedRows(parseTableText(text));
};

const pasteFromClipboard = async () => {
  const text = await pasteClipboardText('粘贴从 Excel 或 Google Sheets 复制的表格');
  applyParsedRows(parseTableText(text));
};

const importTableFile = async (event) => {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (/\.xlsx?$/i.test(file.name)) {
    window.alert('浏览器版当前请先从 Excel 导出 CSV/TSV，或直接复制表格后点“粘贴表格”。');
    return;
  }
  const text = await file.text();
  applyParsedRows(parseTableText(text, file.name));
};
</script>