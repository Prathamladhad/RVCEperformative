# Quick Start — NeuroAdapt

Get NeuroAdapt running in 2 minutes.

## Prerequisites

- Node.js 18+ installed
- FastAPI backend running on `http://localhost:8000`

## Start Here

### 1. Install & Start

```bash
npm install
npm run dev
```

Open browser: [http://localhost:3000](http://localhost:3000)

### 2. Teacher: Upload a Chapter

1. Click **"Upload Chapter"** button
2. Either:
   - Drag a PDF file into the dropzone, OR
   - Click "Paste Text" and paste NCERT text
3. Select Class: 6-10
4. Select Subject: Science, Maths, Social Science, English, or Hindi
5. Click **"Transform Chapter"**
6. Watch the progress bar (extraction → cleaning → chunking → simplifying)
7. When done, you're redirected to the Review page

### 3. Teacher: Review & Approve

On the Review page:
- Left side: **Original NCERT** text
- Right side: **NeuroAdapt output** (simplified)
- Use Previous/Next buttons or dots to navigate chunks
- **Click on simplified text to edit inline**
- Click **"✓ Approve & Share"** button
- Get a **6-digit share code**

### 4. Student: Enter Share Code

1. Go back to home: [http://localhost:3000](http://localhost:3000)
2. Enter the 6-digit share code
3. Click **"START READING"**

Or go directly to: [http://localhost:3000/student/{CODE}](http://localhost:3000/student/XXXXXX)

### 5. Student: Read with Accessibility

On the student reader:
- **⚙️ Accessibility button** (top right) — adjust:
  - Font (OpenDyslexic, Lexend, System)
  - Size (16–28px)
  - Line height (1.4–2.4)
  - Background color (cream, white, blue, dark)
  - Letter spacing
  - Reading ruler toggle
  
- **Reading ruler** — semi-transparent yellow bar follows your eyes
  
- **🔊 TTS (Text-to-Speech)** — bottom bar:
  - Play/pause button
  - Adjust speed (0.5x–1.5x)
  - Select voice
  - Words highlight as they're spoken
  
- **📖 Glossary button** (bottom right) — search key terms with definitions
  
- **Keyboard shortcuts:**
  - `Space` or `→` = Next section
  - `←` = Previous section
  - `G` = Toggle glossary

## File Structure

```
app/          # Pages (landing, teacher, student)
components/   # UI components (shared, teacher, student)
hooks/        # Custom React hooks (reading, accessibility, chapter)
lib/          # Utilities (types, API, storage, TTS)
public/       # Static assets (OpenDyslexic font)
package.json  # Dependencies
```

## Environment Setup

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit if your backend runs on a different URL:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Backend Connection

The frontend expects your FastAPI backend at `http://localhost:8000` with these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/process` | POST | Upload & process chapter |
| `/chapters` | GET | List all chapters |
| `/chapters/{id}` | GET | Get chapter |
| `/chapters/{id}` | PATCH | Approve chapter |
| `/processing-status/{id}` | GET | Check progress |

**Don't have the backend?**

Create a minimal FastAPI mock to test:

```python
# mock_backend.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def process():
    return {"chapter_id": "mock-123"}

@app.get("/chapters/{chapter_id}")
async def get_chapter(chapter_id: str):
    return {
        "chapter_id": chapter_id,
        "title": "Photosynthesis",
        "subject": "Science",
        "class_level": 8,
        "board": "NCERT",
        "approved": True,
        "created_at": "2024-01-01T00:00:00",
        "chunks": [
            {
                "chunk_id": "1",
                "original_text": "Photosynthesis is a complex process...",
                "simplified_text": "Photo·syn·the·sis is how plants make food.",
                "key_terms": ["photosynthesis", "chlorophyll"],
                "syllable_map": {"photosynthesis": "pho·to·syn·the·sis"},
                "phonetic_map": {"photosynthesis": "foh-toh-SIN-thuh-sis"},
                "core_facts": ["Plants use sunlight", "Produces oxygen"],
                "objective": "Understand how plants convert light to energy",
                "numbers": ["6"],
                "numbers_plain": ["six"],
                "glossary": {"photosynthesis": "Process of converting light energy into food"},
                "word_count": 8
            }
        ]
    }

# Run: uvicorn mock_backend:app --reload --port 8000
```

Save as `mock_backend.py`, then:

```bash
pip install fastapi uvicorn
uvicorn mock_backend:app --reload --port 8000
```

## Testing Checklist

- [ ] Teacher dashboard loads
- [ ] Can upload chapter (real or mock backend)
- [ ] Processing status shows (if real backend)
- [ ] Review page displays before/after side-by-side
- [ ] Can approve chapter
- [ ] Can navigate chunks (previous/next)
- [ ] Can edit chunk text inline
- [ ] Share code displays
- [ ] Student reader loads with share code
- [ ] Accessibility bar works (font, size, color changes)
- [ ] Reading ruler visible and toggleable
- [ ] TTS plays audio and highlights words
- [ ] Glossary opens and searches
- [ ] Keyboard shortcuts work (space, arrows, G)
- [ ] localStorage persists prefs across page reloads

## Common Questions

**Q: How is text converted to speech?**
A: Using the Web Speech API (`speechSynthesis.speak()`), which is built into modern browsers. No external libraries needed.

**Q: Where are student preferences saved?**
A: In browser's `localStorage` under the key `neuroadapt_student_prefs`. They persist across sessions.

**Q: Can I change the backend URL?**
A: Yes, set `NEXT_PUBLIC_BACKEND_URL` in `.env.local` or as an environment variable.

**Q: How do I deploy to production?**
A: Use Vercel (`vercel` command) or any Node.js host. Set environment variables in deployment config.

**Q: Is the frontend open source?**
A: Yes, everything here is MIT licensed. Feel free to fork and customize!

## Troubleshooting

**Backend connection fails:**
```bash
curl http://localhost:8000/chapters
```
If this fails, backend isn't running.

**Font not loading:**
Check `/public/fonts/OpenDyslexic.woff2` exists.

**Tailwind styles missing:**
- Restart dev server: `npm run dev`
- Clear `.next` folder: `rm -rf .next`

**TypeScript errors:**
```bash
npx tsc --noEmit
```

## Next Steps

1. Read [SETUP.md](./SETUP.md) for detailed instructions
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for codebase overview
3. Read [README.md](./README.md) for full feature documentation
4. Modify components in `/components` to match your design
5. Connect to your real FastAPI backend

## Get Help

- Edit files directly in VS Code
- Hot reload works automatically (`npm run dev`)
- Check browser console for errors (F12)
- Check server logs in terminal

---

**Building for every brain. Every student deserves accessible learning.** 🧠

Questions? Open an issue or PR on the repository.
