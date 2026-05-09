import { AnimatePresence, motion } from 'framer-motion'
import { Bell, UserCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useOnboardingStore } from './store/useOnboardingStore'

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showMainFeed, setShowMainFeed] = useState(false)
  const [stepDirection, setStepDirection] = useState(1)
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

  return (
    <div className="min-h-screen bg-background-warm text-text-main">
      <header className="sticky top-0 z-10 border-b border-orange-100 bg-background-warm/95 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <div className="text-2xl font-extrabold text-primary">Sikgu 🍚</div>
          <div className="hidden items-center gap-6 text-sm font-semibold text-primary md:flex">
            <button type="button">Home</button>
            <button type="button" className="text-orange-900/80">
              Dining
            </button>
            <button type="button" className="text-orange-900/80">
              Delivery
            </button>
            <button type="button" className="text-orange-900/80">
              Dishes
            </button>
          </div>
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
                        같이 해결하고 싶은 식생활 고민 (선택)
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
                }}
                className="rounded-full bg-orange-950 px-6 py-3 font-bold text-white transition hover:bg-primary"
              >
                {step === 1 ? 'Step 2로 가기' : step === 2 ? 'Step 3로 가기' : '시작하기'}
              </button>
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-4xl space-y-6 py-8">
            <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-primary">환영해요!</p>
              <h2 className="mt-1 text-2xl font-extrabold text-orange-950">내 주변 식구 찾기</h2>
              <p className="mt-2 text-orange-900/75">
                관심사와 위치를 바탕으로 식생활을 함께 해결할 식구 그룹을 추천해드려요.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {['전체', '반찬', '요리', '공동구매', '배달'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    tab === '전체'
                      ? 'bg-primary text-white'
                      : 'border border-orange-200 bg-white text-orange-900/80'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              {[
                {
                  title: '반찬 나눠요! 🍱',
                  body: '장조림/멸치볶음 같이 나눌 분 찾습니다. 같은 단지면 저녁 전달 가능해요.',
                  tag: '반찬',
                },
                {
                  title: '식재료 나누고 가끔 같이 만들어 먹어요 🍝',
                  body: '파스타 좋아하는 분! 면/소스/치즈 소분하고 주말에 같이 만들어 먹어요.',
                  tag: '요리',
                },
                {
                  title: '같이 코스트코에 장보러 가서 재료 나눠요 🛒',
                  body: '돼지고기/과일 같이 사고 소분할 분 모집합니다. 3~4명 정도 생각 중이에요.',
                  tag: '공동구매',
                },
                {
                  title: '배달비 아끼려고 같이 시켜요 🍕',
                  body: '오늘 저녁 피자 같이 주문할 분! 배달비 나눠서 부담해요.',
                  tag: '배달',
                },
              ].map((group) => (
                <article
                  key={group.title}
                  className="rounded-3xl border border-orange-100 bg-white p-5 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-orange-950">{group.title}</h3>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-primary">
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
              ))}
            </div>
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
