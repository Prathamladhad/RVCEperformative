# NeuroAdapt Setup Guide

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org))
- npm or yarn
- Python 3.9+ (for the FastAPI backend — not included in this repo)
- Git (optional, for version control)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14
- React 18
- TypeScript 5
- Tailwind CSS 3
- PostCSS

### 2. Configure Environment

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local` to point to your backend:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

> **Note:** If your FastAPI backend runs on a different port or host, update the URL accordingly.

### 3. Run FastAPI Backend

The NeuroAdapt frontend requires a Python FastAPI backend running separately.

**If you have the backend code:**

```bash
cd ../neuroadapt-backend  # or wherever your backend is
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend should be running at `http://localhost:8000`.

> **Important:** The backend must be running BEFORE you start the frontend, otherwise API calls will fail.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You should see the NeuroAdapt landing page with:
- 👨‍🏫 Teacher Portal (left)
- 👧 Student Reader (right)

## Project Structure

```
neuroadapt/
├── app/                    # Next.js App Router pages
├── components/            # Reusable React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions & types
├── public/                # Static files (fonts, images)
├── package.json           # Dependencies
├── tailwind.config.ts     # Tailwind CSS config
├── tsconfig.json          # TypeScript config
├── next.config.js         # Next.js config
└── README.md              # Full documentation
```

## Common Tasks

### Build for Production

```bash
npm run build
npm start
```

### Run Type Checking

```bash
npx tsc --noEmit
```

### Run Linting

```bash
npm run lint
```

### Enable Hot Reload

The development server watches for file changes. Just save and your changes appear instantly in the browser.

### Debug in VS Code

Add `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

Then press F5 to start debugging.

## Testing Pages

### Teacher Dashboard
- **URL:** [http://localhost:3000/teacher](http://localhost:3000/teacher)
- **Features:** Upload chapters, see processing status, review generated content

### Student Reader
- **URL:** [http://localhost:3000/student/chapter-id](http://localhost:3000/student/XXXXXX)
- **Features:** Read with TTS, glossary, accessibility controls

### Landing Page
- **URL:** [http://localhost:3000](http://localhost:3000)
- **Features:** Jump to teacher or student mode

## Troubleshooting

### Backend Connection Error

**Error:** `Failed to connect to http://localhost:8000`

**Solution:**
1. Check FastAPI backend is running: `curl http://localhost:8000/docs`
2. Verify `.env.local` has correct `NEXT_PUBLIC_BACKEND_URL`
3. Check firewall/proxy settings if on corporate network

### Font Not Loading

**Issue:** OpenDyslexic font doesn't render

**Solution:**
- Verify `/public/fonts/OpenDyslexic.woff2` exists
- Check browser DevTools > Network tab for font 404s
- Rebuild with `npm run build`

### TypeScript Errors

**Error:** `Type 'X' is not assignable to type 'Y'`

**Solution:**
1. Run `npx tsc --noEmit` to see all errors
2. Check that imports use correct paths
3. Ensure `tsconfig.json` paths are set correctly

### Tailwind Classes Not Working

**Issue:** Tailwind utilities not being applied

**Solution:**
1. Verify `tailwind.config.ts` includes all content paths
2. Restart dev server: `npm run dev`
3. Check that CSS file is imported: `import './globals.css'`

## Performance Tips

- **Lazy load components:**
  ```tsx
  const Component = dynamic(() => import('@/components/MyComponent'))
  ```

- **Optimize images:**
  - Use Next.js `Image` component instead of `<img>`
  - Provide width/height to avoid layout shift

- **Monitor bundle size:**
  ```bash
  npm install -g next-bundle-analyzer
  ANALYZE=true npm run build
  ```

## Environment Variables for Deployment

When deploying to Vercel or another platform, set these in your CI/CD:

```env
NEXT_PUBLIC_BACKEND_URL=https://backend.your-domain.com
```

The `NEXT_PUBLIC_` prefix makes it available to the browser.

## Version Control

Initialize git if not already:

```bash
git init
git add .
git commit -m "Initial NeuroAdapt setup"
```

Recommended `.gitignore` is already included.

## Next Steps

1. ✅ Backend is running on `localhost:8000`
2. ✅ Frontend is running on `localhost:3000`
3. 📤 Upload your first NCERT chapter via the teacher dashboard
4. 👧 Test the student reader experience
5. 🎨 Customize accessibility options

## Getting Help

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **TypeScript Docs:** https://www.typescriptlang.org/docs
- **Web Speech API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

Happy building! Every brain served. 🧠
