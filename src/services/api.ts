/**
 * Fortune API Client
 */

import type { FortuneRequest, FortuneResponse, FortuneError } from '../types'

const API_URL = '/api/fortune'

export async function fetchFortune(request: FortuneRequest): Promise<FortuneResponse> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as FortuneError
    throw new Error(errorData.error || `서버 오류가 발생했습니다 (${response.status})`)
  }

  return response.json() as Promise<FortuneResponse>
}
