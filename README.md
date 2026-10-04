# Novelia AI - AI Book Studio (Ai-book-maker)

An AI-powered book creation studio. Go from idea to finished manuscript with a guided book wizard, a full editor, an immersive reader, a personal library, and export to PDF and bundled formats.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![Gemini](https://img.shields.io/badge/Gemini-1E88E5?logo=google&logoColor=white)](https://ai.google.dev)

Tags: `react` `vite` `typescript` `gemini` `firebase` `ai-writing` `books` `editor` `jspdf`

## Overview

Novelia walks the full authoring loop. The landing page introduces the studio, authentication signs the author in, the book wizard captures genre, premise, characters, and structure, the editor drafts chapter by chapter with AI assistance, the reader previews the finished flow, and the library keeps every book synced to the cloud. Explore surfaces ideas, settings tune the experience, and privacy and terms pages ship with the app.

## Features

- Guided book wizard (premise, genre, characters, outline, chapter plan)
- Chapter editor with AI drafting, continuation, and revision
- Immersive reader with clean typography
- Personal cloud library with per-user book sync
- Explore page for discovery and inspiration
- Export to PDF (jsPDF) and bundled download (JSZip + File Saver)
- Markdown rendering with sanitized HTML output
- Fluid animated background with Three.js accents
- Email authentication with session persistence
- Responsive layout from mobile to desktop

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript |
| Build | Vite 6 |
| AI | Google Gemini (`@google/genai`) |
| Auth and Database | Firebase |
| Motion | Framer Motion 12 |
| Export | jsPDF, JSZip, File Saver |
| Rendering | marked, DOMPurify |
| Backgrounds | Three.js |
| Icons | Lucide React |

## Repository Structure

```text
Ai-book-maker/
├── components/            # AppShell, Landing, BookWizard, Editor, Reader,
│                          # Library, Explore, Auth, SettingsModal, PrivacyPolicy,
│                          # TermsOfService, FluidBackground
├── services/              # authService, databaseService, AI services
├── App.tsx                # View-state routing and session bootstrap
├── index.tsx              # Entry point
├── types.ts               # Book, User, and view-state types
├── config.ts              # App configuration
├── firebase.ts            # Firebase initialization
└── vite.config.ts         # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18 or later and npm
- A Firebase project
- A Google Gemini API key

### Installation

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` and fill in your keys. Never commit `.env`.

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm run preview
```

## Security Note

If you fork or reuse this project, verify that no real `.env` file is tracked in git history before pushing to a public remote. Rotate any key that was ever committed.

## License

All rights reserved. See Terms of Service in the application.
