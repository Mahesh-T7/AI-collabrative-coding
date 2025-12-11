# Project Report — AI Collaborative Coding

Date: December 2025

## 1. Introduction

### 1.1 Project Description

AI Collaborative Coding (AI-COLLABRATIVE-CODING) is a web-based development environment that combines a modern code editor, real-time collaboration (CRDT-based), integrated AI assistants, and a backend platform for projects and file storage. The system enables multiple developers to edit the same file simultaneously with low-latency updates (Yjs + WebRTC), communicate via chat and a collaborative terminal, and leverage AI features (code generation, refactors, bug-detection, explanation) backed by OpenAI-compatible models. Authentication is JWT-based, with a Node/Express API and MongoDB for persistence. The frontend is a TypeScript React app built with Vite and a shadcn-ui/Tailwind UI stack.

Key capabilities:
- Real-time collaborative code editing (Yjs + y-webrtc)
- Monaco-based code editor with collaborator cursors and shared content
- AI assistant endpoints for generate/refactor/explain/bug-fixes
- Project and file management with upload/download
- In-browser code execution for JavaScript/TypeScript with captured output
- Integrated terminal (xterm) and optional video call

### 1.2 Company Profile

Company Name: [Your Company Name]

Overview: [Your Company Name] provides developer productivity and collaboration tools that improve pair-programming, remote onboarding, and code review workflows. The AI Collaborative Coding platform aims to reduce friction when collaborating on code by combining real-time editing with AI-assisted development.

Contact: replace-with-email@example.com

## 2. Literature Survey

### 2.1 Existing and Proposed System

Existing systems:
- Visual Studio Live Share: Real-time collaborative development within VS Code, focusing on synchronous collaboration but requiring VS Code clients.
- Replit, CodeSandbox: Browser-based development environments with real-time collaboration and containerized execution.
- GitHub Codespaces: Cloud-hosted dev environments closely integrated with GitHub repositories.

Limitations of existing systems:
- Many are vendor lock-in (tied to GitHub/VS Code).
- Limited or paid AI integrations.
- Some lack low-latency peer-to-peer CRDT syncing and in-browser console capture.

Proposed system advantages:
- Peer-to-peer CRDT (Yjs + WebRTC) reduces server bandwidth for collaboration and provides resilient offline edits.
- Built-in AI assistant integrated through backend endpoints for permissioning and cost control.
- Lightweight editor with in-browser code execution for fast feedback loops.

### 2.2 Feasibility Study

Technical feasibility:
- Frontend: Vite + React + Monaco Editor is a proven combination for fast editing experiences.
- Real-time: Yjs and y-webrtc offer mature CRDT and peer-to-peer transports.
- Backend: Node/Express + MongoDB is appropriate for authentication, project storage and AI proxying.

Operational feasibility:
- Requires WebRTC-compatible browsers and open ports for P2P connections (STUN recommended). Backend hosting should include a small server to proxy AI requests and manage project-level persistence.

Economic feasibility:
- Open-source components reduce licensing costs. AI model usage will cause variable costs depending on model choice.

### 2.3 Tools and Technologies Used

- Frontend: React, TypeScript, Vite, Monaco Editor
- UI: Tailwind CSS, shadcn-ui components
- Real-time: Yjs, y-webrtc, socket.io (for chat/terminal)
- Backend: Node.js, Express, MongoDB (Mongoose-style models used), JWT for auth
- AI: OpenAI-compatible APIs (proxied through backend) and client-side fallback
- Terminal: xterm.js
- Build/test: npm, vite

### 2.4 Hardware and Software Requirements

Minimum Hardware (developer machine):
- CPU: Dual-core 2+ GHz
- RAM: 4 GB (8+ GB recommended for comfortable editor and dev tools)
- Disk: 1 GB free for project files

Software:
- OS: Windows 10/11, macOS, or Linux
- Node.js (v18+ recommended)
- Modern browser: Chrome, Edge, Firefox (WebRTC enabled)

## 3. Software Requirements Specification

### 3.1 Users

Primary user types:
- Developer: Creates and edits code, runs in-browser execution, uses AI assistant, participates in collaborative sessions.
- Project Owner: Creates projects, manages collaborators, assigns files and permissions.
- Guest: Read-only or limited-edit user for demos or code reviews.

User needs:
- Low-latency editing, real-time presence, easy project/file import-export, secure authentication, AI assistance that aids productivity without leaking secrets.

### 3.2 Functional Requirements

FR1 — Authentication: Users must be able to register, login, and receive JWT tokens.
FR2 — Project management: Create, read, update, delete (CRUD) projects and files.
FR3 — Real-time editing: Multiple users may edit the same file simultaneously with conflict-free merging.
FR4 — Chat and presence: Real-time chat and collaborator cursors display.
FR5 — AI assistant: Request code generation, refactor, explain, and bug reports via secure backend endpoints.
FR6 — Code execution: Run JavaScript/TypeScript snippets in the browser and capture output.
FR7 — File import/export: Upload/download files and project archives.

### 3.3 Non-functional Requirements

- NFR1 — Security: JWT-based authentication, HTTPS for production, do not expose API keys to clients.
- NFR2 — Performance: Editor latency under 200ms for local edits; scalable backend for AI proxying.
- NFR3 — Reliability: CRDT ensures no data loss during short network partitions.
- NFR4 — Maintainability: Modular codebase with clear separation between UI, services, and backend APIs.

## 4. System Design (High Level / Architectural Design)

### 4.1 System Perspective

The system is a web application with two main tiers:

- Frontend (client): TypeScript React SPA, Monaco editor, Yjs document model for CRDT, WebRTC for peer-to-peer sync, socket.io for chat and terminal.
- Backend: Express API to manage users, projects, files, and AI proxying. MongoDB stores user and project metadata and files (or references).

Flow summary:
1. User logs in via `/auth/login` and receives a JWT.
2. User opens a project; the frontend fetches project metadata and file list from `/projects` endpoints.
3. When editing, the editor attaches a Yjs `Y.Doc` and connects to a `y-webrtc` provider with a room id derived from project and file.
4. AI requests are sent to `/api/ai` on the backend which validates the JWT and forwards the request to OpenAI with server-side API key.

### 4.2 Context Diagram (textual)

- Actor: Developer (web browser)
- System: AI Collaborative Coding
- External systems: OpenAI (AI provider), STUN servers for WebRTC, MongoDB

Interactions:
- Developer ↔ Web App (login, editing, chat)
- Web App ↔ Backend API (project CRUD, AI proxy)
- Backend API ↔ OpenAI (AI requests)

## 5. Detailed Design

> The following diagrams are described textually. Where images are required, placeholders are included. Replace with actual diagrams as needed.

### 5.1 Use Case Diagram (Described)

Primary use cases:
- Login/Register
- Create Project
- Open File
- Collaborate (Real-time edit)
- Chat
- Request AI Assistance
- Run Code
- Import/Export Files

Actors: Developer, Project Owner

### 5.2 Sequence Diagrams (Example: Collaborative Edit)

Sequence: User A & User B collaborative edit
1. A joins project; browser initializes Y.Doc and connects to y-webrtc room `project-file`.
2. B joins same room; y-webrtc peers exchange update messages.
3. A types; local Yjs updates are applied to A's editor and broadcast via WebRTC.
4. B receives updates and applies them to their editor; collaborator cursor updates are broadcast separately via socket.io or Yjs awareness.

Sequence: AI Request
1. User selects code and requests 'explain' via UI.
2. Client posts to `/api/ai/explain` with JWT in Authorization header.
3. Backend validates token, constructs OpenAI request, and forwards user request using server-side API key.
4. Backend receives response and relays it to client.

### 5.3 Collaboration Diagrams (Described)

Collaboration components:
- Yjs Document: stores text content and awareness state
- y-webrtc Provider: transports updates peer-to-peer
- Socket.io: used for presence, cursor positions, terminal events

### 5.4 Activity Diagram (Editing Session)

Activity steps:
1. User opens project → load files
2. User selects file → initialize editor + Yjs
3. User edits → local apply → broadcast update
4. Peers receive → apply updates → update UI
5. User saves → POST file contents to backend

### 5.5 Database Design

Conceptual entities:
- User: { id, username, email, passwordHash, createdAt }
- Project: { id, name, ownerId, collaborators[], createdAt }
- File: { id, projectId, name, content, language, createdAt, updatedAt }
- Message: { id, projectId, userId, text, createdAt }

Relationships: Project has many Files; Project has many Collaborators (User references); Messages belong to Project.

## 6. Implementation

### 6.1 Screenshots (placeholders)

Replace placeholders with actual screenshots from the running app.

- `screenshots/editor_main.png` — Main editor with file list and collaborator cursors
- `screenshots/ai_assistant.png` — AI assistant side-panel
- `screenshots/chat_and_terminal.png` — Chat panel and integrated terminal
- `screenshots/video_call.png` — In-app video call panel

Implementation notes:
- Frontend entry: `src/main.tsx`
- Editor page: `src/pages/Editor.tsx` (Monaco integration, run button, output panel)
- Auth context: `src/contexts/AuthContext.tsx` (JWT-based flows)
- API wrapper: `src/lib/api.ts` (axios instance with interceptor)
- Collaborative hook: `src/hooks/useCollaborativeEditor.ts` (Yjs initialization placeholder)
- Server entry: `server/server.js`, routes under `server/routes/`

## 7. Software Testing

Testing strategy:
- Unit tests for utility functions (not provided by default in this repo)
- Integration tests for API endpoints: test `auth`, `projects`, `files`, `ai` endpoints (use the existing `test-api.js` script as a basis).
- Manual E2E: Open two browser windows and confirm CRDT sync, chat, and terminal events.

Suggested test cases:
1. Registration and login flow — assert JWT returned and stored.
2. Project creation and file CRUD — assert file contents persist.
3. Collaborative edit — open two clients and ensure typed text appears on both.
4. AI request flow — ensure backend proxies request and client receives expected response (mock in CI to avoid cost).
5. Run code — execute JS code in editor and verify output panel shows results.

## 8. Conclusion

This project demonstrates a practical integration of CRDT-based real-time collaboration, AI-assisted development, and an interactive code editor within a browser environment. The architecture balances peer-to-peer syncing for collaboration with a trusted backend for authentication and AI proxying. The result is a responsive, extensible platform for collaborative coding.

## 9. Future Enhancements

- Add offline editing persistence and conflict resolution hints.
- Integrate server-side code execution sandbox (e.g., firecracker, container-based) for languages other than JavaScript.
- RBAC and fine-grained permissioning for project resources.
- CI integration to run tests on saved changes.
- Improve AI model orchestration and cost-management (batching, caching responses).

---

## Appendix A — Bibliography

- Yjs documentation — https://yjs.dev/
- Monaco Editor — https://microsoft.github.io/monaco-editor/
- OpenAI API docs — https://platform.openai.com/docs

## Appendix B — User Manual (Brief)

Getting started:
1. Install Node.js v18+.
2. In project root, run `npm install` then `npm run dev` to start the frontend.
3. Start backend: `cd server && npm install && npm run dev`.
4. Open browser at the Vite URL (e.g., `http://localhost:8082`).

Auth & Projects:
- Register a new account via `/auth` page.
- Create a project, add files, invite collaborators by sharing project id.

Collaboration:
- Open the same file in another browser/window and edits will appear in realtime.

AI Assistant:
- Open AI panel and select the action (explain, refactor, find bugs). Results appear in the panel.

Code Execution:
- Open a JavaScript file and click `Run`. Output will appear in the output panel.

Contact & Support: replace-with-email@example.com
