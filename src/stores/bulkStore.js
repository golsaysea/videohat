import { defineStore } from 'pinia';
import localforage from 'localforage';
import { toRaw } from 'vue';

const DRAFT_KEY = 'reels_bulk_draft_v3';

export const useBulkStore = defineStore('bulk', {
  state: () => ({
    columns: [
      { name: '原始完整文案', type: 'text' },
      { name: '标题', type: 'text' },
      { name: '正文', type: 'text' },
      { name: '背景视频', type: 'media' },
    ],
    rows: [],
    templates: [],
    isLoaded: false,
  }),

  actions: {
    initTable() {
      if (this.rows.length === 0) {
        for (let i = 0; i < 10; i += 1) this.addRow(false);
      }
      this.normalizeRows();
      this.saveDraft();
    },

    normalizeRows() {
      if (!this.columns.length) this.columns.push({ name: '新列', type: 'text' });
      this.rows.forEach((row) => {
        while (row.length < this.columns.length) row.push('');
        if (row.length > this.columns.length) row.length = this.columns.length;
      });
    },

    addRow(save = true) {
      this.rows.push(new Array(this.columns.length).fill(''));
      if (save) this.saveDraft();
    },

    addColumn(name = '新列', type = 'text') {
      this.columns.push({ name, type });
      this.normalizeRows();
      this.saveDraft();
    },

    removeColumn(index) {
      if (this.columns.length <= 1) {
        window.alert('至少保留一列');
        return;
      }

      this.columns.splice(index, 1);
      this.rows.forEach((row) => row.splice(index, 1));

      this.templates.forEach((tpl) => {
        for (const [key, value] of Object.entries(tpl.bindings)) {
          if (value === index) delete tpl.bindings[key];
          else if (value > index) tpl.bindings[key] = value - 1;
        }
      });

      this.saveDraft();
    },

    removeRow(index) {
      this.rows.splice(index, 1);
      this.saveDraft();
    },

    updateCell(rowIndex, columnIndex, value) {
      this.rows[rowIndex][columnIndex] = value;
      this.saveDraft();
    },

    addTemplate() {
      this.templates.push({
        id: Date.now().toString(),
        label: `视频模板 ${this.templates.length + 1}`,
        task: {
          bgPath: '',
          overlays: [
            { type: 'textcard', title_text: '标题', body_text: '内容' },
          ],
        },
        bindings: {},
      });
      this.saveDraft();
    },

    removeTemplate(index) {
      this.templates.splice(index, 1);
      this.saveDraft();
    },

    clearAll() {
      if (window.confirm('清空所有表格数据？')) {
        this.rows = [];
        this.initTable();
      }
    },

    async saveDraft() {
      if (!this.isLoaded) return;
      const draft = {
        columns: JSON.parse(JSON.stringify(toRaw(this.columns))),
        rows: JSON.parse(JSON.stringify(toRaw(this.rows))),
        templates: JSON.parse(JSON.stringify(toRaw(this.templates))),
      };
      await localforage.setItem(DRAFT_KEY, draft);
    },

    async loadDraft() {
      try {
        const draft = await localforage.getItem(DRAFT_KEY);
        if (draft?.columns) {
          this.columns = draft.columns;
          this.rows = draft.rows || [];
          this.templates = draft.templates || [];
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.isLoaded = true;
        this.initTable();
      }
    },
  },
});
