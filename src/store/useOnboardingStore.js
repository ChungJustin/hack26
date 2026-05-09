import { create } from 'zustand'

const STEP_ONE_OPTIONS = [
  { id: 'friend', label: '시간될 때 같이 밥 먹을 친구가 있으면 좋겠어요 🍽️' },
  { id: 'delivery', label: '배달비를 아끼고 싶어요 🍕' },
  { id: 'side-dish', label: '음식(반찬)을 한번에 만들어서 나눠먹고 싶어요 🍱' },
  { id: 'ingredient', label: '식재료를 나누고 싶어요 🛒' },
  { id: 'variety', label: '다양한 음식을 나누고 싶어요 👩‍🍳' },
]

const STEP_TWO_OPTIONS = [
  { id: 'pasta', label: '4인분의 파스타를 만들 수 있어요 🍝' },
  { id: 'korean-side', label: '한식 반찬을 잘 만들어요 🍚' },
  { id: 'challenge', label: '새로운 음식을 만드는데 도전하는걸 좋아해요 👩‍🍳' },
  { id: 'oven', label: '집에 오븐이 있어서 빵이나 쿠키를 자주 만들어요 🥐' },
  { id: 'shopping', label: '식재료를 싸게 잘 사요 (코스트코/쿠팡/컬리) 🛒' },
]

export const useOnboardingStore = create((set) => ({
  step: 1,
  stepOneOptions: STEP_ONE_OPTIONS,
  stepTwoOptions: STEP_TWO_OPTIONS,
  selectedNeeds: [],
  selectedTalents: [],
  userId: '',
  location: '',
  customNeed: '',
  toggleNeed: (id) =>
    set((state) => ({
      selectedNeeds: state.selectedNeeds.includes(id)
        ? state.selectedNeeds.filter((item) => item !== id)
        : [...state.selectedNeeds, id],
    })),
  toggleTalent: (id) =>
    set((state) => ({
      selectedTalents: state.selectedTalents.includes(id)
        ? state.selectedTalents.filter((item) => item !== id)
        : [...state.selectedTalents, id],
    })),
  setLocation: (location) => set({ location }),
  setCustomNeed: (customNeed) => set({ customNeed }),
  setUserId: (userId) => set({ userId }),
  setStep: (step) => set({ step }),
}))

export const useUserStore = useOnboardingStore
