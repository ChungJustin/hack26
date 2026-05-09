import { create } from 'zustand'

const STEP_ONE_OPTIONS = [
  { id: 'friend', label: '시간될 때 같이 밥 먹을 친구가 있으면 좋겠어요 🍽️' },
  { id: 'delivery', label: '배달비를 아끼고 싶어요 🍕' },
  { id: 'side-dish', label: '음식(반찬)을 한번에 만들어서 나눠먹고 싶어요 🍱' },
  { id: 'ingredient', label: '식재료를 나누고 싶어요 🛒' },
  { id: 'variety', label: '다양한 음식을 나누고 싶어요 👩‍🍳' },
]

export const useOnboardingStore = create((set) => ({
  step: 1,
  stepOneOptions: STEP_ONE_OPTIONS,
  selectedNeeds: [],
  toggleNeed: (id) =>
    set((state) => ({
      selectedNeeds: state.selectedNeeds.includes(id)
        ? state.selectedNeeds.filter((item) => item !== id)
        : [...state.selectedNeeds, id],
    })),
}))

export const useUserStore = useOnboardingStore
