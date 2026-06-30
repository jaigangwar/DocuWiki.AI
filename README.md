# DocuWiki.AI — Deterministic PDF Knowledge Management

**DocuWiki.AI** converts PDFs into interconnected, structured knowledge graphs using the **Open Knowledge Format (OKF v0.1)**. No chunk loss, no hallucinations — 100% interoperable Markdown.

Built with Next.js 15, React 19, Tailwind CSS v4, Framer Motion, and Groq AI.

---

## ✨ Features

- **PDF Upload & Extraction** — Drag-and-drop multiple PDFs. Text is extracted client-side using `pdfjs-dist`.
- **AI-Powered OKF Structuring** — Groq's `llama-3.3-70b-versatile` decomposes documents into atomic concept files with YAML frontmatter.
- **Knowledge Graph Browser** — IDE-like file tree explorer with tabbed Markdown viewer.
- **Zero-Hallucination Chat** — Ask questions; the agent only answers from your knowledge base with clickable source citations.
- **Export as ZIP** — Download your entire knowledge base as standard Markdown files, ready for Obsidian, Notion, or any Markdown tool.
- **Custom Mouse Effects** — Animated cursor follower and particle trail.
- **3D Hover Interactions** — Tilt + glare effects on cards and interactive elements.
- **Persistent Storage** — IndexedDB-backed virtual filesystem retains data across sessions.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.18+ (recommended: 20.x LTS)
- **npm** (comes with Node.js)
- **Groq API Key** — Get one free at [console.groq.com](https://console.groq.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/jaigangwar/DocuWiki.AI.git
cd DocuWiki.AI

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

Edit `.env.local` and add your Groq API key:

```env
GROQ_API_KEY=gsk_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 🏗️ Project Structure

```
DocuWiki.AI/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx                # Landing page
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   ├── globals.css             # Tailwind CSS v4 + custom styles
│   │   ├── workspace/page.tsx      # Workspace (PDF upload, processing, viewer)
│   │   ├── chat/page.tsx           # Knowledge agent chat
│   │   └── api/
│   │       ├── process-okf/route.ts  # OKF structuring API
│   │       └── chat/route.ts         # Streaming chat API
│   ├── components/
│   │   ├── landing/                # Landing page components
│   │   │   ├── Navbar.tsx
│   │   │   ├── HeroMesh.tsx        # Canvas-based animated network
│   │   │   ├── StatsCounter.tsx     # Animated stats
│   │   │   └── FeatureCards.tsx     # Feature grid
│   │   ├── workspace/              # Workspace components
│   │   │   ├── DropZone.tsx         # PDF upload area
│   │   │   ├── ProcessingStepper.tsx# Processing pipeline UI
│   │   │   ├── FileTree.tsx         # Knowledge base tree
│   │   │   ├── MarkdownViewer.tsx   # Tabbed markdown viewer
│   │   │   └── ExportButton.tsx     # ZIP export
│   │   ├── chat/                   # Chat components
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── SourceCitations.tsx
│   │   │   └── SourceViewer.tsx
│   │   └── ui/                     # Reusable UI primitives
│   │       ├── AnimatedGradient.tsx # Ambient gradient orbs
│   │       ├── NeonButton.tsx
│   │       ├── GlassCard.tsx
│   │       ├── Sidebar.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ClientLayout.tsx    # Client wrapper (mouse effects)
│   │       ├── MouseFollower.tsx   # Custom cursor + trail
│   │       └── Tilt3D.tsx          # 3D tilt + glare HOC
│   ├── lib/
│   │   ├── groq.ts                 # Groq SDK client (chat + retry)
│   │   ├── pdf-extract.ts          # PDF text extraction (pdfjs-dist)
│   │   ├── virtual-fs.ts           # IndexedDB virtual filesystem
│   │   └── okf-prompts.ts          # OKF system prompts
│   └── store/
│       └── workspace-store.ts      # Zustand global state
├── .env.example                    # Environment template
├── .gitignore
├── next.config.ts                  # Next.js config (webpack aliases)
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── package.json
```

---

## 🧠 How It Works

### 1. Upload PDFs
Drag & drop PDF files into the workspace. Text is extracted client-side using `pdfjs-dist` — your documents never leave your browser until processing.

### 2. AI Structures into OKF
Groq's `llama-3.3-70b-versatile` analyzes the extracted text and decomposes it into atomic **OKF files** — self-contained Markdown documents with YAML frontmatter:

```yaml
---
type: policy
title: Annual Budget Guidelines
tags: [finance, budget, Q4]
resource: report.pdf#page=12
---
## Overview
The annual budget must align with...
[Related: Revenue Policy](/finance/revenue-policy.md)
```

Each file represents a single concept, process, policy, or entity. Files are cross-linked via relative Markdown links, forming a knowledge graph.

### 3. Explore & Query
Browse your knowledge graph in the file explorer, or ask the AI agent questions. The agent:
1. Finds relevant files via tag/title/content matching
2. Sends only those files as context to Groq
3. Returns cited answers with clickable source links

### 4. Export
Download your entire knowledge base as a ZIP of standard Markdown files — zero vendor lock-in.

---

## ⚙️ Performance Optimizations

- **Lazy loading**: `pdfjs-dist` (~5MB) is dynamically imported only when "Process PDFs" is clicked, not on page load
- **Throttled animations**: Mouse follower uses `requestAnimationFrame` to avoid layout thrashing
- **GPU-accelerated**: 3D tilt effects use `will-change-transform` and `transform-style: preserve-3d`
- **Tailwind CSS v4**: Zero-runtime CSS, purged unused styles in production
- **Turbopack**: Dev server uses Next.js Turbopack for fast HMR
- **IndexedDB**: Knowledge base is stored client-side, no server database needed

---

## 🐳 API Reference

### `POST /api/process-okf`
Process extracted PDF text into OKF files.

**Request:**
```json
{
  "documents": [
    { "filename": "report.pdf", "text": "...", "pages": 5 },
    { "filename": "policy.pdf", "text": "...", "pages": 12 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "files": [
    { "filepath": "knowledge_base/finance/budget.md", "content": "---\ntype: policy\n..." }
  ],
  "stats": { "inputDocuments": 2, "outputFiles": 14 }
}
```

### `POST /api/chat`
Streaming chat with source citations.

**Request:**
```json
{
  "query": "What is the budget policy?",
  "contextFiles": [
    { "filepath": "knowledge_base/finance/budget.md", "content": "..." }
  ]
}
```

**Response:** Server-Sent Events stream:
```
data: {"content": "The budget policy states..."}
data: {"content": " that revenue must...\n\n[Source:"}
data: {"content": " /finance/budget.md]"}
data: [DONE]
```

---

## 🎨 Customization

### Theme Colors
Edit CSS variables in `src/app/globals.css` under `@theme`:
```css
--color-neon-cyan: #06d6a0;
--color-neon-violet: #7c3aed;
--color-surface-900: #0a0a0f;
```

### OKF System Prompts
Modify prompts in `src/lib/okf-prompts.ts` to change how the LLM structures knowledge.

### Mouse Effects
Configure cursor appearance in `src/components/ui/MouseFollower.tsx`.

### 3D Tilt
Adjust tilt sensitivity in each `<Tilt3D maxTilt={5} scale={1.02} glare>` usage.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **"Groq API key not set"** | Add `GROQ_API_KEY` to `.env.local` |
| **"Token limit exceeded"** | Process smaller PDFs, or upgrade at [console.groq.com](https://console.groq.com/settings/billing) |
| **Hydration error** | Clear `.next` cache and restart: `Remove-Item -Recurse .next` |
| **PDF extraction fails** | Ensure PDFs are text-based (not scanned images) |
| **Slow page load** | Wait for dynamic import — `pdfjs-dist` loads only when needed |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for ultra-fast LLM inference
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) for PDF processing
- [Next.js](https://nextjs.org) for the app framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Framer Motion](https://framermotion.framer.website) for animations
- [Lucide Icons](https://lucide.dev) for icons
- [Zustand](https://zustand-demo.pmnd.rs) for state management
