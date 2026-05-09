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

const LOCAL_FEED_GROUPS_KEY = 'sikgu_local_feed_groups_v1'

export function readLocalFeedGroups() {
  try {
    const raw = localStorage.getItem(LOCAL_FEED_GROUPS_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function writeLocalFeedGroups(groups) {
  localStorage.setItem(LOCAL_FEED_GROUPS_KEY, JSON.stringify(groups))
}

export function prependLocalFeedGroup(group) {
  const list = readLocalFeedGroups()
  writeLocalFeedGroups([group, ...list])
}

export function mergeServerAndLocalFeedGroups(serverList, localList) {
  const server = Array.isArray(serverList) ? serverList : []
  const local = Array.isArray(localList) ? localList : []
  const seen = new Set(local.map((g) => g.id).filter(Boolean))
  const rest = server.filter((g) => g?.id && !seen.has(g.id))
  return [...local, ...rest]
}

const JOINED_GROUPS_STORAGE_KEY = 'sikgu_joined_groups_v1'

/** @returns {Record<string, string[]>} */
function readJoinedGroupsMap() {
  try {
    const raw = localStorage.getItem(JOINED_GROUPS_STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return {}
    return data
  } catch {
    return {}
  }
}

function writeJoinedGroupsMap(map) {
  localStorage.setItem(JOINED_GROUPS_STORAGE_KEY, JSON.stringify(map))
}

export function readJoinedGroupIds(userId) {
  const key = String(userId ?? '').trim()
  if (!key) return []
  const map = readJoinedGroupsMap()
  const ids = map[key]
  return Array.isArray(ids) ? ids.map(String).filter(Boolean) : []
}

export function setJoinedGroupIdsForUser(userId, ids) {
  const key = String(userId ?? '').trim()
  if (!key) return
  const map = readJoinedGroupsMap()
  const next = []
  const seen = new Set()
  for (const id of Array.isArray(ids) ? ids : []) {
    const s = String(id)
    if (!s || seen.has(s)) continue
    seen.add(s)
    next.push(s)
  }
  map[key] = next
  writeJoinedGroupsMap(map)
}

/** 참여 추가(맨 앞) / 이미 있으면 제거. 갱신된 id 배열 반환 */
export function toggleJoinedGroupForUser(userId, groupId) {
  const gid = String(groupId ?? '').trim()
  if (!gid) return readJoinedGroupIds(userId)
  let list = readJoinedGroupIds(userId)
  if (list.includes(gid)) {
    list = list.filter((x) => x !== gid)
  } else {
    list = [gid, ...list.filter((x) => x !== gid)]
  }
  setJoinedGroupIdsForUser(userId, list)
  return list
}

/** 이 브라우저에 저장된 참여 기록 기준, 해당 그룹에 참석 신청한 아이디 목록 */
export function getAttendeeUserIdsForGroup(groupId) {
  const gid = String(groupId ?? '').trim()
  if (!gid) return []
  const map = readJoinedGroupsMap()
  const out = []
  for (const [uid, ids] of Object.entries(map)) {
    const key = String(uid).trim()
    if (!key || !Array.isArray(ids)) continue
    if (ids.some((x) => String(x) === gid)) out.push(key)
  }
  return out.sort((a, b) => a.localeCompare(b, 'ko'))
}
