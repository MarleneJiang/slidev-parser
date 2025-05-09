// import type Token from 'markdown-it/lib/token'
// import markdownItLink from '@slidev/cli/node/syntax/markdown-it/markdown-it-link'
import MarkdownIt from 'markdown-it'

type Token = any
export const sharedMd = MarkdownIt({ html: true })
// sharedMd.use(markdownItLink)

export function stringifyMarkdownTokens(tokens: Token[]) {
  return tokens.map(token => token.children
    ?.filter((t: { type: string, content: string }) => ['text', 'code_inline'].includes(t.type) && !t.content.match(/^\s*$/))
    .map((t: { content: string }) => t.content.trim())
    .join(' '))
    .filter(Boolean)
    .join(' ')
}

export function renderNote(text: string = '') {
  let clickCount = 0
  const html = sharedMd.render(text
    // replace [click] marker with span
    .replace(/\[click(?::(\d+))?\]/gi, (_, count = 1) => {
      clickCount += Number(count)
      return `<span class="slidev-note-click-mark" data-clicks="${clickCount}"></span>`
    }),
  )

  return html
}
