import type { Component } from 'vue'
import * as vueModule from 'vue'
import { compileVue } from '../compiler/vue'
import RemoteComp from '../components/RemoteComp.vue'
import { evalJs } from './moduleEval'

interface ModuleWrapper {
  default: Component
}

function wrapComponentAsModule(component: Component): ModuleWrapper {
  return {
    default: component,
  }
}

const layoutsRaw = [
  (import.meta as any).glob('../layouts/*.vue', { eager: true }),
  // (import.meta as any).glob('../components/RemoteComp.vue', { eager: true }),
] as any[]

function loadModuleConfig() {
  const moduleLoaders: Record<string, () => Promise<any>> = Object.create(null)
  moduleLoaders.vue = async () => vueModule
  moduleLoaders['built-in:remote'] = async () => wrapComponentAsModule(RemoteComp)
  // moduleLoaders['@slidev/client/context.ts'] = async () => import('@slidev/client/context') // 用于处理formatter 转成 props

  const layouts: Record<string, any> = {}

  for (const raw of layoutsRaw) {
    for (const path in raw) {
      const name = path.match(/([^/]+)\.vue$/)![1]
      layouts[name] = raw[path]
      moduleLoaders[`/@fs/slidev-layouts:${name}`] = async () => layouts[name]
    }
  }
  // 注册自定义组件的方法
  const registerStringComponent = async (name: string, sfcCode: string, sfcOptions: any = {}) => {
    // 如果不存在<template>和</template>则跳过
    if (!sfcCode.includes('<template>') || !sfcCode.includes('</template>'))
      return
    const vueObj = await compileVue(`${name}.vue`, sfcCode, sfcOptions)
    const vueSfcModule = (await evalJs(vueObj.js!, '')())
    moduleLoaders[`custom:${name}`] = async () => vueSfcModule
  }
  // 注册自定义组件的方法
  const registerCustomComponent = async (name: string, component: Component) => {
    const wrappedModule = wrapComponentAsModule(component)
    moduleLoaders[`custom:${name}`] = async () => wrappedModule
  }
  // 添加自定义组件解析器
  const resolveCustomComponent = (specifier: string) => {
    if (`custom:${specifier}` in moduleLoaders) {
      // const name = specifier.slice(7)
      return moduleLoaders[`custom:${specifier}`]?.()
    }
    return null
  }
  return { moduleLoaders, layouts, registerCustomComponent, resolveCustomComponent, registerStringComponent }
}
export const { moduleLoaders, layouts, registerCustomComponent, resolveCustomComponent, registerStringComponent } = loadModuleConfig()
