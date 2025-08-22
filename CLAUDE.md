# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a full-stack demo application with a React frontend and FastAPI backend:

```
demo/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx    # Main application component
│   │   └── main.jsx   # React entry point
│   ├── package.json
│   └── vite.config.js
├── backend/           # FastAPI Python backend  
│   ├── main.py        # FastAPI server with CORS middleware
│   └── requirements.txt
└── README.md
```

## Development Commands

### Frontend (React + Vite + Tailwind)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (localhost:5173)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Backend (FastAPI + Python)
```bash
cd backend
python -m venv venv                    # Create virtual environment
venv\Scripts\activate                  # Activate (Windows)
source venv/bin/activate               # Activate (Linux/Mac)
pip install -r requirements.txt       # Install dependencies
python main.py                        # Start server (localhost:8000)
```

## Architecture

- **Frontend**: React 19 with modern React patterns (hooks, function components)
- **Backend**: FastAPI with CORS middleware configured for frontend origin
- **Styling**: Tailwind CSS 4.x with utility-first approach
- **Build Tool**: Vite for fast development and building
- **API Communication**: Frontend fetches data from backend using standard fetch API

### Key Integration Points
- Backend CORS allows `http://localhost:5173` (Vite dev server)
- Frontend makes API calls to `http://localhost:8000` 
- API endpoints: `/` (root message) and `/api/health` (health check)

## Configuration Notes

- ESLint configured with React hooks and refresh plugins
- Tailwind scans `./src/**/*.{js,ts,jsx,tsx}` and `./index.html`
- FastAPI runs with uvicorn on all interfaces (`0.0.0.0:8000`)
- No testing framework currently configured