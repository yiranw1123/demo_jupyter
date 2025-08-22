# React + Tailwind + Python FastAPI Project

This project consists of a React frontend with Tailwind CSS and a Python FastAPI backend.

## Project Structure
```
demo/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/           # FastAPI Python backend
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## Setup

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the server:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## API Endpoints
- `GET /` - Root endpoint
- `GET /api/health` - Health check endpoint