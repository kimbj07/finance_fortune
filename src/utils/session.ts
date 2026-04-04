/**
 * 익명 세션 트래킹 (localStorage UUID)
 */

const SESSION_KEY = 'fortune_session_id'

function generateUUID(): string {
  return crypto.randomUUID()
}

export function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = generateUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
