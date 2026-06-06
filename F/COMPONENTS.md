# Component Reference

Complete guide to all NeuroAdapt components.

## Shared Components

### ProgressRing

Circular progress indicator.

```tsx
import { ProgressRing } from '@/components/shared/ProgressRing'

<ProgressRing 
  progress={65}           // 0-100
  size={100}              // px
  strokeWidth={4}         // px
  label="65%"             // optional
/>
```

**Props:**
- `progress: number` — percentage (0-100)
- `size?: number` — default 100px
- `strokeWidth?: number` — default 4px
- `label?: string` — optional text below ring

**Styling:**
- Background ring: gray (`#E5E7EB`)
- Progress ring: purple (`#534AB7`)
- Smooth transition on progress change

---

### Toast

Dismissable notification.

```tsx
import { Toast } from '@/components/shared/Toast'

<Toast 
  message="Chapter uploaded!"
  type="success"           // 'success' | 'error' | 'info'
  duration={3000}          // ms (0 = no auto-dismiss)
  onClose={() => {}}       // optional callback
/>
```

**Props:**
- `message: string` — notification text
- `type?: 'success' | 'error' | 'info'` — default 'info'
- `duration?: number` — auto-dismiss time in ms (default 3000, 0 = disabled)
- `onClose?: () => void` — called when dismissed

**Colors:**
- Success: teal (`#1D9E75`)
- Error: red (`#E24B4A`)
- Info: purple (`#534AB7`)

---

## Teacher Components

### UploadPanel

Teacher upload interface with PDF/text input, class/subject/board selectors.

```tsx
import { UploadPanel } from '@/components/teacher/UploadPanel'

<UploadPanel 
  onSubmit={(metadata) => console.log(metadata)}
  isLoading={false}
/>
```

**Props:**
- `onSubmit: (metadata: UploadMetadata) => void` — called on submit
- `isLoading?: boolean` — disables form during upload

**UploadMetadata output:**
```tsx
{
  file?: File              // selected PDF
  text?: string           // pasted text (mutually exclusive with file)
  class_level: number     // 6-10
  subject: string         // 'science', 'maths', etc.
  board: string           // 'ncert', 'scert', 'state-board'
}
```

**Features:**
- Drag-and-drop PDF upload
- Paste text toggle
- Class selector: 6, 7, 8, 9, 10 (pill buttons)
- Subject selector: Science, Maths, Social Science, English, Hindi (icons)
- Board selector: NCERT, SCERT, State Board (radio)
- Form validation (requires file/text + class + subject)

---

### ProcessingStatus

Real-time processing progress indicator.

```tsx
import { ProcessingStatus } from '@/components/teacher/ProcessingStatus'

<ProcessingStatus 
  status={{
    stage: 'simplifying',      // current stage
    progress: 45,              // 0-100
    message: 'Processing...',
    chunk_current: 3,
    chunk_total: 8
  }}
/>
```

**Props:**
- `status: ProcessingStatus` — from backend polling

**Status value:**
```tsx
{
  stage: 'idle' | 'extracting' | 'cleaning' | 'chunking' 
       | 'identifying' | 'simplifying' | 'rendering' 
       | 'complete' | 'error'
  progress: number           // 0-100
  message: string
  chunk_current: number
  chunk_total: number
}
```

**Features:**
- Animated progress bar (purple)
- Stage icons with labels
- Current chunk counter
- Estimated time remaining
- Error state display (red)
- Pulsing animation during processing

---

### BeforeAfterView

Side-by-side comparison of original vs transformed text.

```tsx
import { BeforeAfterView } from '@/components/teacher/BeforeAfterView'

<BeforeAfterView 
  chunks={chapter.chunks}
  onChunkUpdate={(chunkId, text) => {
    // Save edited text
  }}
/>
```

**Props:**
- `chunks: ChunkObject[]` — all chunks in chapter
- `onChunkUpdate?: (chunkId, text) => void` — inline edit callback

**Features:**
- Two columns: Original (red-tinted) | Transformed (green-tinted)
- Chunk navigation: Previous/Next buttons + dot indicator
- Click to edit: inline edit mode for simplified text
- Save/Cancel buttons in edit mode
- Key terms display with yellow badges
- Auto-sync when editing chunk

---

### ChapterCard

Card displaying chapter metadata and actions.

```tsx
import { ChapterCard } from '@/components/teacher/ChapterCard'

<ChapterCard 
  chapter={chapterData}
  shareCode="ABC123"      // optional
/>
```

**Props:**
- `chapter: ChapterData` — chapter to display
- `shareCode?: string` — if approved

**Features:**
- Chapter title, subject, class level
- Approval status badge
- Chunk count, creation date
- Share code display (if approved)
- "Review" button (always)
- "Preview" button (only if approved)
- Copy-to-clipboard for share code

---

## Student Components

### ChunkReveal

Main reading interface — one chunk at a time.

```tsx
import { ChunkReveal } from '@/components/student/ChunkReveal'

<ChunkReveal 
  chunk={currentChunk}
  onNext={() => {}}
  onPrevious={() => {}}
  canNext={true}
  canPrevious={false}
  activeWordIndex={5}
  fontSize={18}
  lineHeight={1.8}
  letterSpacing={0.05}
/>
```

**Props:**
- `chunk: ChunkObject` — content to render
- `onNext: () => void` — next button clicked
- `onPrevious: () => void` — previous button clicked
- `canNext: boolean` — disable next if at end
- `canPrevious: boolean` — disable previous if at start
- `activeWordIndex?: number` — word index to highlight (TTS)
- `fontSize?: number` — in pixels
- `lineHeight?: number` — multiplier (1.4-2.4)
- `letterSpacing?: number` — in em units
- `keyboardEnabled?: boolean` — enable spacebar/arrow navigation

**Features:**
- Renders simplified_text with markup:
  - Key terms: yellow background + medium font-weight
  - Active word (TTS): yellow background + transition
  - Numbers: footnotes with plain text equivalents
- Objective summary in blue info box ("In short:")
- Core facts list with bullet points
- Previous/Next buttons + keyboard shortcuts (space, arrows)
- Mobile swipe support (right = next)

---

### ReadingRuler

Horizontal highlight bar following eye position.

```tsx
import { ReadingRuler } from '@/components/student/ReadingRuler'

<ReadingRuler enabled={true} />
```

**Props:**
- `enabled: boolean` — show/hide ruler

**Features:**
- Semi-transparent yellow (opacity 0.6)
- Height: 2.2em (matches text line height)
- Desktop: follows mouse Y position with smooth animation
- Mobile: stays at 40% viewport height
- Updates every animation frame (60fps)
- Subtly glowing shadow effect

---

### TTSControls

Text-to-speech controls (fixed bottom bar).

```tsx
import { TTSControls } from '@/components/student/TTSControls'

<TTSControls 
  text={chunk.simplified_text}
  onWordChange={(index) => {
    // Update activeWordIndex
  }}
  onComplete={() => {
    // Move to next chunk
  }}
  speed={1}
  autoPlay={false}
/>
```

**Props:**
- `text: string` — text to speak
- `onWordChange?: (index) => void` — word boundary event
- `onComplete?: () => void` — TTS finished
- `speed?: number` — playback speed (default 1)
- `autoPlay?: boolean` — start immediately (default false)

**Features:**
- Play/pause button (48px, purple)
- Speed buttons: 0.5x, 0.75x, 1x, 1.25x, 1.5x
- Voice selector (system voices)
- Word-by-word highlighting via Web Speech API
- Status indicator ("🔊 Speaking..." or "TTS ready")
- Blurred backdrop for visibility over content
- Returns null if Web Speech API not supported

---

### GlossaryPanel

Slide-in panel with searchable key terms and definitions.

```tsx
import { GlossaryPanel } from '@/components/student/GlossaryPanel'

<GlossaryPanel 
  glossary={chunk.glossary}
  keyTerms={chunk.key_terms}
  isOpen={true}
  onClose={() => {}}
/>
```

**Props:**
- `glossary: Record<string, string>` — term → definition map
- `keyTerms: string[]` — all terms (in order)
- `isOpen: boolean` — show/hide panel
- `onClose: () => void` — close requested

**Features:**
- Slide in from right (320px wide, 250ms animation)
- Search input (case-insensitive filter)
- Term list with definitions
- Each term styled in OpenDyslexic font (large)
- Backdrop click to close
- Empty state message if no matches

---

### WordTooltip

Inline tooltip for word definitions.

```tsx
import { WordTooltip } from '@/components/student/WordTooltip'

<WordTooltip 
  word="photosynthesis"
  definition="Process of converting light energy to food"
>
  <span className="bg-yellow-100">photosynthesis</span>
</WordTooltip>
```

**Props:**
- `word: string` — (unused in current version)
- `definition?: string` — tooltip content (returns children if missing)
- `children: React.ReactNode` — element to wrap

**Features:**
- Hover/touch to show definition
- Tooltip appears above element
- Dark background, white text
- Arrow pointer pointing to element
- Auto-dismisses on mouse leave
- Touch devices: show on start, hide on end

---

### AccessibilityBar

Collapsible settings panel (top right, fixed).

```tsx
import { AccessibilityBar } from '@/components/student/AccessibilityBar'

<AccessibilityBar 
  prefs={studentPrefs}
  onUpdate={(key, value) => {
    // Save preference
  }}
  onReset={() => {
    // Reset to defaults
  }}
/>
```

**Props:**
- `prefs: StudentPrefs` — current settings
- `onUpdate: (key, value) => void` — preference changed
- `onReset: () => void` — reset button clicked

**Settings:**
1. **Font** — buttons for OpenDyslexic, Lexend, System
2. **Font Size** — slider 16–28px
3. **Line Height** — slider 1.4–2.4
4. **Letter Spacing** — slider 0–0.15em
5. **Background Color** — 4 color swatches
6. **Reading Ruler** — toggle switch
7. **TTS Speed** — slider 0.5–2x
8. **TTS Auto-play** — toggle switch
9. **Reset Button** — restore defaults

**Features:**
- Collapsed: ⚙️ button (top right)
- Expanded: full settings panel
- All values show numeric labels
- Toggle switches with smooth animation
- Color swatches show actual colors
- Applies changes immediately via `onUpdate`

---

## Hook Reference

### useReading(chapterId, totalChunks)

Manage reading state and persistence.

```tsx
const {
  currentChunkIndex,
  setCurrentChunkIndex,
  completedChunks,
  ttsActive,
  ttsPlaying,
  activeWordIndex,
  nextChunk,
  prevChunk,
  markComplete,
  startTTS,
  pauseTTS,
  resumeTTS,
  stopTTS,
  setActiveWord,
  progressPercentage
} = useReading(chapterId, totalChunks)
```

**Returns:**
- `currentChunkIndex: number` — 0-based index
- `setCurrentChunkIndex: (i) => void` — direct setter
- `completedChunks: string[]` — chunk_ids marked complete
- `ttsActive: boolean` — TTS initiated
- `ttsPlaying: boolean` — currently playing
- `activeWordIndex: number` — word index for highlighting
- `nextChunk(): void` — increment index, save
- `prevChunk(): void` — decrement index, save
- `markComplete(chunkId): void` — add to completedChunks
- `startTTS(): void` — initiate TTS
- `pauseTTS(): void` — pause (can resume)
- `resumeTTS(): void` — resume from pause
- `stopTTS(): void` — stop completely
- `setActiveWord(index): void` — for word highlighting
- `progressPercentage: number` — 0-100

**localStorage keys:**
```
neuroadapt_progress_{chapterId}
→ { currentChunkIndex, completedChunks }
```

---

### useAccessibility()

Manage student accessibility preferences.

```tsx
const { prefs, updatePref, reset, mounted } = useAccessibility()

updatePref('fontSize', 20)  // Type-safe
updatePref('background', 'dark')
reset()
```

**Returns:**
- `prefs: StudentPrefs` — all settings
- `updatePref<K>(key, value): void` — save preference
- `reset(): void` — restore defaults
- `mounted: boolean` — hydration complete

**localStorage key:**
```
neuroadapt_student_prefs
→ StudentPrefs object
```

**Side Effects:**
- Sets CSS variables on `document.documentElement`
- Applies font/size/color directly to `document.body`

---

### useChapter(chapterId)

Fetch and cache chapter data.

```tsx
const { chapter, loading, error, refetch } = useChapter(chapterId)

if (loading) return <Spinner />
if (error) return <Error message={error.message} />

// chapter is fully typed ChapterData
```

**Returns:**
- `chapter: ChapterData | null` — loaded chapter
- `loading: boolean` — fetching in progress
- `error: Error | null` — fetch error
- `refetch(): Promise<void>` — re-fetch from API

**Caching:**
- Checks sessionStorage first (24h TTL)
- Falls back to API if not cached
- Automatic cache expiration

---

## Styling System

### Tailwind Classes Used

```tsx
// Colors (from theme.extend.colors)
bg-cream, text-dark-text, border-brand-purple
bg-accent-teal, bg-error-red

// Typography
font-opendyslexic, font-lexend
text-{size}  // 14px to 7xl

// Spacing (prose-x = 24px)
px-prose-x, py-{size}
gap-{size}

// Layout
max-w-prose  // 65ch
container, mx-auto
grid, flex, inline-flex

// Interactive
hover:, focus:, disabled:
transition-{property}, duration-{ms}

// Animation
animate-chunk-reveal, animate-pulse-bar
```

### Custom CSS (globals.css)

```css
@layer utilities {
  .font-opendyslexic { ... }
  .font-lexend { ... }
  .prose-para { ... }
}
```

### CSS Variables (Applied by useAccessibility)

```css
--font-family
--font-size
--line-height
--letter-spacing
--bg-color
--text-color
```

Used throughout components via inline styles:

```tsx
<div style={{
  fontSize: `${prefs.fontSize}px`,
  lineHeight: prefs.lineHeight,
  letterSpacing: `${prefs.letterSpacing}em`
}}>
```

---

## Common Patterns

### Form Handling

```tsx
const [value, setValue] = useState('')
const [isSubmitting, setIsSubmitting] = useState(false)

const handleSubmit = async () => {
  try {
    setIsSubmitting(true)
    await apiCall(value)
    setToast({ message: 'Success!', type: 'success' })
  } catch (error) {
    setToast({ message: error.message, type: 'error' })
  } finally {
    setIsSubmitting(false)
  }
}
```

### Modal/Panel

```tsx
const [isOpen, setIsOpen] = useState(false)

return (
  <>
    <button onClick={() => setIsOpen(true)}>Open</button>
    {isOpen && (
      <>
        <div onClick={() => setIsOpen(false)} />
        <div className="...modal content...">
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      </>
    )}
  </>
)
```

### Effects & Cleanup

```tsx
useEffect(() => {
  const listener = (e: KeyboardEvent) => { ... }
  window.addEventListener('keydown', listener)
  return () => window.removeEventListener('keydown', listener)
}, [dependencies])
```

---

## Extending Components

### Add a New Setting to AccessibilityBar

1. Add property to `StudentPrefs` in `lib/types.ts`
2. Add to `DEFAULT_PREFS` in `hooks/useAccessibility.ts`
3. Add UI control in `AccessibilityBar.tsx`
4. Call `onUpdate(key, value)` on change

### Add a New Chunk Annotation

1. Add field to `ChunkObject` interface
2. Update backend to return it
3. Render in `ChunkReveal.tsx` (e.g., in a new colored box)

### Add a New Page

1. Create `app/{section}/page.tsx`
2. Import components, hooks
3. Use `useRouter()` for navigation
4. Export as default function

---

All components follow these principles:
- ✓ Full TypeScript support
- ✓ No external UI libraries (Tailwind only)
- ✓ Dyslexia-optimized styling
- ✓ Accessibility-first (ARIA labels, keyboard support)
- ✓ Mobile-responsive
- ✓ Well-commented code
