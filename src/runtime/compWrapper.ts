import type { Component } from 'vue'
import { templateInjectRemoteComp } from '../configs/common'

export function createCustomCompWrapperPlugin(components: Record<string, Component | string>) {
  return {
    name: 'slidev:custom-comp-wrapper',
    transform(code: string) {
      if (!code.includes('<script setup'))
        return code

      const setupTag = code.match(/^<script setup.*>/m)
      if (!setupTag)
        return code

      // 生成导入语句
      const imports = Object.entries(components)
        .map(([name]) => `import ${name} from "custom:${name}"`)
        .join('\n')

      // 注入导入语句到 setup 块
      return code.replace(
        setupTag[0],
        `${setupTag[0]}\n${imports}\n`,
      )
    },
  }
}

export function createBuiltInCompWrapperPlugin() {
  return {
    name: 'slidev:built-in-comp-wrapper',
    transform(code: string) {
      if (!code.includes('<script setup'))
        return code

      const setupTag = code.match(/^<script setup.*>/m)
      if (!setupTag)
        return code

      // 生成导入语句
      const imports = [templateInjectRemoteComp].join('\n')

      // 注入导入语句到 setup 块
      return code.replace(
        setupTag[0],
        `${setupTag[0]}\n${imports}\n`,
      )
    },
  }
}
