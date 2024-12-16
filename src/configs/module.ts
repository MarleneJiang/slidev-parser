import * as vueModule from 'vue'

const layoutsRaw = [
  (import.meta as any).glob('../layouts/*.vue', { eager: true }),
// import.meta.glob('../node_modules/@slidev/theme-default/layouts/*.vue', { eager: true }),
] as any[]

function loadModuleConfig() {
  const moduleLoaders: Record<string, () => Promise<any>> = Object.create(null)
  moduleLoaders.vue = async () => vueModule
  // moduleLoaders['@slidev/client/context.ts'] = async () => import('@slidev/client/context') // 用于处理formatter 转成 props

  const layouts: Record<string, any> = {}

  for (const raw of layoutsRaw) {
    for (const path in raw) {
      const name = path.match(/([^/]+)\.vue$/)![1]
      layouts[name] = raw[path]
    }
  }

  for (const name in layouts) {
    moduleLoaders[`/@fs/slidev-layouts:${name}`] = async () => layouts[name]
  }
  return { moduleLoaders, layouts }
}
export const { moduleLoaders, layouts } = loadModuleConfig()
