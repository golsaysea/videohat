import { defineStore } from 'pinia';
import localforage from 'localforage';
import { toRaw } from 'vue';

const DRAFT_KEY = 'reels_bulk_v4_scroll_editor';

export const useBulkStore = defineStore('bulk', {
  state: () => ({
    columns: [
      { name: '滚动标题', type: 'text' },
      { name: '滚动正文', type: 'text' },
    ],
    rows: [],
    templates: [],
    isLoaded: false,
  }),

  actions: {
    initTable() {
      if (this.rows.length === 0) {
        for (let i = 0; i < 15; i += 1) this.addRow(false);
      }
      if (this.templates.length === 0) this.addTemplate(false);
      this.normalizeRows();
      this.saveDraft();
    },

    normalizeRows() {
      if (!this.columns.length) this.columns.push({ name: '新列', type: 'text' });
      this.columns.forEach((column) => {
        if (!column.type) column.type = 'text';
      });
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
      this.templates.forEach((template) => {
        for (const [key, value] of Object.entries(template.bindings)) {
          if (value === index) delete template.bindings[key];
          else if (value > index) template.bindings[key] = value - 1;
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

    addTemplate(save = true) {
      this.templates.push({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        label: `模板 ${this.templates.length + 1}`,
        bindings: this.createAutoBindings(),
      });
      if (save) this.saveDraft();
    },

    createAutoBindings() {
      const bindings = {};
      this.columns.forEach((column, index) => {
        const name = String(column.name || '').toLowerCase();
        if (name.includes('标题') || name.includes('title')) bindings.scroll_title = index;
        if (name.includes('正文') || name.includes('内容') || name.includes('content') || name.includes('body')) bindings.content = index;
      });
      return bindings;
    },

    autoBindTemplate(index) {
      if (!this.templates[index]) return;
      this.templates[index].bindings = this.createAutoBindings();
      this.saveDraft();
    },

    removeTemplate(index) {
      this.templates.splice(index, 1);
      this.saveDraft();
    },

    clearAll() {
      if (window.confirm('清空所有数据？')) {
        this.rows = [];
        this.initTable();
      }
    },

    async saveDraft() {
      if (!this.isLoaded) return;
      await localforage.setItem(DRAFT_KEY, {
        columns: JSON.parse(JSON.stringify(toRaw(this.columns))),
        rows: JSON.parse(JSON.stringify(toRaw(this.rows))),
        templates: JSON.parse(JSON.stringify(toRaw(this.templates))),
      });
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
