# Interactive Lesson Viewer

React application for viewing and interacting with language learning lessons using Remotion Player.

## 🚀 Quick Start

```bash
# Development
npm install
npm run dev       # Starts on http://localhost:3001

# Production
npm run build
npm run preview   # Preview production build
```

## 📦 Available Scripts

| Command                 | Description                       | Auto-syncs Remotion  |
| ----------------------- | --------------------------------- | -------------------- |
| `npm run dev`           | Start development server          | ✅ Yes               |
| `npm run build`         | Build for production              | ✅ Yes               |
| `npm run preview`       | Preview production build          | No (use after build) |
| `npm run sync-remotion` | Manually sync remotion components | -                    |

## 🔧 Architecture

This app uses Remotion components from `../remotion/src/`. They are **automatically synced** before `dev` and `build` commands via npm hooks.

**Important:**

- ✅ Edit Remotion components in `remotion/src/`
- ❌ Don't edit `src/remotion/` (auto-synced, gitignored)

See [ARCHITECTURE.md](../ARCHITECTURE.md) and [QUICK_START.md](../QUICK_START.md) for details.

## 🐛 Troubleshooting

### "No video config found" error

```bash
npm run sync-remotion
npm run dev
```

### Changes in remotion/ not reflected

Restart dev server (auto-syncs on start):

```bash
# Ctrl+C then
npm run dev
```

## 📚 Documentation

- [QUICK_START.md](../QUICK_START.md) - Quick reference guide
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Detailed architecture
- [VERCEL_DEPLOYMENT.md](../docs/VERCEL_DEPLOYMENT.md) - Deployment guide

## 🛠 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Remotion Player** - Video player
- **Zustand** - State management
- **Framer Motion** - Animations

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── LessonViewer.tsx
│   └── ...
├── remotion/           # Synced from ../remotion/src (gitignored)
│   ├── components/
│   ├── styles/
│   └── utils/
├── services/           # API services
├── store/              # Zustand store
└── types/              # TypeScript types
```

## 🌐 Environment Variables

```env
VITE_API_URL=http://localhost:3000  # Backend API URL (optional)
```

## 📦 Dependencies

- `remotion@^4.0.0` - Remotion core
- `@remotion/player@^4.0.0` - Video player component
- `react@^18.3.1` - React framework
- `zustand@^4.5.0` - State management
- `framer-motion@^11.0.0` - Animation library

## 🚢 Deployment

Deployed to Vercel. See [../vercel.json](../vercel.json) for configuration.

```bash
git push origin main  # Auto-deploys to Vercel
```

## 📝 Notes

- Uses shared Remotion components via build-time copy
- Syncing is automatic via npm hooks (`predev`, `prebuild`)
- Original components are in `../remotion/src/`
- Backend uses the same components for MP4 rendering
