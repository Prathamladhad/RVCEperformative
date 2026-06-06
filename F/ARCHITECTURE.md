# NeuroAdapt Architecture

## System Overview

NeuroAdapt is a client-server application consisting of:

```
┌─────────────────────────────────────────────────────────┐
│         TEACHER WORKFLOW        │      STUDENT WORKFLOW  │
├─────────────────────────────────────────────────────────┤
│  Upload PDF/Text ──────────────┬─────────────────────────│
│         ↓                       │                         │
│  ProcessingStatus ◄────API ────┤      [Share Code]       │
│  (4: extracting,               │        Enter Code ─┐    │
│   chunking,                     │                    ↓    │
│   simplifying)                  │         Fetch Chapter   │
│         ↓                       │         from Backend    │
│  Review Page ◄─────────────────┤                    │    │
│  (BeforeAfterView)              │          Student  │    │
│         ↓                       │          Reader ◄─┘    │
│  Approve & Share                │          Page          │
│  (Generate Code)                │          ↓             │
└─────────────────────────────────┴─────────────────────────┘
           │                                    │
           └────────► FastAPI Backend ◄────────┘
                   (http://localhost:8000)
                         │
                    Processes:
                    ✓ /process — PDF extraction, cleanup, simplification
                    ✓ /chapters — CRUD operations
                    ✓ /processing-status — Real-time progress
                    ✓ /share — Code-based access
```

## Data Flow

### 1. Teacher Upload → Processing

```
Teacher Page
    ↓
  UploadPanel
    (Selects file/text, class, subject, board)
    ↓
  POST /api/process
    (Next.js API route)
    ↓
  Forward → FastAPI Backend
    ↓
  Polling: getProcessingStatus()
    (Every 1 second)
    ↓
  ProcessingStatus Component
    (Updates stage, progress, chunk count)
    ↓
  Auto-navigate to /teacher/review/{chapterId}
```

### 2. Teacher Review → Approval

```
Review Page
    ↓
  useChapter Hook
    (Fetches chapter data with caching)
    ↓
  BeforeAfterView
    (Side-by-side original vs transformed)
    (Allow inline editing of chunks)
    ↓
  Click "Approve & Share"
    ↓
  PATCH /api/chapters/{id}
    ↓
  FastAPI Backend saves approval
    ↓
  Display share code (6 digits)
```

### 3. Student Access → Reading

```
Landing Page
    ↓
  Enter share code (6 digits)
    ↓
  Redirects to /student/{chapterId}
    ↓
  useChapter Hook
    (Fetch chapter from /api/chapters/{id})
    (Cache in sessionStorage)
    ↓
  Student Reader Page Loads
    ├─ useReading Hook
    │   (Manages current chunk index, progress)
    │   (Loads from localStorage)
    │
    ├─ useAccessibility Hook
    │   (Loads student prefs from localStorage)
    │   (Applies CSS variables to DOM)
    │
    ├─ ChunkReveal Component
    │   (Renders current chunk with highlights)
    │
    ├─ ReadingRuler Component
    │   (Follows mouse/scroll position)
    │
    ├─ TTSControls Component
    │   (Web Speech API integration)
    │
    ├─ GlossaryPanel Component
    │   (Searchable key terms)
    │
    └─ AccessibilityBar Component
        (Font, size, color, spacing, ruler toggle)
    
    Keyboard shortcuts:
    Space/→ = Next chunk
    ← = Previous chunk
    G = Toggle glossary
```

## Component Hierarchy

### Teacher Portal

```
/teacher/page.tsx
├── UploadPanel
│   └── Form inputs (file, class, subject, board)
├── ProcessingStatus (conditional)
│   └── Progress bar, stage indicators, chunk counter
└── ChapterCard[] (grid)
    └── Metadata, status, share code, action buttons
```

### Review Page

```
/teacher/review/[id]/page.tsx
├── BeforeAfterView
│   ├── Original text (red-tinted)
│   ├── Transformed text (green-tinted)
│   └── Navigation dots
└── Approve/Share Actions
```

### Student Reader

```
/student/[chapterId]/page.tsx
├── AccessibilityBar (fixed, collapsible)
│   ├── Font selector
│   ├── Size slider
│   ├── Line height slider
│   ├── Letter spacing slider
│   ├── Background color selector
│   ├── Reading ruler toggle
│   └── TTS auto-play toggle
├── Chapter Header
│   ├── Title, subject, class badges
│   └── Progress bar
├── ChunkReveal (main content)
│   ├── Chunk text (with highlights & syllable splits)
│   ├── Objective summary
│   ├── Core facts list
│   └── Previous/Next buttons
├── ReadingRuler (overlay)
├── GlossaryPanel (slide-in from right)
│   ├── Search input
│   └── Term + definition list
├── Glossary button (floating)
└── TTSControls (fixed bottom)
    ├── Play/pause
    ├── Speed selector
    └── Voice selector
```

## State Management

### Global State (localStorage)

```
Key: neuroadapt_student_prefs
Value: StudentPrefs {
  font, fontSize, lineHeight, letterSpacing,
  background, showRuler, ttsSpeed, ttsAutoPlay
}

Key: neuroadapt_progress_{chapterId}
Value: {
  currentChunkIndex: number,
  completedChunks: string[]
}

Key: neuroadapt_chapters_cache
Value: {
  [chapterId]: { data: ChapterData, timestamp }
}
```

### Component Local State (React)

```
Teacher Page:
  - chapters: ChapterData[]
  - uploading: boolean
  - processing: boolean
  - currentChapterId: string
  - processingStatus: ProcessingStatus

Student Reader:
  - currentChunkIndex: number
  - completedChunks: string[]
  - ttsActive: boolean
  - activeWordIndex: number
  - glossaryOpen: boolean
  - prefs: StudentPrefs
```

## Hooks Deep Dive

### useReading(chapterId, totalChunks)

```
Purpose: Manage reading state and persistence

State:
  - currentChunkIndex
  - completedChunks[]
  - ttsActive, ttsPlaying
  - activeWordIndex

Methods:
  - nextChunk() → increment index, save
  - prevChunk() → decrement index, save
  - markComplete(chunkId) → add to completed[]
  - startTTS(), pauseTTS(), resumeTTS(), stopTTS()
  - setActiveWord(index) → highlight word during TTS

LocalStorage:
  - Loads progress on mount
  - Saves on every chunk change
```

### useAccessibility()

```
Purpose: Manage accessibility preferences

State:
  - prefs: StudentPrefs (10 properties)

Methods:
  - updatePref(key, value) → save to localStorage
  - reset() → restore defaults

Side Effects:
  - Applies prefs as CSS variables on document:
    --font-family
    --font-size
    --line-height
    --letter-spacing
    --bg-color
    --text-color
  - Applies to document.body directly
```

### useChapter(chapterId)

```
Purpose: Fetch and cache chapter data

State:
  - chapter: ChapterData | null
  - loading: boolean
  - error: Error | null

Methods:
  - refetch() → re-fetch from API

Logic:
  1. Check sessionStorage cache (lifetime: 24h)
  2. If found, return cached data
  3. If not, fetch from /api/chapters/{id}
  4. Store in sessionStorage cache
  5. Return chapter data
```

## API Layer (/lib/api.ts)

All functions return Promises that resolve to typed data:

```typescript
uploadAndProcess(metadata) → { chapter_id: string }
getProcessingStatus(id) → ProcessingStatus
getChapter(id) → ChapterData
listChapters() → ChapterData[]
approveChapter(id) → ChapterData
updateChunkText(id, chunkId, text) → void
getChapterByCode(code) → ChapterData
```

Error handling:
- Throws Error if status !== ok
- Wrapped in try/catch in components
- User sees Toast notification on error

## Storage Layer (/lib/storage.ts)

```
getStudentPrefs() → StudentPrefs (with defaults)
saveStudentPrefs(partial) → void
resetStudentPrefs() → void

getChapterProgress(id) → { currentChunkIndex, completedChunks[] }
saveChapterProgress(id, index, completed[]) → void

cacheChapterData(id, data) → void
getCachedChapterData(id) → data | null
clearChapterCache(id?) → void
```

All functions check `typeof window === 'undefined'` for SSR safety.

## TTS Manager (/lib/tts.ts)

```typescript
class TTSManager {
  synth: SpeechSynthesis  // Browser API
  utterance: SpeechUtterance
  onWordChange?: (index: number) => void

  speak(text, options) → Promise
  pause() → void
  resume() → void
  cancel() → void
  isPlaying() → boolean
  isPaused() → boolean
  getVoices() → SpeechSynthesisVoice[]
  onVoicesChanged(callback) → () => void
}
```

Word boundary tracking:
- Listens to `utterance.onboundary` with `event.name === 'word'`
- Calculates word index from charIndex
- Calls `onWordChange(wordIndex)` → component updates activeWordIndex
- Component applies yellow background to word at that index

## Design System

### CSS Variables (Applied by useAccessibility)

```css
--font-family: "OpenDyslexic", sans-serif | "Lexend", sans-serif | system-ui
--font-size: 16px–28px
--line-height: 1.4–2.4
--letter-spacing: 0–0.15em
--bg-color: #FEF9F0 | #FFFFFF | #EFF6FF | #1a1a1a
--text-color: #2C2416 | #E8E8E8
```

### Tailwind Customization

```tsx
theme.extend {
  colors: {
    cream, brand-purple, accent-teal, error-red, dark-text
  },
  fontFamily: {
    opendyslexic, lexend
  },
  maxWidth: {
    prose: 65ch  // 65 characters
  },
  animation: {
    chunk-reveal: 200ms slide up + fade in
    pulse-bar: 2s pulsing progress
  }
}
```

### Dyslexia-Friendly Principles

1. **Text Alignment:** Always left (never justify)
2. **Line Spacing:** 1.8+ minimum in reading contexts
3. **Font Size:** 18px+ in student reader
4. **Line Length:** Max 65 characters (prose class)
5. **Letter Spacing:** 0.05em–0.15em in reading
6. **Background:** Never pure white (#FEF9F0 cream default)
7. **Color Contrast:** High contrast (dark text on light backgrounds)
8. **Emphasis:** Use color/background only (never bold+italic)
9. **Numbers:** Include phonetic equivalents (e.g., "8 (eight)")
10. **Keyword Styling:** Yellow background highlighting

## TypeScript Interfaces (/lib/types.ts)

```typescript
ChunkObject {
  chunk_id, original_text, simplified_text,
  key_terms[], syllable_map{}, phonetic_map{},
  core_facts[], objective, numbers[], numbers_plain[],
  glossary{}, word_count
}

ChapterData {
  chapter_id, title, subject, class_level, board,
  chunks[], created_at, approved
}

StudentPrefs {
  font, fontSize, lineHeight, letterSpacing,
  background, showRuler, ttsSpeed, ttsAutoPlay
}

ProcessingStatus {
  stage, progress, message, chunk_current, chunk_total
}
```

## Deployment Considerations

### Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000  # For dev
NEXT_PUBLIC_BACKEND_URL=https://api.prod.com   # For prod
```

The `NEXT_PUBLIC_` prefix makes it available in the browser.

### CORS

If backend and frontend are on different origins:
- Backend must allow `Access-Control-Allow-Origin: *` (or specific origin)
- Frontend uses `fetch()` which respects CORS headers

### localStorage Limits

- Typical limit: 5–10MB per domain
- NeuroAdapt uses ~100KB (prefs + progress + cache)
- Safe for hundreds of chapters

### Bundle Size

Current estimated bundles:
- HTML: ~50KB
- JavaScript: ~200KB (Next.js framework code)
- CSS: ~30KB (Tailwind)
- **Total:** ~280KB (gzipped ~80KB)

## Performance Optimizations

1. **Image Lazy Load:** Next.js `Image` component
2. **Code Splitting:** Dynamic imports via `next/dynamic`
3. **Data Caching:** Chapter data cached in sessionStorage
4. **Scroll Optimization:** Passive event listeners
5. **Debounced State:** TTS word highlighting (100ms transition)

## Error Handling Strategy

```
Fetch Error
  ↓
throw Error("message")
  ↓
try/catch in component
  ↓
setToast({ message, type: 'error' })
  ↓
Toast component displays 3s, auto-dismisses
```

## Future Enhancements

1. **Offline Mode:** Service Worker + Cache API
2. **PDF Export:** Preserve styling in downloadable PDF
3. **Analytics:** Track reading patterns (teacher dashboard)
4. **Student Progress Reports:** Weekly/monthly summaries
5. **Collaboration:** Teachers grade student annotations
6. **Multi-Language:** Hindi, Tamil, Telugu, Kannada
7. **Custom Themes:** User-defined color schemes
8. **Accessibility:** WCAG 2.1 AAA compliance audit

---

This architecture prioritizes:
- **Simplicity:** Minimal dependencies, clear data flow
- **Accessibility:** DX for developers, UX for students
- **Performance:** Fast load times, smooth interactions
- **Dyslexia-Optimized:** Evidence-based typography & layout
