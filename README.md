# QuizVerse — Frontend

React + TypeScript client for QuizVerse, a six-question science quiz with a live 3D scene and instant server-side scoring.

- Six seeded questions, one answer each, keyboard shortcuts (`1`–`4`, arrows)
- Submit flow with a confirmation step when answers are missing
- Debrief screen that reveals the correct answers and explanations only after submission
- Animated score ring, rank, accuracy, elapsed time, and a live leaderboard
- Interactive Three.js orb (React Three Fiber + drei): parallax, hover/poke pulse, phase-based moods
- Responsive layout, glassmorphism styling, reduced-motion support

## Stack

React 18, TypeScript, Vite 5, Three.js via React Three Fiber/drei, Framer Motion, canvas-confetti.

## Run

The app expects the Spring Boot API at `http://localhost:8081` (see [QuizVerse-backend](https://github.com/nanjalamohith-cmyk/QuizVerse-backend)).

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to `http://localhost:8081`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE` | `/api` | API base URL (set this to call a deployed backend) |

If you change the backend port, update the proxy target in `vite.config.ts` too.

## Build

```bash
npm run build
npm run preview
```

`npm run build` type-checks with `tsc --noEmit` and emits a production bundle in `dist/`.
