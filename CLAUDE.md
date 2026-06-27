# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```
npm run dev       # start Vite dev server (hot reload)
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## Project overview

**TTP FIGHTER** — Double Dragon style 2D fighting game built with [Phaser 3](https://phaser.io/) and Vite.

## Architecture

- Entry point: `src/main.ts` — creates the `Phaser.Game` instance with the game config
- `src/preloader.ts` — intended for a Phaser Scene that loads assets before the game starts
- Vite is the bundler; TypeScript is transpiled by Vite's built-in esbuild (no `tsc` emit step)
- `tsconfig.json` uses `"noEmit": true` — type-checking only, not compilation

## No linting or tests

There is no ESLint, Prettier, or test runner configured. `npx tsc --noEmit` is the only static check available.

## TypeScript notes

- Phaser ships its own type declarations (no `@types/phaser` needed)
- `tsconfig.json` references them via `"types": ["phaser"]`
- `moduleResolution: "bundler"` is required for Vite compatibility
