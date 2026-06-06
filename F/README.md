# NeuroAdapt — Dyslexia-Friendly NCERT Reader

NeuroAdapt transforms NCERT textbook chapters into dyslexia-optimized reading experiences for Indian government school students. Teachers upload chapters, and students read with AI-simplified text, phonetic guides, text-to-speech, and full accessibility controls.

## Features

### For Teachers
- 📤 Upload NCERT PDFs or paste text directly
- 🔄 Automatic AI-powered transformation: extraction, cleaning, chunking, simplification
- ✏️ Edit and refine AI-generated content before sharing
- 📊 Real-time processing status with progress tracking
- 🔐 Generate shareable codes for student access
- 📚 Maintain a library of processed chapters

### For Students
- 📖 Chunk-by-chunk reading with sidebar glossary
- 🎤 Text-to-Speech with word-by-word highlighting (Web Speech API)
- 📏 Adjustable reading ruler to guide eye movement
- 🎨 Dyslexia-friendly fonts: OpenDyslexic, Lexend, system
- ⚙️ Full accessibility controls: font size, line height, letter spacing, background colour
- 🔑 Phonetic hints for complex terms
- 📊 Progress tracking saved to localStorage
- 🌙 Dark mode support

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI Backend:** Python FastAPI (runs locally on port 8000)
- **Storage:** localStorage (student preferences, reading progress)
- **APIs:** Web Speech API (TTS), Fetch API (backend communication)
- **No external UI libraries** — pure custom Tailwind styling

## Project Structure

```
neuroadapt/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page
│   ├── globals.css                 # Tailwind CSS
│   ├── teacher/
│   │   ├── page.tsx                # Teacher dashboard
│   │   └── review/[id]/page.tsx   # Review before sharing
│   ├── student/
│   │   └── [chapterId]/page.tsx   # Student reader
│   └── api/                        # API routes (proxy to FastAPI)
├── components/
│   ├── teacher/
│   │   ├── UploadPanel.tsx
│   │   ├── ProcessingStatus.tsx
│   │   ├── BeforeAfterView.tsx
│   │   └── ChapterCard.tsx
│   ├── student/
│   │   ├── ChunkReveal.tsx
│   │   ├── ReadingRuler.tsx
│   │   ├── TTSControls.tsx
│   │   ├── GlossaryPanel.tsx
│   │   ├── WordTooltip.tsx
│   │   └── AccessibilityBar.tsx
│   └── shared/
│       ├── ProgressRing.tsx
│       └── Toast.tsx
├── hooks/
│   ├── useReading.ts
│   ├── useAccessibility.ts
│   └── useChapter.ts
├── lib/
│   ├── types.ts
│   ├── tts.ts
│   ├── storage.ts
│   └── api.ts
└── public/
    └── fonts/
        └── OpenDyslexic.woff2
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Python FastAPI backend running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local to configure backend URL if needed
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

## Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## API Routes (Next.js Proxy)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/process` | POST | Upload & process chapter |
| `/api/chapters` | GET | List all chapters |
| `/api/chapters/[id]` | GET | Fetch single chapter |
| `/api/chapters/[id]` | PATCH | Approve chapter |
| `/api/chapters/[id]/chunks/[chunkId]` | PATCH | Update chunk text |
| `/api/processing-status/[id]` | GET | Check processing progress |
| `/api/share/[code]` | GET | Fetch by share code |

## Design System

### Colors
- **Primary:** `#534AB7` (purple)
- **Accent:** `#1D9E75` (teal)
- **Error:** `#E24B4A` (red)
- **Backgrounds:** Cream `#FEF9F0` (default), white, blue `#EFF6FF`, dark `#1a1a1a`

### Typography (Dyslexia-Optimized)
- **Fonts:** OpenDyslexic (dyslexia-focused), Lexend (high-contrast), system fallback
- **Student reader:** Minimum 18px, 1.8 line-height, maximum 65ch width
- **Never:** Justified text, pure white backgrounds, italic decoration
- **Special:** Phonetic hints, syllable splits (·), color highlighting for keywords

### Spacing & Layout
- Generous padding (min 24px horizontal)
- Chunks separated by visual dividers
- Never full-width text blocks on student reader
- Flexible, responsive design

## Features Detail

### Student Reading Experience
1. **ChunkReveal** — One section at a time, with:
   - Syllable splits (pho·to·syn·the·sis) in lighter color
   - Keywords highlighted in yellow
   - Numbers replaced with plain text versions
   - "In short" summary and core facts
   - Previous/Next navigation + keyboard shortcuts (arrow keys, spacebar)

2. **TTS Controls** — Bottom bar with:
   - Play/pause button
   - Speed selector (0.5x–1.5x)
   - Voice selector (system voices)
   - Word-by-word highlighting as TTS speaks

3. **Reading Ruler** — Semi-transparent yellow bar:
   - Follows mouse on desktop
   - Follows scroll position on mobile
   - Smooth animation for visual comfort

4. **Glossary Panel** — Slide-in drawer with:
   - Searchable key terms
   - Definitions and phonetic hints
   - Triggered by glossary button or keyword tap

5. **Accessibility Bar** — Collapsible settings:
   - Font selection (OpenDyslexic, Lexend, system)
   - Font size (16–28px)
   - Line height (1.4–2.4)
   - Letter spacing (0–0.15em)
   - Background colour (cream, white, blue, dark)
   - Reading ruler toggle
   - TTS auto-play
   - All saved to localStorage

### Teacher Workflow
1. **Upload** → Select class, subject, board
2. **Processing** → Real-time progress with stage indicators
3. **Review** → Side-by-side before/after, edit chunks
4. **Approve** → Generate share code, mark as ready
5. **Share** → Distribute 6-digit code to students

## Dyslexia-Friendly Best Practices

✓ Never justify text (align left always)  
✓ Minimum 1.8 line-height in reader  
✓ Minimum 18px font in reader  
✓ Maximum 65 characters per line  
✓ 0.05em letter-spacing in reader  
✓ Generous word spacing (0.1em)  
✓ No pure white backgrounds (use cream/blue instead)  
✓ Syllable splits with visual cues  
✓ Keywords highlighted (never bold+italic together)  
✓ No underlining except for links  
✓ Sentence case for headings (never all-caps)  
✓ Numbers with phonetic equivalents  
✓ High contrast text on backgrounds  

## Keyboard Shortcuts (Student Reader)

| Key | Action |
|-----|--------|
| Space / → | Next chunk |
| ← | Previous chunk |
| G | Toggle glossary |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Web Speech API required for TTS

## Deployment

### Vercel (Recommended)

```bash
vercel
```

Set environment variables in Vercel dashboard:
```
NEXT_PUBLIC_BACKEND_URL=<your-backend-url>
```

### Self-Hosted

```bash
npm run build
npm run start
```

Ensure FastAPI backend is accessible at the configured URL.

## Contributing

Contributions welcome! Areas for improvement:
- [ ] Export to PDF with styling preserved
- [ ] Offline reading (service worker)
- [ ] Analytics dashboard for teachers
- [ ] Student progress reports
- [ ] Multi-language support
- [ ] Additional font options
- [ ] Custom color themes

## License

MIT — NeuroAdapt is open source.

## Support

For issues or feature requests, contact the NeuroAdapt team or raise an issue in the GitHub repository.

---

Built with ❤️ for every brain. Every student deserves accessible learning.
