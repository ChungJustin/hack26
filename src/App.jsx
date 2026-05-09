import { AnimatePresence, motion } from 'framer-motion'
import { Bell, UserCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  loadGroupsPayload,
  loadUsersPayload,
  resolveUserRecord,
} from './lib/loadLocalDb'
import { useOnboardingStore } from './store/useOnboardingStore'

const FEED_TABS = ['전체', '반찬', '요리', '공동구매', '배달']

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showMainFeed, setShowMainFeed] = useState(false)
  const [mainView, setMainView] = useState('feed')
  const [stepDirection, setStepDirection] = useState(1)
  const [feedGroups, setFeedGroups] = useState([])
  const [userRecord, setUserRecord] = useState(null)
  const [dbLoading, setDbLoading] = useState(false)
  const [dbError, setDbError] = useState(null)
  const [activeFeedTab, setActiveFeedTab] = useState('전체')
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
  } = useOnboardingStore()

  useEffect(() => {
    if (!showMainFeed) return undefined

    let cancelled = false

    async function load() {
      setDbLoading(true)
      setDbError(null)
      try {
        const [groupsPayload, usersPayload] = await Promise.all([
          loadGroupsPayload(),
          loadUsersPayload(),
        ])
        if (cancelled) return
        setFeedGroups(Array.isArray(groupsPayload?.groups) ? groupsPayload.groups : [])
        setUserRecord(resolveUserRecord(usersPayload, userId))
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
  }, [showMainFeed, userId])

  const filteredGroups = useMemo(() => {
    if (activeFeedTab === '전체') return feedGroups
    return feedGroups.filter((g) => g.category === activeFeedTab)
  }, [feedGroups, activeFeedTab])

  const historyEntries = userRecord?.history ?? []
  const profile = userRecord?.profile

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
        {!showOnboarding && !showMainFeed ? (
          <>
            <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-16">
              <div className="space-y-5 text-center md:text-left">
                <span className="inline-block rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary">
                  저희는 식구를 만들어 줍니다 ✨
                </span>
                <h1 className="text-4xl font-extrabold leading-tight text-orange-950 md:text-5xl">
                  혼자 먹는 밥에서,
                  <br />
                  함께하는 <span className="text-primary">식구</span>로
                </h1>
                <p className="text-base text-orange-950/75 md:text-lg">
                  1인 가구의 따뜻한 연결, 식구가 시작합니다.
                  <br />
                  더 이상 외로운 식사는 그만! 함께 나누는 즐거움을 느껴보세요.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setShowMainFeed(false)
                    setShowOnboarding(true)
                  }}
                  className="rounded-full bg-primary px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  식구 시작하기 🐣
                </button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
              >
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmvn7JKDeObkDyfgjLIC2wsSnSCBD_FFp_0xn_iCR1teXXvtBjnhkcpHwnYnjMXs4WBHA899gQWYGvbYRYS7pxAdWP8QJFGekw7AD6TV34WT3ae-mzMZR8uyHftsEz2D31dXQnBCWS6t-E8bFzTt8enEzxouWOW1L5DklG0kmApvbLUSUjWOdEJN0XpJU5i2HW2FI-oNbPKRubWfwmrbBfplTel9YTvXXLJSzsoWFydEWGx9CSU90c1QHxM3RkB1CCHREDJO5cmCg"
                    alt="따뜻한 분위기의 식사 모임"
                    className="h-64 w-full object-cover md:h-80"
                  />
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3">
                  <span className="text-2xl">🍱</span>
                  <div>
                    <p className="text-sm font-semibold text-orange-950">오늘의 식구</p>
                    <p className="text-sm text-orange-900/70">강남구 반찬나눔이 진행 중이에요</p>
                  </div>
                </div>
              </motion.div>
            </section>

            <section className="pb-10">
              <h2 className="mb-6 text-center text-2xl font-extrabold text-orange-950 md:text-3xl">
                식구와 함께라면 달라지는 일상 🍚
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  {
                    emoji: '🛵',
                    title: '배달비 절약',
                    body: '부담스러운 배달 팁, 근처 이웃과 함께 주문하고 반값으로 줄여보세요. 🍕🍗',
                  },
                  {
                    emoji: '🍱',
                    title: '반찬 나눔',
                    body: '혼자 먹기엔 너무 많은 양의 반찬, 정성껏 만들어 이웃과 서로 바꿔 먹어요. 🍚',
                  },
                  {
                    emoji: '🛒',
                    title: '장보기 쉐어',
                    body: '대용량 식재료가 고민될 때, 이웃과 필요한 만큼만 나누어 구매하세요. 🥬🍎',
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm"
                  >
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-3xl">
                      {item.emoji}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-orange-950">{item.title}</h3>
                    <p className="text-orange-900/75">{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : showOnboarding ? (
          <section className="mx-auto max-w-3xl rounded-3xl border border-orange-200 bg-white p-6 shadow-sm md:mt-12 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-orange-950">온보딩 Step {step}</h2>
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

                {step === 1 && (
                  <div className="space-y-2">
                    <label htmlFor="userId" className="block text-sm font-semibold text-orange-950">
                      사용할 아이디
                    </label>
                    <input
                      id="userId"
                      type="text"
                      value={userId}
                      onChange={(event) => setUserId(event.target.value)}
                      placeholder="예: sikgu_justin"
                      className="w-full rounded-2xl border border-orange-200 bg-orange-50/60 px-4 py-3 text-orange-950 outline-none transition focus:border-primary focus:bg-white"
                    />
                  </div>
                )}

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
                    setShowOnboarding(false)
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
                  setShowOnboarding(false)
                  setShowMainFeed(true)
                  setMainView('feed')
                }}
                className="rounded-full bg-orange-950 px-6 py-3 font-bold text-white transition hover:bg-primary"
              >
                {step === 1 ? 'Step 2로 가기' : step === 2 ? 'Step 3로 가기' : '시작하기'}
              </button>
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-4xl space-y-6 py-8">
            <div className="flex gap-2">
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
            </div>

            {mainView === 'feed' ? (
              <>
                <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
                  <p className="text-sm font-semibold text-primary">환영해요!</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-orange-950">내 주변 식구 찾기</h2>
                  <p className="mt-2 text-orange-900/75">
                    관심사와 위치를 바탕으로 식생활을 함께 해결할 식구 그룹을 추천해드려요.
                  </p>
                  {userId.trim() ? (
                    <p className="mt-3 text-sm text-orange-900/60">
                      로그인 아이디: <span className="font-semibold text-orange-950">{userId.trim()}</span>
                    </p>
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
                        이 카테고리에 표시할 그룹이 없어요.
                      </p>
                    ) : (
                      filteredGroups.map((group) => (
                        <article
                          key={group.id}
                          className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-orange-950">{group.title}</h3>
                            <span className="shrink-0 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-primary">
                              {group.tag}
                            </span>
                          </div>
                          <p className="mb-4 text-orange-900/75">{group.body}</p>
                          <button
                            type="button"
                            className="rounded-full bg-orange-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-primary"
                          >
                            참여하기
                          </button>
                        </article>
                      ))
                    )}
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

                <div className="grid gap-4 md:grid-cols-3">
                  <article className="rounded-3xl border border-orange-100 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-4xl">
                      {profile?.badgeEmoji ?? '👤'}
                    </div>
                    <h3 className="text-xl font-bold text-primary">
                      {profile?.displayName ?? '프로필 없음'}
                    </h3>
                    <p className="text-sm text-orange-900/70">
                      {profile?.level ? `Level: ${profile.level}` : 'users.json에 아이디를 등록해 주세요'}
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
                    <p className="text-sm text-orange-900/70">
                      온보딩에서 아이디를 입력하면 히스토리를 불러올 수 있어요.
                    </p>
                  ) : dbLoading ? (
                    <p className="text-sm text-orange-900/70">히스토리를 불러오는 중이에요…</p>
                  ) : !userRecord ? (
                    <p className="text-sm text-orange-900/70">
                      <span className="font-semibold text-orange-950">{userId.trim()}</span>에 해당하는
                      사용자가 <code className="text-xs">public/local_db/users.json</code>에 없어요. 키를
                      추가해 주세요.
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
        )}
      </main>

      <footer className="border-t border-orange-100 bg-orange-50 py-8 text-center text-sm text-orange-900/70">
        © 2026 Sikgu. Warm meals, better together. 🐥
      </footer>
    </div>
  )
}

export default App
