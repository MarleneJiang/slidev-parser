<script lang="ts" setup>
import type { LanguageSupport } from '@codemirror/language'
// CodeMirror extensions
import { markdown as md } from '@codemirror/lang-markdown'
import { ref, type Ref } from 'vue'
// Load component
import CodeMirror from 'vue-codemirror6'
import { vitesse } from '../composables/theme'
import { inputMDC } from '../composables/url'
/** Dark mode */
const dark: Ref<boolean> = ref(
  window.matchMedia('(prefers-color-scheme: dark)').matches,
)

/**
 * CodeMirror Language
 *
 * @see {@link https://codemirror.net/6/docs/ref/#language | @codemirror/language}
 */
const lang: LanguageSupport = md()

/**
 * Internationalization Config.
 * In this example, the display language to Japanese.
 * Must be reactive when used in combination with vue-i18n.
 *
 * @see {@link https://codemirror.net/6/examples/translate/ | Example: Internationalization}
 */
const phrases: Record<string, string> = {
  // @codemirror/view
  'Control character': '制御文字',
  // @codemirror/commands
  'Selection deleted': '選択を削除',
  // @codemirror/language
  'Folded lines': '折り畳まれた行',
  'Unfolded lines': '折り畳める行',
  'to': '行き先',
  'folded code': '折り畳まれたコード',
  'unfold': '折り畳みを解除',
  'Fold line': '行を折り畳む',
  'Unfold line': '行の折り畳む解除',
  // @codemirror/search
  'Go to line': '行き先の行',
  'go': 'OK',
  'Find': '検索',
  'Replace': '置き換え',
  'next': '▼',
  'previous': '▲',
  'all': 'すべて',
  'match case': '一致条件',
  'by word': '全文検索',
  'regexp': '正規表現',
  'replace': '置き換え',
  'replace all': 'すべてを置き換え',
  'close': '閉じる',
  'current match': '現在の一致',
  'replaced $ matches': '$ 件の一致を置き換え',
  'replaced match on line $': '$ 行の一致を置き換え',
  'on line': 'した行',
  // @codemirror/autocomplete
  'Completions': '自動補完',
  // @codemirror/lint
  'Diagnostics': 'エラー',
  'No diagnostics': 'エラーなし',
}
</script>

<template>
  <CodeMirror
    v-model="inputMDC"
    basic
    relative
    font-mono
    text-sm
    data-enable-grammarly="false"
    h-full
    :dark="dark"
    :lang="lang"
    :phrases="phrases"
    :extensions="[vitesse]"
  />
</template>

<style>
#gtx-trans,
grammarly-extension,
deepl-inline-translate,
grammarly-popups,
deepl-inline-popup,
grammarly-desktop-integration {
    display: none!important;
}

.cm-editor {
  height: 100% !important;
  width: 100% !important;
  font-family: inherit;
}
.cm-content {
  cursor: text !important;
}

:root {
  --cm-font-family: 'Fira Code', monospace;
  --cm-foreground: #393a3480;
  --cm-background: #fdfdfd;
  --cm-comment: #a0ada0;
  --cm-string: #b56959;
  --cm-number: #296aa3;
  --cm-variable: #59873a;
  --cm-keyword: #1c6b48;
  --cm-property: #b58451;
  --cm-definition-keyword: #ab5959;
  --cm-punctuation: #8e8f8b;
  --cm-decorator: #b07d48;
  --cm-line-highlight-background: #c9c9c910;
  --cm-line-highlight-border: #b0b0b030;
  --cm-tooltip-background: #fdfdfd;
  --cm-selection-background: #eeeeee;
  --cm-border: #9ca3af1a;
  /* scrollbars colors */
  --cm-ttc-c-thumb: #eee;
  --cm-ttc-c-track: white;
}

html.dark {
  --cm-scheme: dark;
  --cm-foreground: #d4cfbf80;
  --cm-background: #121212;
  --cm-comment: #758575;
  --cm-string: #d48372;
  --cm-keyword: #4d9375;
  --cm-number: #6394bf;
  --cm-variable: #c2b36e;
  --cm-property: #dd8e6e;
  --cm-definition-keyword: #cb7676;
  --cm-punctuation: #858585;
  --cm-decorator: #bd976a;
  --cm-line-number: #dedcd530;
  --cm-line-number-gutter: #eeeeee;
  --cm-line-highlight-background: #4d4d4d29;
  --cm-line-highlight-border: #3a3a3a80;
  --cm-tooltip-background: #121212;
  --cm-selection-background: #242424;
  /* scrollbars colors */
  --cm-ttc-c-thumb: #222;
  --cm-ttc-c-track: #111;
}

.highlighted, .highlighted > span {
  border-bottom: 1px dashed currentColor;
}
.cm-scroller::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.full-scrolls .cm-scroller,
.scrolls {
  overflow: auto !important;
  height: calc(100vh - 2px) !important;
  scrollbar-width: thin;
  scrollbar-color: var(--cm-ttc-c-thumb) var(--cm-ttc-c-track);
}
.scrolls-sidebar {
  height: calc(100vh - 25px - 1.5rem - 65px - 1rem - 2px) !important;
}
.overview-scrolls .cm-scroller {
  --use-overview-scrolls: var(--overview-scrolls, calc(100vh - 116px - 1rem - 61px - 1rem - 2px));
  height: var(--use-overview-scrolls) !important;
}
.module-scrolls .cm-scroller {
  --use-module-scrolls: var(--module-scrolls, calc(100vh - 41px - 2.5rem));
  height: var(--use-module-scrolls) !important;
}
.repl-scrolls .cm-scroller {
  --use-repl-scrolls: var(--repl-scrolls, calc(100vh - 41px - 2.5rem));
  height: var(--use-repl-scrolls) !important;
}

.cm-scroller::-webkit-scrollbar-track {
  background: var(--cm-ttc-c-track);
}
.cm-scroller::-webkit-scrollbar-thumb {
  background-color: var(--cm-ttc-c-thumb);
  border-radius: 3px;
  border: 2px solid var(--cm-ttc-c-thumb);
}
.cm-scroller::-webkit-scrollbar-corner {
  background-color: var(--cm-ttc-c-track);
}
</style>
