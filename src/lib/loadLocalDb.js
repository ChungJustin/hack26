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

const LOCAL_USERS_STORAGE_KEY = 'sikgu_local_users_v1'

export function readLocalUsersMap() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? data : {}
  } catch {
    return {}
  }
}

export function writeLocalUsersMap(map) {
  localStorage.setItem(LOCAL_USERS_STORAGE_KEY, JSON.stringify(map))
}

export function upsertLocalUser(userId, record) {
  const key = String(userId ?? '').trim()
  if (!key) return
  const map = readLocalUsersMap()
  map[key] = record
  writeLocalUsersMap(map)
}

export async function loadMergedUsersPayload() {
  const seed = await loadUsersPayload()
  const local = readLocalUsersMap()
  return {
    users: { ...(seed.users || {}), ...local },
  }
}

export function resolveUserFromMerged(mergedPayload, rawUserId) {
  const key = String(rawUserId ?? '').trim()
  if (!key) return null
  const users = mergedPayload?.users
  if (!users || typeof users !== 'object') return null
  return users[key] ?? null
}
