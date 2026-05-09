import { AnimatePresence, motion } from 'framer-motion'
import { Bell, MapPin, Sparkles, UserCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  loadGroupsPayload,
  loadMergedUsersPayload,
  mergeServerAndLocalFeedGroups,
  getAttendeeUserIdsForGroup,
  prependLocalFeedGroup,
  readJoinedGroupIds,
  readLocalFeedGroups,
  resolveUserFromMerged,
  toggleJoinedGroupForUser,
  upsertLocalUser,
} from './lib/loadLocalDb'
import {
  fetchGeminiGroupRecommendations,
  GeminiRecommendError,
  getEffectiveGeminiApiKey,
  readStoredGeminiApiKey,
  writeStoredGeminiApiKey,
} from './lib/geminiRecommend'
import { useOnboardingStore } from './store/useOnboardingStore'

const FEED_TABS = ['전체', '반찬', '요리', '공동구매', '배달']

function formatDistanceLine(group) {
  const m = group?.distanceMeters
  const walk = group?.walkMinutes
  if (m == null && walk == null) return null
  const parts = []
  if (walk != null) parts.push(`도보 약 ${walk}분`)
  if (m != null) {
    const n = Number(m)
    parts.push(n >= 1000 ? `직선 약 ${(n / 1000).toFixed(1)}km` : `직선 약 ${Math.round(n)}m`)
  }
  return parts.join(' · ')
}

function GroupAttendeeList({ groupId, currentUserId }) {
  const ids = getAttendeeUserIdsForGroup(groupId)
  if (ids.length === 0) return null
  return (
    <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/70 px-3 py-2.5 text-sm">
      <p className="font-semibold text-orange-950">
        참석 중인 식구 <span className="font-bold text-primary">{ids.length}</span>명
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <li
            key={id}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              id === currentUserId?.trim()
                ? 'bg-primary text-white'
                : 'bg-white text-orange-900/85 ring-1 ring-orange-200/80'
            }`}
          >
            {id}
            {id === currentUserId?.trim() ? ' (나)' : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  const [appPhase, setAppPhase] = useState('identify')
  const [mainView, setMainView] = useState('feed')
  const [stepDirection, setStepDirection] = useState(1)
  const [feedGroups, setFeedGroups] = useState([])
  const [userRecord, setUserRecord] = useState(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [dbError, setDbError] = useState(null)
  const [activeFeedTab, setActiveFeedTab] = useState('전체')
  const [feedSearchInput, setFeedSearchInput] = useState('')
  const [feedSearchApplied, setFeedSearchApplied] = useState('')
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [newGroupBody, setNewGroupBody] = useState('')
  const [newGroupCategory, setNewGroupCategory] = useState('반찬')
  const [geminiKeyInput, setGeminiKeyInput] = useState('')
  const [aiRecItems, setAiRecItems] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiTried, setAiTried] = useState(false)
  const [geminiDebug, setGeminiDebug] = useState(null)
  const [joinedGroupIds, setJoinedGroupIds] = useState([])

  const [draftUserId, setDraftUserId] = useState('')
  const [identifyLoading, setIdentifyLoading] = useState(false)
  const [identifyError, setIdentifyError] = useState(null)

  const {
    step,
    setStep,
    stepOneOptions,
    stepTwoOptions,
    selectedNeeds,
    selectedTalents,
    userId,
    location,
    customNeed,
    toggleNeed,
    toggleTalent,
    setLocation,
    setCustomNeed,
    setUserId,
    hydrateFromUserRecord,
    resetForNewUser,
  } = useOnboardingStore()

  useEffect(() => {
    if (appPhase !== 'main') return undefined

    let cancelled = false

    async function load() {
      setDbLoading(true)
      setDbError(null)
      try {
        const [groupsPayload, mergedUsers] = await Promise.all([
          loadGroupsPayload(),
          loadMergedUsersPayload(),
        ])
        if (cancelled) return
        const serverGroups = Array.isArray(groupsPayload?.groups) ? groupsPayload.groups : []
        const localGroups = readLocalFeedGroups()
        setFeedGroups(mergeServerAndLocalFeedGroups(serverGroups, localGroups))
        setUserRecord(resolveUserFromMerged(mergedUsers, userId))
      } catch (err) {
        if (!cancelled) {
          setDbError(err instanceof Error ? err.message : '데이터를 불러오지 못했어요.')
        }
      } finally {
        if (!cancelled) setDbLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [appPhase, userId])

  useEffect(() => {
    if (appPhase !== 'identify' && appPhase !== 'main') return
    setGeminiKeyInput(readStoredGeminiApiKey())
  }, [appPhase])

  useEffect(() => {
    if (appPhase !== 'main') return
    const uid = userId.trim()
    if (!uid) {
      setJoinedGroupIds([])
      return
    }
    setJoinedGroupIds(readJoinedGroupIds(uid))
  }, [appPhase, userId])

  const joinedGroupsOrdered = useMemo(() => {
    const byId = new Map(feedGroups.map((g) => [g.id, g]))
    return joinedGroupIds.map((id) => byId.get(id)).filter(Boolean)
  }, [feedGroups, joinedGroupIds])

  const filteredGroups = useMemo(() => {
    let list = feedGroups
    if (activeFeedTab !== '전체') {
      list = list.filter((g) => g.category === activeFeedTab)
    }
    const q = feedSearchApplied.trim().toLowerCase()
    if (!q) return list
    return list.filter((g) => {
      const title = String(g.title ?? '').toLowerCase()
      const body = String(g.body ?? '').toLowerCase()
      const tag = String(g.tag ?? '').toLowerCase()
      return title.includes(q) || body.includes(q) || tag.includes(q)
    })
  }, [feedGroups, activeFeedTab, feedSearchApplied])

  const historyEntries = userRecord?.history ?? []
  const profile = userRecord?.profile

  const geminiUserSummary = useMemo(
    () => ({
      userId: userId.trim(),
      location: userRecord?.location || location,
      preferences: userRecord?.preferences || {
        needs: selectedNeeds,
        talents: selectedTalents,
        customNeed,
      },
      profile: profile
        ? {
            displayName: profile.displayName,
            level: profile.level,
          }
        : null,
    }),
    [userId, userRecord, location, selectedNeeds, selectedTalents, customNeed, profile],
  )

  async function handleGeminiRecommend() {
    const key = getEffectiveGeminiApiKey(geminiKeyInput)
    if (!key) {
      setAiError(
        'API 키를 입력하고 저장하거나, 프로젝트 루트 .env에 VITE_GEMINI_API_KEY를 넣은 뒤 dev 서버를 다시 켜 주세요.',
      )
      setAiRecItems([])
      setGeminiDebug(null)
      return
    }
    setAiError(null)
    setGeminiDebug(null)
    setAiLoading(true)
    setAiRecItems([])
    try {
      const { items, debug } = await fetchGeminiGroupRecommendations({
        apiKey: key,
        userSummary: geminiUserSummary,
        groups: feedGroups,
      })
      setAiRecItems(items)
      setGeminiDebug(debug)
      setAiTried(true)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '추천 요청에 실패했어요.')
      setAiRecItems([])
      setGeminiDebug(err instanceof GeminiRecommendError ? err.debug : null)
      setAiTried(true)
    } finally {
      setAiLoading(false)
    }
  }

  function handleToggleJoinGroup(groupId) {
    const uid = userId.trim()
    if (!uid) return
    const next = toggleJoinedGroupForUser(uid, groupId)
    setJoinedGroupIds(next)
  }

  async function handleIdentifyContinue() {
    const id = draftUserId.trim()
    if (!id) {
      setIdentifyError('아이디를 입력해 주세요.')
      return
    }
    setIdentifyLoading(true)
    setIdentifyError(null)
    try {
      if (geminiKeyInput.trim()) {
        writeStoredGeminiApiKey(geminiKeyInput.trim())
      }
      const merged = await loadMergedUsersPayload()
      const record = resolveUserFromMerged(merged, id)
      setUserId(id)
      if (record) {
        hydrateFromUserRecord(id, record)
        setAppPhase('main')
        setMainView('feed')
      } else {
        resetForNewUser(id)
        setAppPhase('onboarding')
      }
    } catch (err) {
      setIdentifyError(err instanceof Error ? err.message : '사용자 정보를 확인하지 못했어요.')
    } finally {
      setIdentifyLoading(false)
    }
  }

  function handleOnboardingFinish() {
    const id = userId.trim()
    if (!id) return
    const newRecord = {
      profile: {
        displayName: id,
        level: 'Sikgu Starter',
        badgeEmoji: '🐣',
        stats: { mealsShared: 0, activeSikgus: 0 },
      },
      location,
      preferences: {
        needs: [...selectedNeeds],
        talents: [...selectedTalents],
        customNeed,
      },
      history: [],
    }
    upsertLocalUser(id, newRecord)
    setAppPhase('main')
    setMainView('feed')
  }

  return (
    <div className="min-h-screen bg-background-warm text-text-main">
      <header className="sticky top-0 z-10 border-b border-orange-100 bg-background-warm/95 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <div className="text-2xl font-extrabold text-primary">Sikgu 🍚</div>
          <div className="flex items-center gap-3 text-primary">
            <Bell size={20} />
            <UserCircle2 size={22} />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20">
        {appPhase === 'identify' ? (
          <section className="mx-auto max-w-md space-y-6 py-16">
            <div className="text-center">
              <p className="text-sm font-semibold text-primary">저희는 식구를 만들어 줍니다 ✨</p>
              <h1 className="mt-3 text-3xl font-extrabold text-orange-950">아이디로 시작하기</h1>
              <p className="mt-2 text-orange-900/75">
                등록된 아이디면 바로 불러오고, 없으면 새 식구 프로필을 만들게요.
              </p>
            </div>
            <div className="rounded-3xl border border-orange-200 bg-white p-6 shadow-sm">
              <label htmlFor="gate-userId" className="block text-sm font-semibold text-orange-950">
                아이디
              </label>
              <input
                id="gate-userId"
                type="text"
                value={draftUserId}
                onChange={(e) => setDraftUserId(e.target.value)}
                placeholder="예: sikgu_justin"
                className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-orange-950 outline-none transition focus:border-primary focus:bg-white"
                autoComplete="username"
              />
              {identifyError ? (
                <p className="mt-2 text-sm text-red-600">{identifyError}</p>
              ) : null}
              <div className="mt-5 border-t border-orange-100 pt-5">
                <label htmlFor="gate-gemini-key" className="block text-sm font-semibold text-orange-950">
                  Gemini API 키 <span className="font-normal text-orange-900/60">(선택)</span>
                </label>
                <input
                  id="gate-gemini-key"
                  type="password"
                  autoComplete="off"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="나중에 피드에서 넣어도 됩니다"
                  className="mt-2 w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-orange-950 outline-none transition focus:border-primary focus:bg-white"
                />
                <p className="mt-1 text-xs text-orange-900/55">
                  입력 후 「계속」하면 이 브라우저에 저장돼요. 비우면 기존에 저장된 키는 그대로 둡니다.
                </p>
              </div>
              <button
                type="button"
                disabled={identifyLoading}
                onClick={handleIdentifyContinue}
                className="mt-4 w-full rounded-full bg-primary py-4 text-lg font-bold text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
              >
                {identifyLoading ? '확인 중…' : '계속'}
              </button>
              <p className="mt-3 text-center text-xs text-orange-900/60">
                시드: <span className="font-medium">sikgu_justin</span>,{' '}
                <span className="font-medium">hacker_one</span>,{' '}
                <span className="font-medium">codingcoding</span>,{' '}
                <span className="font-medium">coding_slave</span>
              </p>
            </div>
          </section>
        ) : null}

        {appPhase === 'onboarding' ? (
          <section className="mx-auto max-w-3xl rounded-3xl border border-orange-200 bg-white p-6 shadow-sm md:mt-12 md:p-8">
            <p className="mb-2 text-sm text-orange-900/70">
              새 식구 <span className="font-semibold text-orange-950">{userId.trim()}</span> — 지역과
              선호를 알려주세요.
            </p>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-orange-950">프로필 만들기 Step {step}</h2>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-primary">
                Step {step}/3
              </span>
            </div>
            <AnimatePresence mode="wait" custom={stepDirection}>
              <motion.div
                key={step}
                custom={stepDirection}
                initial={{ opacity: 0, x: stepDirection > 0 ? 42 : -42 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: stepDirection > 0 ? -42 : 42 }}
                transition={{ duration: 0.22 }}
                className="space-y-5"
              >
                <p className="text-orange-900/80">
                  {step === 1
                    ? '지금 어떤 식생활 고민을 해결하고 싶나요?'
                    : step === 2
                      ? '당신이 식구에게 기여할 수 있는 강점은 무엇인가요?'
                      : '어디에서 식구를 찾고 싶은지 생활권 위치를 입력해 주세요.'}
                </p>

                {step < 3 ? (
                  <div className="grid gap-3">
                    {(step === 1 ? stepOneOptions : stepTwoOptions).map((option) => {
                      const checked =
                        step === 1
                          ? selectedNeeds.includes(option.id)
                          : selectedTalents.includes(option.id)
                      return (
                        <motion.button
                          key={option.id}
                          type="button"
                          whileTap={{ scale: 0.99 }}
                          onClick={() => (step === 1 ? toggleNeed(option.id) : toggleTalent(option.id))}
                          className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                            checked
                              ? 'border-primary bg-orange-100 text-orange-950'
                              : 'border-orange-100 bg-orange-50/60 text-orange-900/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">{option.label}</span>
                            <span
                              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                                checked ? 'bg-primary text-white' : 'bg-white text-orange-300'
                              }`}
                            >
                              {checked ? '✓' : ''}
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="location" className="block text-sm font-semibold text-orange-950">
                        사는 곳 (단지명 / 오피스텔명 / 건물명)
                      </label>
                      <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder="예: 봉명 아이파크, OO 오피스텔"
                        className="w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-orange-950 outline-none transition focus:border-primary focus:bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="customNeed" className="block text-sm font-semibold text-orange-950">
                        추가적으로 같이 해결하고 싶은 식생활 문제는?
                      </label>
                      <textarea
                        id="customNeed"
                        value={customNeed}
                        onChange={(event) => setCustomNeed(event.target.value)}
                        rows={4}
                        placeholder="예: 평일 저녁에 같이 반찬 교환할 식구를 찾고 있어요."
                        className="w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-orange-950 outline-none transition focus:border-primary focus:bg-white"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    setAppPhase('identify')
                    setDraftUserId(userId)
                    return
                  }
                  setStepDirection(-1)
                  setStep(step - 1)
                }}
                className="rounded-full border border-orange-200 bg-white px-6 py-3 font-bold text-orange-950 transition hover:bg-orange-50"
              >
                뒤로가기
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step < 3) {
                    setStepDirection(1)
                    setStep(Math.min(step + 1, 3))
                    return
                  }
                  handleOnboardingFinish()
                }}
                className="rounded-full bg-orange-950 px-6 py-3 font-bold text-white transition hover:bg-primary"
              >
                {step === 1 ? 'Step 2로 가기' : step === 2 ? 'Step 3로 가기' : '시작하기'}
              </button>
            </div>
          </section>
        ) : null}

        {appPhase === 'main' ? (
          <section className="mx-auto max-w-4xl space-y-6 py-8">
            {mainView === 'feed' ? (
              <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs text-orange-900/60">
                  검색은 아래 목록만 걸러요. 새 글은 이 기기 브라우저에만 저장돼요(새로고침 후에도 유지).
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="search"
                    value={feedSearchInput}
                    onChange={(e) => setFeedSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setFeedSearchApplied(feedSearchInput.trim())
                      }
                    }}
                    placeholder="키워드로 식구 그룹 검색…"
                    className="min-w-0 flex-1 rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-orange-950 outline-none transition focus:border-primary focus:bg-white"
                    aria-label="식구 그룹 검색"
                  />
                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setFeedSearchApplied(feedSearchInput.trim())}
                      className="rounded-full bg-orange-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary"
                    >
                      검색
                    </button>
                    {feedSearchApplied ? (
                      <button
                        type="button"
                        onClick={() => {
                          setFeedSearchApplied('')
                          setFeedSearchInput('')
                        }}
                        className="rounded-full border border-orange-200 bg-white px-4 py-3 text-sm font-semibold text-orange-900/80"
                      >
                        초기화
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setCreateGroupOpen((o) => !o)}
                      className="rounded-full border-2 border-primary bg-white px-5 py-3 text-sm font-bold text-primary transition hover:bg-orange-50"
                    >
                      {createGroupOpen ? '닫기' : '식구그룹 만들기'}
                    </button>
                  </div>
                </div>
                {createGroupOpen ? (
                  <div className="mt-4 space-y-3 border-t border-orange-100 pt-4">
                    <p className="text-sm font-semibold text-orange-950">새 식구 그룹</p>
                    <input
                      type="text"
                      value={newGroupTitle}
                      onChange={(e) => setNewGroupTitle(e.target.value)}
                      placeholder="제목 (예: 오늘 저녁 피자 나눠요)"
                      className="w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-2.5 text-orange-950 outline-none focus:border-primary focus:bg-white"
                    />
                    <textarea
                      value={newGroupBody}
                      onChange={(e) => setNewGroupBody(e.target.value)}
                      rows={3}
                      placeholder="설명 (모집 인원, 시간, 나누는 방식 등)"
                      className="w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-2.5 text-orange-950 outline-none focus:border-primary focus:bg-white"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-orange-900/80">
                        카테고리
                        <select
                          value={newGroupCategory}
                          onChange={(e) => setNewGroupCategory(e.target.value)}
                          className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-medium text-orange-950"
                        >
                          {FEED_TABS.filter((t) => t !== '전체').map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const title = newGroupTitle.trim()
                          const body = newGroupBody.trim()
                          if (!title || !body) return
                          const newGroup = {
                            id: `grp_local_${Date.now()}`,
                            title,
                            body,
                            tag: newGroupCategory,
                            category: newGroupCategory,
                            distanceMeters: 400,
                            walkMinutes: 5,
                          }
                          prependLocalFeedGroup(newGroup)
                          setFeedGroups((prev) => {
                            const rest = prev.filter((g) => g.id !== newGroup.id)
                            return [newGroup, ...rest]
                          })
                          setNewGroupTitle('')
                          setNewGroupBody('')
                          setCreateGroupOpen(false)
                        }}
                        className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
                      >
                        등록하기
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreateGroupOpen(false)
                          setNewGroupTitle('')
                          setNewGroupBody('')
                        }}
                        className="rounded-full border border-orange-200 bg-white px-5 py-2 text-sm font-semibold text-orange-900/80"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMainView('feed')}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  mainView === 'feed'
                    ? 'bg-primary text-white'
                    : 'border border-orange-200 bg-white text-orange-900/80'
                }`}
              >
                피드
              </button>
              <button
                type="button"
                onClick={() => setMainView('history')}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  mainView === 'history'
                    ? 'bg-primary text-white'
                    : 'border border-orange-200 bg-white text-orange-900/80'
                }`}
              >
                히스토리
              </button>
              <button
                type="button"
                onClick={() => setMainView('joined')}
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                  mainView === 'joined'
                    ? 'bg-primary text-white'
                    : 'border border-orange-200 bg-white text-orange-900/80'
                }`}
              >
                참석 중
                {joinedGroupIds.length > 0 ? (
                  <span
                    className={`ml-1.5 min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-bold ${
                      mainView === 'joined' ? 'bg-white/25 text-white' : 'bg-orange-100 text-primary'
                    }`}
                  >
                    {joinedGroupIds.length}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftUserId('')
                  setAppPhase('identify')
                }}
                className="ml-auto rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-900/80"
              >
                다른 아이디
              </button>
            </div>

            {mainView === 'feed' ? (
              <>
                <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold text-primary">환영해요!</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-orange-950">내 주변 식구 찾기</h2>
                  <p className="mt-2 text-orange-900/75">
                    관심사와 위치를 바탕으로 식생활을 함께 해결할 식구 그룹을 추천해드려요. 카드의 거리는 내
                    생활권 기준 예상치예요.
                  </p>
                  {userId.trim() ? (
                    <div className="mt-3 space-y-1 text-sm text-orange-900/70">
                      <p>
                        아이디:{' '}
                        <span className="font-semibold text-orange-950">{userId.trim()}</span>
                      </p>
                      {(userRecord?.location || location) ? (
                        <p>
                          생활권:{' '}
                          <span className="font-medium text-orange-950">
                            {userRecord?.location || location}
                          </span>
                        </p>
                      ) : null}
                      {userRecord?.preferences?.needs?.length ? (
                        <p>
                          니즈{' '}
                          <span className="font-medium text-orange-950">
                            {userRecord.preferences.needs.length}
                          </span>
                          개 · 역량{' '}
                          <span className="font-medium text-orange-950">
                            {userRecord.preferences.talents?.length ?? 0}
                          </span>
                          개
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-orange-200 bg-gradient-to-b from-orange-50/80 to-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-primary" size={22} aria-hidden />
                    <h3 className="text-lg font-extrabold text-orange-950">Gemini 맞춤 추천</h3>
                  </div>
                  <p className="mt-1 text-sm text-orange-900/75">
                    시작 화면에서 넣었으면 그대로 이어져요. 여기서 바꿔도 되고, 저장하면 이 브라우저에만
                    보관돼요. 원하면{' '}
                    <code className="rounded bg-orange-100 px-1 text-xs">VITE_GEMINI_API_KEY</code> 환경
                    변수도 사용할 수 있어요.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="min-w-0 flex-1">
                      <label htmlFor="gemini-key" className="text-xs font-semibold text-orange-900/80">
                        Gemini API 키
                      </label>
                      <input
                        id="gemini-key"
                        type="password"
                        autoComplete="off"
                        value={geminiKeyInput}
                        onChange={(e) => setGeminiKeyInput(e.target.value)}
                        placeholder="여기에 붙여 넣기 (연결 전이면 비워 둬도 됨)"
                        className="mt-1 w-full rounded-2xl border border-orange-200 bg-white px-4 py-2.5 text-sm text-orange-950 outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          writeStoredGeminiApiKey(geminiKeyInput.trim())
                          setAiError(null)
                          setGeminiDebug(null)
                        }}
                        className="rounded-full border border-orange-200 bg-white px-4 py-2.5 text-sm font-bold text-orange-950"
                      >
                        키 저장
                      </button>
                      <button
                        type="button"
                        disabled={aiLoading || feedGroups.length === 0}
                        onClick={handleGeminiRecommend}
                        className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {aiLoading ? '추천 중…' : 'AI 추천 받기'}
                      </button>
                    </div>
                  </div>
                  {aiError ? (
                    <p className="mt-3 text-sm text-red-600">{aiError}</p>
                  ) : null}
                  {geminiDebug ? (
                    <details className="mt-3 rounded-2xl border border-orange-200 bg-orange-950/[0.03] p-3">
                      <summary className="cursor-pointer text-xs font-bold text-orange-900/90">
                        Gemini 원시 응답 (디버그) — API JSON 전체
                      </summary>
                      <pre className="mt-2 max-h-[min(70vh,28rem)] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-orange-950/90 p-3 font-mono text-[11px] leading-relaxed text-orange-50">
                        {JSON.stringify(geminiDebug, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                  {!aiLoading && !aiTried && aiRecItems.length === 0 ? (
                    <p className="mt-3 text-sm text-orange-900/60">
                      키를 연결한 뒤 「AI 추천 받기」를 눌러 보세요.
                    </p>
                  ) : null}
                  {!aiLoading && aiTried && aiRecItems.length === 0 && !aiError ? (
                    <p className="mt-3 text-sm text-orange-900/60">
                      이번 요청에서는 표시할 추천이 없었어요. 그룹 목록이 충분한지 확인해 보세요.
                    </p>
                  ) : null}
                  {aiRecItems.length > 0 ? (
                    <ul className="mt-4 space-y-3">
                      {aiRecItems.map((item) => {
                        const g = feedGroups.find((x) => x.id === item.id)
                        if (!g) return null
                        return (
                          <li
                            key={item.id}
                            className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-sm"
                          >
                            <p className="font-bold text-orange-950">{g.title}</p>
                            <p className="mt-1 text-sm text-orange-900/80">{item.reason}</p>
                            {formatDistanceLine(g) ? (
                              <p className="mt-2 text-xs text-orange-900/60">{formatDistanceLine(g)}</p>
                            ) : null}
                            <GroupAttendeeList groupId={g.id} currentUserId={userId} />
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>

                {dbError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {dbError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {FEED_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveFeedTab(tab)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        tab === activeFeedTab
                          ? 'bg-primary text-white'
                          : 'border border-orange-200 bg-white text-orange-900/80'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {dbLoading ? (
                  <p className="text-center text-orange-900/70">식구 그룹을 불러오는 중이에요…</p>
                ) : (
                  <div className="grid gap-4">
                    {filteredGroups.length === 0 ? (
                      <p className="rounded-2xl border border-orange-100 bg-white px-4 py-8 text-center text-orange-900/70">
                        {feedSearchApplied.trim()
                          ? `「${feedSearchApplied.trim()}」에 맞는 그룹이 없어요. 검색어를 바꿔 보세요.`
                          : '이 카테고리에 표시할 그룹이 없어요.'}
                      </p>
                    ) : (
                      filteredGroups.map((group) => (
                        <article
                          key={group.id}
                          className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="text-lg font-bold text-orange-950">{group.title}</h3>
                            <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-primary">
                              {group.tag}
                            </span>
                          </div>
                          {formatDistanceLine(group) ? (
                            <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-orange-900/80">
                              <MapPin className="shrink-0 text-primary" size={16} aria-hidden />
                              <span>{formatDistanceLine(group)}</span>
                            </div>
                          ) : null}
                          <p className="mb-4 text-orange-900/75">{group.body}</p>
                          <GroupAttendeeList groupId={group.id} currentUserId={userId} />
                          <button
                            type="button"
                            onClick={() => handleToggleJoinGroup(group.id)}
                            className={`mt-3 rounded-full px-5 py-2 text-sm font-bold transition ${
                              joinedGroupIds.includes(group.id)
                                ? 'border-2 border-primary bg-orange-50 text-primary hover:bg-orange-100'
                                : 'bg-orange-950 text-white hover:bg-primary'
                            }`}
                          >
                            {joinedGroupIds.includes(group.id) ? '참석 중 · 취소하려면 누르기' : '참여하기'}
                          </button>
                        </article>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : mainView === 'joined' ? (
              <>
                {dbError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {dbError}
                  </div>
                ) : null}

                <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-extrabold text-orange-950">참석 중인 식구 그룹</h2>
                  <p className="mt-2 text-sm text-orange-900/75">
                    피드에서 「참여하기」로 참가 신청한 모임만 모아 보여요. 같은 브라우저·아이디 기준으로 이
                    기기에만 저장돼요.
                  </p>
                </div>

                {dbLoading ? (
                  <p className="text-center text-orange-900/70">식구 그룹을 불러오는 중이에요…</p>
                ) : joinedGroupsOrdered.length === 0 ? (
                  <p className="rounded-2xl border border-orange-100 bg-white px-4 py-10 text-center text-orange-900/70">
                    아직 참석 중인 그룹이 없어요. 「피드」 탭에서 마음에 드는 모임에 참여해 보세요.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {joinedGroupsOrdered.map((group) => (
                      <article
                        key={group.id}
                        className="rounded-3xl border border-primary/30 bg-gradient-to-b from-orange-50/80 to-white p-5 shadow-sm"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="text-lg font-bold text-orange-950">{group.title}</h3>
                          <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                            참석 예정
                          </span>
                        </div>
                        {formatDistanceLine(group) ? (
                          <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-orange-900/80">
                            <MapPin className="shrink-0 text-primary" size={16} aria-hidden />
                            <span>{formatDistanceLine(group)}</span>
                          </div>
                        ) : null}
                        <p className="mb-4 text-orange-900/75">{group.body}</p>
                        <GroupAttendeeList groupId={group.id} currentUserId={userId} />
                        <button
                          type="button"
                          onClick={() => handleToggleJoinGroup(group.id)}
                          className="mt-3 rounded-full border border-orange-200 bg-white px-5 py-2 text-sm font-bold text-orange-950 transition hover:bg-orange-50"
                        >
                          참여 취소
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {dbError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {dbError}
                  </div>
                ) : null}

                <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-primary">저장된 선호 · 지역</h3>
                  {userRecord?.location || location ? (
                    <p className="mt-2 text-sm text-orange-900/80">
                      생활권: {userRecord?.location || location}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-orange-900/60">생활권 정보가 없어요.</p>
                  )}
                  {userRecord?.preferences ? (
                    <div className="mt-3 text-sm text-orange-900/80">
                      <p>
                        니즈 ID: {(userRecord.preferences.needs || []).join(', ') || '—'}
                      </p>
                      <p className="mt-1">
                        역량 ID: {(userRecord.preferences.talents || []).join(', ') || '—'}
                      </p>
                      {userRecord.preferences.customNeed ? (
                        <p className="mt-2 text-orange-900/70">
                          메모: {userRecord.preferences.customNeed}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-orange-900/60">선호 정보가 없어요.</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <article className="rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
                      {profile?.badgeEmoji ?? '👤'}
                    </div>
                    <h3 className="text-xl font-bold text-primary">
                      {profile?.displayName ?? '프로필 없음'}
                    </h3>
                    <p className="text-sm text-orange-900/70">
                      {profile?.level ? `Level: ${profile.level}` : '레벨 정보 없음'}
                    </p>
                  </article>
                  <article className="rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm">
                    <p className="text-sm text-orange-900/70">Total Meals Shared</p>
                    <p className="mt-2 text-4xl font-extrabold text-primary">
                      {profile?.stats?.mealsShared ?? '—'}
                    </p>
                  </article>
                  <article className="rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm">
                    <p className="text-sm text-orange-900/70">Active Sikgus</p>
                    <p className="mt-2 text-4xl font-extrabold text-primary">
                      {profile?.stats?.activeSikgus ?? '—'}
                    </p>
                  </article>
                </div>

                <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-primary">Previous Sikgus 🤝</h2>
                    <button type="button" className="text-sm font-semibold text-primary">
                      See All
                    </button>
                  </div>
                  {!userId.trim() ? (
                    <p className="text-sm text-orange-900/70">아이디가 없어요.</p>
                  ) : dbLoading ? (
                    <p className="text-sm text-orange-900/70">히스토리를 불러오는 중이에요…</p>
                  ) : !userRecord ? (
                    <p className="text-sm text-orange-900/70">
                      사용자 데이터를 찾을 수 없어요. 아이디 게이트에서 다시 시도해 주세요.
                    </p>
                  ) : historyEntries.length === 0 ? (
                    <p className="text-sm text-orange-900/70">아직 기록된 식구가 없어요.</p>
                  ) : (
                    <div className="space-y-3">
                      {historyEntries.map((person) => (
                        <article
                          key={person.id}
                          className="flex items-center justify-between rounded-2xl border border-orange-50 bg-white p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">
                              {person.emoji}
                            </div>
                            <div>
                              <h4 className="font-bold text-orange-950">{person.name}</h4>
                              <p className="text-sm text-orange-900/70">{person.detail}</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-900/70">
                            {person.timeLabel}
                          </span>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        ) : null}
      </main>

      <footer className="border-t border-orange-100 bg-orange-50 py-8 text-center text-sm text-orange-900/70">
        © 2026 Sikgu. Warm meals, better together. 🐥
      </footer>
    </div>
  )
}

export default App
