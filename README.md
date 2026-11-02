# Hercules — frontend

React single-page app for Hercules, a fitness and nutrition tracker: log
workouts and track exercise progress, log meals with food search and a camera
barcode scanner, view daily macros, follow other users and post to a social
feed, and get notifications. UI in English and Greek.

It talks to the Django REST API in the hercules_backend repo. There is no
public deployment.

## Stack

- React 19, React Router 7, Vite 8
- Tailwind CSS 4
- TanStack Query for server state, Zustand for auth and language state
- axios with JWT auth (`src/api/axios.js`)
- ZXing (`@zxing/browser`) for barcode scanning from the camera

## Pages

Dashboard, Workouts, Nutrition, Social, Profile, Notifications, Settings,
Login, Register, Forgot password, Onboarding, and a staff Admin panel.

## Running locally

Requires Node.js and the backend running on http://localhost:8000. The Vite
dev server proxies `/api` and `/media` to it (`vite.config.js`), so no
environment variables are needed.

```sh
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.
