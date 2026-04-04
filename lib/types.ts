/**
 * API Types (서버사이드)
 */

export type VercelRequest = {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
}

export type VercelResponse = {
  status: (code: number) => VercelResponse
  setHeader: (name: string, value: string) => VercelResponse
  json: (body: unknown) => void
  end: () => void
}

export interface ValidationError {
  field: string
  message: string
}
