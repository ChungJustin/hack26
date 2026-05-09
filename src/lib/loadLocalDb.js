const base = import.meta.env.BASE_URL || '/'

function jsonUrl(filename) {
  const root = base.endsWith('/') ? base : `${base}/`
  return `${root}local_db/${filename}`
}

async function fetchJson(filename) {
  const res = await fetch(jsonUrl(filename))
  if (!res.ok) {
    throw new Error(`로컬 DB 로드 실패: ${filename} (${res.status})`)
  }
  return res.json()
}

export async function loadGroupsPayload() {
  return fetchJson('groups.json')
}

export async function loadUsersPayload() {
  return fetchJson('users.json')
}

export function resolveUserRecord(usersPayload, rawUserId) {
  const key = String(rawUserId ?? '').trim()
  if (!key) return null
  const users = usersPayload?.users
  if (!users || typeof users !== 'object') return null
  return users[key] ?? null
}
