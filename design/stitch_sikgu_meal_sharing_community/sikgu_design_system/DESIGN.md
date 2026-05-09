---
name: 식구 (Sikgu) Design System
colors:
  surface: '#fff8f6'
  surface-dim: '#ead6cd'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1eb'
  surface-container: '#feeae0'
  surface-container-high: '#f9e4db'
  surface-container-highest: '#f3ded5'
  on-surface: '#241914'
  on-surface-variant: '#564338'
  inverse-surface: '#3a2e28'
  inverse-on-surface: '#ffede5'
  outline: '#8a7266'
  outline-variant: '#ddc1b3'
  surface-tint: '#9a4600'
  primary: '#9a4600'
  on-primary: '#ffffff'
  primary-container: '#ff8a3d'
  on-primary-container: '#682d00'
  inverse-primary: '#ffb68d'
  secondary: '#79573f'
  on-secondary: '#ffffff'
  secondary-container: '#ffd1b3'
  on-secondary-container: '#7a5840'
  tertiary: '#006783'
  on-tertiary: '#ffffff'
  tertiary-container: '#00b7e7'
  on-tertiary-container: '#004457'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68d'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#763300'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#eabea0'
  on-secondary-fixed: '#2d1604'
  on-secondary-fixed-variant: '#5f402a'
  tertiary-fixed: '#bce9ff'
  tertiary-fixed-dim: '#63d3ff'
  on-tertiary-fixed: '#001f29'
  on-tertiary-fixed-variant: '#004d63'
  background: '#fff8f6'
  on-background: '#241914'
  surface-variant: '#f3ded5'
  background-warm: '#FFFAF5'
  accent-fresh: '#4ADE80'
  text-main: '#2D2D2D'
  surface-card: '#FFFFFF'
  border-warm: '#FFF7ED'
typography:
  headline-xl:
    fontFamily: Nunito Sans
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Nunito Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Nunito Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
---

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