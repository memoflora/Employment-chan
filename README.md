# Employment-chan

Your anime companion that celebrates every job application with you! Built for Hack&Roll 2026.

## Features

- Detects when you submit a job application on LinkedIn
- Shows a cute anime girl celebration with confetti and sound effects
- AI-generated personalized messages (powered by OpenAI)
- Tracks your application count (total, today, this week)
- Anime-style encouraging messages in Japanese-inspired style

## Project Structure

```
Employment-chan/
├── contents/           # Content scripts (runs on LinkedIn)
├── backend/            # Flask server (handles OpenAI API)
│   ├── app.py
│   ├── requirements.txt
│   └── .env           # Your OpenAI API key (create this!)
├── assets/            # Images
├── popup.tsx          # Extension popup UI
├── background.ts      # Background service worker
└── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- pnpm (`npm install -g pnpm`)
- Python 3.10+
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### 1. Clone the repository

```bash
git clone <repo-url>
cd Employment-chan
```

### 2. Install extension dependencies

```bash
pnpm install
```

### 3. Set up the Flask backend

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 4. Create your `.env` file

Create a file called `.env` inside the `backend/` folder:

```bash
# backend/.env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Important:** Never commit this file! It's already in `.gitignore`.

### 5. Run the project

You need **2 terminals** running:

**Terminal 1 - Flask Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

**Terminal 2 - Chrome Extension:**
```bash
pnpm dev
```

### 6. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the folder: `build/chrome-mv3-dev`
5. You should see Employment-chan in your extensions!

### 7. Test it!

1. Go to [LinkedIn Jobs](https://www.linkedin.com/jobs/)
2. Find a job with "Easy Apply"
3. Complete and submit an application
4. Watch Employment-chan celebrate with you!

## Development

### Extension (Plasmo)
```bash
pnpm dev      # Development with hot reload
pnpm build    # Production build
```

### Backend (Flask)
```bash
cd backend
source venv/bin/activate
python app.py
```

## Quick Reference for Teammates

| What | Command |
|------|---------|
| Install JS deps | `pnpm install` |
| Create Python venv | `python3 -m venv backend/venv` |
| Activate venv (Mac/Linux) | `source backend/venv/bin/activate` |
| Activate venv (Windows) | `backend\venv\Scripts\activate` |
| Install Python deps | `pip install -r backend/requirements.txt` |
| Run backend | `cd backend && python app.py` |
| Run extension | `pnpm dev` |

## Environment Variables

| File | Variable | Description |
|------|----------|-------------|
| `backend/.env` | `OPENAI_API_KEY` | Your OpenAI API key |

## Tech Stack

- **Extension:** Plasmo, React, TypeScript
- **Backend:** Flask, OpenAI API
- **Detection:** URL pattern matching for LinkedIn post-apply pages

## License

MIT
