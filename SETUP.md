# PO Workbench — Setup Guide

## First-Time Setup

### 1. Clone and Install

```bash
git clone <repository>
cd po-workbench
npm install
```

### 2. Configure Environment

Copy the template and add your API key:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-proj-YOUR_API_KEY_HERE
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Important Notes

⚠️ **Never commit `.env.local`** — it contains your API key and is in `.gitignore`

✅ **Pre-commit hooks** prevent accidental secret commits — if you see an error when committing, check your staged changes

---

## Troubleshooting

**"API key not configured" error?**
- Make sure `.env.local` exists
- Check that `OPENAI_API_KEY=sk-proj-...` is set correctly
- Restart the dev server after changing .env files

**Pre-commit hook blocking my commit?**
- Check what files you're committing: `git diff --cached`
- Make sure you haven't staged `.env.local` or other secret files
- Use `.env.local.example` if you need to share configuration templates

---

## Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

---

For more details, see [CLAUDE.md](./CLAUDE.md)
