// 更新动态CSS
export function updateDynamicCss(css: string, styleId = 'dynamic-style') {
  try {
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      styleElement.type = 'text/css'
      document.head.appendChild(styleElement)
    }
    styleElement.innerHTML = css
  }
  catch (error) {
    console.error('更新动态CSS时出错:', error)
  }
}
export function removeCss(styleId = 'dynamic-style') {
  const styleElement = document.getElementById(styleId)
  if (styleElement) {
    styleElement.remove()
  }
}
