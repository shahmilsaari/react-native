# Venso Booking (React Native)

Clean Expo + React Native starter that demonstrates a booking funnel for the fictional agency **Venso**. The project is intentionally small but follows a layered structure (navigation, screens, shared components, state stores, and data) so you can iterate on this branch with confidence.

## Stack

- React Native 0.74 / Expo SDK 51 (TypeScript)
- React Navigation native stack
- Zustand for lightweight, testable state management

## Getting started

```bash
npm install
npm run start
```

Use the Expo CLI prompts to launch iOS, Android, or web. The starter enforces Node 18+.

## Project structure

```
.
├── App.tsx              # Entry point that wires providers and navigation
├── src
│   ├── components       # Presentational UI building blocks (e.g., PackageCard)
│   ├── data             # Static JSON-like seeds for packages
│   ├── navigation       # Navigation container + typed routes
│   ├── screens          # Feature screens (Login, Packages, Package details)
│   ├── store            # Zustand stores for auth + package catalog
│   ├── theme            # Shared design tokens
│   └── types            # Domain contracts
```

State such as authentication and package listings live in `src/store`. Screens read/write state through the hooks which keeps UI clean and predictable.

## Dummy data

`src/data/packages.ts` exposes curated trips with enough metadata to flesh out cards and detail sections. Replace this with API calls whenever you wire up your backend.

## Next steps

- Swap the mocked login call with a real API mutation.
- Replace the dummy packages seed with remote data (REST/GraphQL) and populate Zustand via async actions.
- Extend navigation with tabs (e.g., profile, bookings) as requirements evolve.
