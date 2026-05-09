# Sikgu (식구) Implementation Checklist (2-Person)

5시간 해커톤을 위한 체크리스트입니다. 완료 시 `[ ]`를 `[x]`로 표시하며 진행하세요.

## 🛠 Tech Stack
- [ ] React (Vite) + TypeScript
- [ ] Tailwind CSS + shadcn/ui
- [x] Zustand (State Management)
- [x] Framer Motion (Animation)

---

## 🕒 H1: Foundation & Onboarding (0-1h)

### Person A (UI/Layout)
- [x] Vite 프로젝트 생성 및 Tailwind CSS 셋업
- [x] 글로벌 테마 설정 (Color Palette, Typography)
- [x] 온보딩 Step 1: 니즈 파악 체크리스트 UI
- [x] 온보딩 Step 2: 나의 역량(Talent) 선택 UI

### Person B (Logic/Structure)
- [ ] shadcn/ui 초기화 및 기본 컴포넌트(Button, Card, Input) 설치
- [x] Zustand 스토어: `useUserStore` (프로필/온보딩 상태 관리)
- [ ] 온보딩 Step 3: 위치 인증(단지/건물명) 입력 폼 구현
- [ ] 페이지 간 라우팅(React Router) 기초 셋업

---

## 🕒 H2: Main Feed & Discovery (1-2h)

### Person A (Feed UI)
- [ ] 메인 피드 레이아웃 (모바일 퍼스트)
- [ ] 카테고리 탭 UI (전체, 반찬, 요리, 공구, 배달)
- [ ] 목적별 그룹 카드 디자인 (심미성 강조)

### Person B (Data Management)
- [ ] Zustand 스토어: `useGroupStore` (그룹 리스트 관리)
- [ ] Mock 데이터 구성 (반찬 나눔, 피자 쉐어 등 10개 이상)
- [ ] 카테고리별 필터링 기능 로직 구현

---

## 🕒 H3: Action - Group Creation (2-3h)

### Person A (Form UI)
- [ ] 그룹 생성 프리셋 버튼 리스트 (족발, 코스트코 등)
- [ ] 그룹 상세 정보 입력 페이지 UI
- [ ] "참여하기" 버튼 클릭 인터랙션 & 애니메이션

### Person B (Flow Logic)
- [ ] 프리셋 클릭 시 기본값 자동 채우기 로직
- [ ] 새 그룹 게시글 생성 및 스토어 업데이트 로직
- [ ] 그룹 참여 인원 카운팅 및 마감 처리 로직

---

## 🕒 H4: Connection - Bonding History (3-4h)

### Person A (History UI)
- [ ] "이전 식구" 목록 UI (본딩된 이웃 리스트)
- [ ] 사용자 프로필/본딩 대시보드 화면
- [ ] 활동 완료(식구 결성) 알림 UI

### Person B (Matching Logic)
- [ ] 함께한 식구 데이터 매핑 로직
- [ ] 4명 본딩 완료 조건 체크 및 상태 변경
- [ ] 추천 알고리즘 (위치/관심사 기반 간단한 추천)

---

## 🕒 H5: Polishing & Finalization (4-5h)

### Person A (Polish)
- [ ] Framer Motion 페이지 전환 효과 적용
- [ ] 전체 UI 간격, 폰트, 디테일 폴리싱
- [ ] 발표용 데모 시나리오 최적화

### Person B (QA/Deploy)
- [ ] 전체 데이터 흐름(E2E) 버그 수정
- [ ] Vercel/Netlify 배포 확인
- [ ] README 작성 및 최종 빌드 테스트

---

## 🚀 협업 팁
- **Commit Message:** `[A] Onboarding UI 완료`, `[B] UserStore 구현` 형식으로 구분
- **Sync:** 매 시간 정각에 5분간 서로의 진행 상황 공유 및 머지(Merge) 진행
