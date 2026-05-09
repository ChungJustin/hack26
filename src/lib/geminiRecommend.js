/**
 * Gemini API 키: 피드 화면 입력값 → localStorage → VITE_GEMINI_API_KEY 순으로 사용.
 * 브라우저에 키를 두면 노출될 수 있으니 해커톤/데모용으로만 사용하세요.
 */

export const GEMINI_API_KEY_STORAGE = 'sikgu_gemini_api_key'

const GEMINI_MODEL = 'gemini-2.5-flash'

export function readStoredGeminiApiKey() {
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE) ?? ''
  } catch {
    return ''
  }
}

export function writeStoredGeminiApiKey(key) {
  try {
    if (key) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, key)
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE)
    }
  } catch {
    /* ignore */
  }
}

/** UI 입력값 우선, 없으면 env, 없으면 localStorage */
export function getEffectiveGeminiApiKey(inputDraft) {
  const fromInput = String(inputDraft ?? '').trim()
  if (fromInput) return fromInput
  const fromEnv = String(import.meta.env.VITE_GEMINI_API_KEY ?? '').trim()
  if (fromEnv) return fromEnv
  return readStoredGeminiApiKey().trim()
}

function stripJsonFence(text) {
  let t = String(text ?? '').trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im
  const m = t.match(fence)
  if (m) t = m[1].trim()
  return t
}

/**
 * @param {{ apiKey: string, userSummary: object, groups: object[] }} params
 * @returns {Promise<{ id: string, reason: string }[]>}
 */
export async function fetchGeminiGroupRecommendations({ apiKey, userSummary, groups }) {
  const key = String(apiKey ?? '').trim()
  if (!key) {
    throw new Error('Gemini API 키가 비어 있어요.')
  }

  const slimGroups = (Array.isArray(groups) ? groups : []).map((g) => ({
    id: g.id,
    title: g.title,
    body: g.body,
    category: g.category,
    tag: g.tag,
    distanceMeters: g.distanceMeters,
    walkMinutes: g.walkMinutes,
  }))

  const prompt = `당신은 한국 1인 가구 식생활 공유 앱 "식구(Sikgu)"의 추천 도우미입니다.

아래 사용자 정보와 모집 그룹 목록을 보고, 이 사용자에게 가장 잘 맞는 그룹 최대 5개를 고르세요.
반드시 그룹 목록에 있는 id만 사용하세요. 존재하지 않는 id를 만들지 마세요.

사용자(JSON):
${JSON.stringify(userSummary, null, 2)}

그룹 목록(JSON 배열):
${JSON.stringify(slimGroups, null, 2)}

응답은 반드시 JSON 배열만 출력하세요. 형식:
[{"id":"그룹id","reason":"한국어로 한두 문장, 왜 맞는지"}]`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 1024,
      },
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data?.error?.message || res.statusText || 'Gemini 요청 실패'
    throw new Error(msg)
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? ''
  const raw = stripJsonFence(text)
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Gemini 응답을 JSON으로 파싱하지 못했어요. 다시 시도해 주세요.')
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini 응답 형식이 배열이 아니에요.')
  }

  const validIds = new Set(slimGroups.map((g) => g.id))
  return parsed
    .filter((item) => item && validIds.has(String(item.id)))
    .map((item) => ({
      id: String(item.id),
      reason: String(item.reason ?? '').trim() || '추천 그룹',
    }))
    .slice(0, 5)
}
