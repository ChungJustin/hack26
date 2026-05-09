# Sikgu (식구) Design System & Visual Identity

이 문서는 '식구' 프로젝트의 전반적인 Look & Feel을 정의하며, 개발 시 디자인 가이드라인으로 활용됩니다.

## 🎨 Design Concept: "Warm, Cute, and Tasty"
1인 가구의 외로움을 해소하고 따뜻한 연결을 지향하므로, **포근하고 귀여운** 분위기를 유지합니다.

### 1. Color Palette
- **Primary:** `#FF8A3D` (Warm Orange) - 식욕을 돋구고 따뜻한 에너지를 주는 메인 컬러
- **Secondary:** `#FFD1B3` (Soft Peach) - 배경 및 보조 강조색
- **Background:** `#FFFAF5` (Creamy White) - 눈이 편안하고 따뜻한 배경색
- **Accent:** `#4ADE80` (Fresh Green) - 신선한 식재료와 건강함을 상징
- **Text:** `#2D2D2D` (Deep Charcoal) - 가독성을 위한 진한 회색

### 2. Typography
- **Font Family:** 'Pretendard' or 'Nanum Square Round' (둥글둥글한 느낌의 폰트 선호)
- **Headings:** 볼드하고 큼직하게, 주요 질문은 눈에 띄게 배치
- **Body:** 간결하고 친절한 어투 ("~해요", "~인가요?")

### 3. Visual Elements (The "Cute" Factor)
- **Rounded Corners:** 모든 버튼과 카드는 `rounded-2xl` (16px) 이상의 큰 라운드 값을 적용
- **Food Emojis:** 텍스트 옆에 상황에 맞는 이모지 적극 활용
    - 배달비 아끼기: 🍕 🍗
    - 반찬 나눔: 🍱 🍚
    - 요리/포트럭: 🍝 👩‍🍳
    - 장보기: 🛒 🥩
- **Icons:** Lucide React의 둥근 아이콘 사용

### 4. Component Styles (Tailwind Class Examples)
- **Card:** `bg-white rounded-3xl p-6 shadow-sm border border-orange-50`
- **Primary Button:** `bg-orange-500 text-white rounded-full py-4 px-8 font-bold hover:bg-orange-600 transition-all shadow-md`
- **Checkbox/Selection:** 선택 시 테두리가 두꺼워지며 `bg-orange-100`으로 변하는 인터랙션

---

## 📸 Page-Specific Design Notes

### Onboarding
- 각 단계마다 귀여운 음식 이모지가 애니메이션(Framer Motion)과 함께 등장
- 진행 바(Progress Bar) 대신 상단에 이모지 캐릭터가 조금씩 이동하는 방식 검토

### Main Feed
- 카테고리별로 배경색을 미세하게 다르게 설정 (예: 반찬-Green, 배달-Orange)
- "오늘의 식구 추천" 섹션은 하이라이트 효과 적용

### Previous Sikgu (History)
- 함께 밥을 먹은 횟수에 따라 '식구 레벨' 이모지 부여 (🐣 -> 🐥 -> 🐔)
