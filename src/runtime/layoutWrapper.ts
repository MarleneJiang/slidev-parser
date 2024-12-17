import { ensurePrefix, slash } from '@antfu/utils'
import { bold, gray, red, yellow } from 'kolorist'
import { regexSlideSourceId, templateInjectRemoteComp } from '../configs/common'

export function toAtFS(path: string) {
  return `/@fs${ensurePrefix('/', slash(path))}`
}

export function createLayoutWrapperPlugin(
  { data, utils }: any,
) {
  return {
    name: 'slidev:layout-wrapper',
    transform(code: string, id: string) {
      const match = id.match(regexSlideSourceId)
      if (!match)
        return
      const [, no, type] = match
      if (type !== 'md')
        return
      const index = +no
      const layouts = utils.getLayouts()
      const rawLayoutName = data.slides[index]?.frontmatter?.layout ?? data.slides[0]?.frontmatter?.default?.layout
      const frontmatter = data.slides[index]?.frontmatter ?? data.slides[0]?.frontmatter?.default
      const importFormatterCode = `const $frontmatter = ${JSON.stringify(frontmatter)}`
      let layoutName = rawLayoutName || 'default'
      if (!layouts[layoutName]) {
        console.error(red(`\nUnknown layout "${bold(layoutName)}".${yellow(' Available layouts are:')}`)
          + Object.keys(layouts).map((i, idx) => (idx % 3 === 0 ? '\n    ' : '') + gray(i.padEnd(15, ' '))).join('  '))
        console.error()
        layoutName = 'default'
      }

      const setupTag = code.match(/^<script setup.*>/m)
      if (!setupTag)
        throw new Error(`[Slidev] Internal error: <script setup> block not found in slide ${index + 1}.`)

      const templatePart = code.slice(0, setupTag.index!)
      const scriptPart = code.slice(setupTag.index!)

      const bodyStart = templatePart.indexOf('<template>') + 10
      const bodyEnd = templatePart.lastIndexOf('</template>')
      let body = code.slice(bodyStart, bodyEnd).trim()
      if (body.startsWith('<div>') && body.endsWith('</div>'))
        body = body.slice(5, -6)
      return [
        templatePart.slice(0, bodyStart),
        `<InjectedLayout v-bind="$frontmatter">\n${body}\n</InjectedLayout>`,
        templatePart.slice(bodyEnd),
        scriptPart.slice(0, setupTag[0].length),
        `import InjectedLayout from "${toAtFS(layouts[layoutName])}"`,
        templateInjectRemoteComp,
        importFormatterCode,
        // templateImportContextUtils,
        // templateInitContext,
        // '$clicksContext.setup()',
        // templateInjectionMarker,
        scriptPart.slice(setupTag[0].length),
      ].join('\n')
    },
  }
}
