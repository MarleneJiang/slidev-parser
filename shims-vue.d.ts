// filepath: /Users/marlene/code/slidev-parser/shims-vue.d.ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, any>
  export default component
}
