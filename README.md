# Sikgu (식구) - Hackathon Prototype

1인 가구의 식생활 문제(배달비, 식재료 낭비, 반찬/요리 공유)를 가까운 이웃 연결로 해결하는 해커톤 프로토타입입니다.

## Stack

- React + Vite
- Tailwind CSS (`@tailwindcss/vite`)
- Zustand (state management)
- Framer Motion (animation)
- Lucide React (icons)

## Current Progress

- 랜딩 페이지 UI 구현 (`design/_1/code.html` 기반)
- 온보딩 Step 1(니즈 체크리스트) UI 구현
- Zustand로 온보딩 선택 상태 관리
- 디자인 토큰(Primary/Secondary/Background/Text, Nunito Sans) 반영

## Run Locally

```bash
npm install
npm run dev
```

브라우저에서 로컬 주소(기본: `http://localhost:5173`)를 열어 확인합니다.

포트 충돌 시:

```bash
npm run dev -- --port 5174
```

## Build

```bash
npm run build
npm run preview
```

## Project Structure

- `src/App.jsx`: 랜딩 + 온보딩 Step 1 화면
- `src/store/useOnboardingStore.js`: 온보딩 상태 스토어
- `src/index.css`: Tailwind + 디자인 토큰
- `docs/`: 기획, WBS, 디자인 문서
- `design/`: Stitch 추출 HTML 레퍼런스
