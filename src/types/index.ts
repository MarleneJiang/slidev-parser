export interface CompileResult {
  js?: string
  css?: string
  errors?: (string | Error)[]
}
