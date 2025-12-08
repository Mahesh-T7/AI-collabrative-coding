# TaskFlow - Full Stack Demo

A clean, modern task management application demonstrating full-stack best practices.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS (CDN for demo portability), Lucide Icons
- **Backend**: Node.js, Express
- **Database**: Local JSON-based persistence (NoSQL simulation)

## How to Run

### Prerequisites
- Node.js installed

### Steps

1.  **Backend Setup**
    ```bash
    cd backend
    npm install
    npm start
    ```
    server runs on `http://localhost:3001`

2.  **Frontend Setup**
    Open a new terminal:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    App runs on `http://localhost:5174`

## Features
- Create new tasks
- Mark tasks as completed/active
- Delete tasks
- Data persists in `backend/src/utils/db.json`
