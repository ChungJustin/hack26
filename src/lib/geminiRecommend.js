/**
 * Gemini API 키: 피드 화면 입력값 → localStorage → VITE_GEMINI_API_KEY 순으로 사용.
 * 브라우저에 키를 두면 노출될 수 있으니 해커톤/데모용으로만 사용하세요.
 */

export const GEMINI_API_KEY_STORAGE = 'sikgu_gemini_api_key'

const GEMINI_MODEL = 'gemini-2.5-flash'

/** 디버그·에러 시 UI에 넘길 때 사용 */
export class GeminiRecommendError extends Error {
  /**
   * @param {string} message
   * @param {Record<string, unknown> | null} [debug]
   */
  constructor(message, debug = null) {
    super(message)
    this.name = 'GeminiRecommendError'
    this.debug = debug
  }
}

function buildGeminiDebug(data, candidate, combinedText, extractedPayload) {
  const parts = candidate?.content?.parts
  return {
    model: GEMINI_MODEL,
    finishReason: candidate?.finishReason ?? null,
    finishMessage: candidate?.finishMessage ?? null,
    usageMetadata: data?.usageMetadata ?? null,
    textParts:
      Array.isArray(parts) ?
        parts.map((p) => ({
          thought: !!p?.thought,
          text: p?.text ?? '',
        }))
      : [],
    combinedTextUsedForParse: combinedText,
    extractedPayloadCandidate: extractedPayload ?? null,
    fullGenerateContentResponse: data ?? null,
  }
}

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

/** 첫 번째 균형 잡힌 JSON 배열/객체 슬라이스 (문자열 내부는 단순 처리) */
function sliceBalancedJson(text, open, close) {
  const start = text.indexOf(open)
  if (start === -1) return null
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (esc) {
      esc = false
      continue
    }
    if (inStr) {
      if (c === '\\') esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') {
      inStr = true
      continue
    }
    if (c === open) depth++
    else if (c === close) {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}

function extractJsonPayload(text) {
  let t = String(text ?? '').trim()
  if (!t) return ''

  const fullFence = /^```(?:json)?\s*([\s\S]*?)```$/im
  let m = t.match(fullFence)
  if (m) return m[1].trim()

  for (const block of t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)) {
    const chunk = block[1].trim()
    if (chunk.startsWith('{') || chunk.startsWith('[')) return chunk
  }

  const tryParse = (s) => {
    try {
      JSON.parse(s)
      return s
    } catch {
      return null
    }
  }

  if (tryParse(t)) return t

  const arr = sliceBalancedJson(t, '[', ']')
  if (arr && tryParse(arr)) return arr

  const obj = sliceBalancedJson(t, '{', '}')
  if (obj && tryParse(obj)) return obj

  return t
}

/** 파싱 결과를 항상 배열로 정규화 (스키마 객체 또는 순수 배열) */
function normalizeRecommendationsPayload(parsed) {
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') {
    const keys = ['recommendations', 'items', 'groups', 'results']
    for (const k of keys) {
      const v = parsed[k]
      if (Array.isArray(v)) return v
    }
  }
  return null
}

/**
 * @param {{ apiKey: string, userSummary: object, groups: object[], userNote?: string }} params
 * @returns {Promise<{ items: { id: string, reason: string }[], debug: Record<string, unknown> }>}
 */
export async function fetchGeminiGroupRecommendations({ apiKey, userSummary, groups, userNote }) {
  const key = String(apiKey ?? '').trim()
  if (!key) {
    throw new GeminiRecommendError('Gemini API 키가 비어 있어요.')
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

  const note = String(userNote ?? '').trim()

  const prompt = `당신은 한국 1인 가구 식생활 공유 앱 "식구(Sikgu)"의 추천 도우미입니다.

아래 사용자 정보와 모집 그룹 목록을 보고, 이 사용자에게 가장 잘 맞는 그룹 최대 5개를 고르세요.
반드시 그룹 목록에 있는 id만 사용하세요. 존재하지 않는 id를 만들지 마세요.
${
  note ?
    `
사용자가 이번 추천 요청에 직접 적은 의견입니다. 프로필·니즈 정보와 함께 반영해 우선순위와 추천 이유를 조정하세요:
"""
${note}
"""
`
  : ''
}
사용자(JSON):
${JSON.stringify(userSummary, null, 2)}

그룹 목록(JSON 배열):
${JSON.stringify(slimGroups, null, 2)}

응답은 API가 요구하는 JSON 스키마만 따르세요. explanations나 마크다운, 코드 블록은 넣지 마세요.
recommendations 배열의 각 항목은 목록에 있는 그룹 id와 한국어 reason만 포함하세요.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`

  const generationConfig = {
    temperature: 0.35,
    // thinking 토큰 + JSON 본문 여유 (2.5 Flash는 thinking에 예산을 쓰면 잘리기 쉬움)
    maxOutputTokens: 8192,
    thinkingConfig: {
      thinkingBudget: 0,
    },
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'OBJECT',
      properties: {
        recommendations: {
          type: 'ARRAY',
          maxItems: 5,
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
              reason: { type: 'STRING' },
            },
            required: ['id', 'reason'],
            propertyOrdering: ['id', 'reason'],
          },
        },
      },
      required: ['recommendations'],
      propertyOrdering: ['recommendations'],
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data?.error?.message || res.statusText || 'Gemini 요청 실패'
    throw new GeminiRecommendError(msg, { fullGenerateContentResponse: data })
  }

  const candidate = data?.candidates?.[0]
  if (!candidate?.content?.parts?.length) {
    const block = data?.promptFeedback?.blockReason
    const msg = block
      ? `Gemini가 응답을 차단했어요: ${block}`
      : 'Gemini가 빈 응답을 반환했어요. 잠시 후 다시 시도해 주세요.'
    throw new GeminiRecommendError(msg, buildGeminiDebug(data, candidate, '', null))
  }

  const text = candidate.content.parts
    .filter((p) => !p.thought)
    .map((p) => p.text)
    .filter(Boolean)
    .join('')

  if (!String(text).trim()) {
    throw new GeminiRecommendError(
      'Gemini가 JSON 본문을 내보내지 않았어요. thinking 전용 응답일 수 있어요. 잠시 후 다시 시도해 주세요.',
      buildGeminiDebug(data, candidate, text, null),
    )
  }

  const raw = extractJsonPayload(text)
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (e) {
    throw new GeminiRecommendError(
      'Gemini 응답을 JSON으로 파싱하지 못했어요. 다시 시도해 주세요.',
      { ...buildGeminiDebug(data, candidate, text, raw), parseError: String(e) },
    )
  }

  const list = normalizeRecommendationsPayload(parsed)
  if (!list) {
    throw new GeminiRecommendError('Gemini 응답에 recommendations 배열이 없어요.', {
      ...buildGeminiDebug(data, candidate, text, raw),
      parsedSnapshot: parsed,
    })
  }

  const fr = candidate.finishReason
  const truncated =
    fr === 'MAX_TOKENS' ||
    fr === 'FINISH_REASON_MAX_TOKENS' ||
    fr === 2

  const validIds = new Set(slimGroups.map((g) => g.id))
  const items = list
    .filter((item) => item && validIds.has(String(item.id)))
    .map((item) => ({
      id: String(item.id),
      reason: String(item.reason ?? '').trim() || '추천 그룹',
    }))
    .slice(0, 5)

  if (truncated && items.length === 0) {
    throw new GeminiRecommendError(
      'Gemini 응답이 잘려 유효한 추천을 만들지 못했어요. 아래 디버그 출력을 확인하거나 다시 시도해 주세요.',
      buildGeminiDebug(data, candidate, text, raw),
    )
  }

  const debug = {
    ...buildGeminiDebug(data, candidate, text, raw),
    truncatedOutput: truncated,
    ...(truncated && items.length > 0 ?
      { note: '출력이 MAX_TOKENS로 잘렸지만, 파싱된 일부 추천은 표시합니다.' }
    : {}),
  }

  return { items, debug }
}
