# CodeCollab - Comprehensive Project Walkthrough

**Date:** December 2025
**Project Name:** CodeCollab (AI Collaborative Coding)

---

## 1. Project Overview

CodeCollab is a sophisticated, web-based collaborative development environment designed to replicate the experience of desktop IDEs like VS Code but in a browser. It focuses on real-time peer-to-peer collaboration, integrated AI assistance, and seamless project management.

### Core Philosophy
-   **Collaborative First:** Built from the ground up for multiple users to edit code simultaneously with zero conflict (using CRDTs).
-   **AI Native:** AI tools are not an afterthought; they are integrated into the editor for autocomplete, refactoring, and debugging.
-   **Modern Stack:** Utilizes the latest web technologies for high performance and scalability.

---

## 2. Technology Stack

### Frontend (Client)
-   **Framework:** [React v18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/) (Fast HMR and bundling)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [Shadcn UI](https://ui.shadcn.com/) components
-   **Editor Engine:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) (The same editor that powers VS Code)
-   **State Management:** React Context API + Local State
-   **Real-time Collaboration:**
    -   [Yjs](https://yjs.dev/) (CRDT implementation for shared state)
    -   [y-webrtc](https://github.com/yjs/y-webrtc) (Peer-to-peer data syncing)
    -   [Socket.io-client](https://socket.io/) (Signaling and server communication)
-   **Terminal:** [xterm.js](https://xtermjs.org/) (Web-based terminal emulator)
-   **Routing:** [React Router v6](https://reactrouter.com/)

### Backend (Server)
-   **Runtime:** [Node.js](https://nodejs.org/)
-   **Framework:** [Express.js](https://expressjs.com/)
-   **Database:** [MongoDB](https://www.mongodb.com/) (Data persistence for users and projects)
-   **Authentication:** JWT (JSON Web Tokens)
-   **Real-time Server:** [Socket.io](https://socket.io/) (Handling rooms and events)
-   **AI Integration:** [OpenAI API](https://openai.com/) (Proxied via backend for security)
-   **Version Control:** [simple-git](https://github.com/steveukx/git-js) (For GitHub imports)

---

## 3. Detailed Feature Walkthrough

### 3.1 Landing Page (`/`)
The entry point to the application, designed to showcase features and convert visitors.

*   **Header:**
    *   **Logo:** Branding with "CodeCollab".
    *   **AI Compiler Button:** Quick access to the standalone scratchpad compiler (`/compiler`).
    *   **Get Started Button:** Direct navigation to the authentication page.
*   **Hero Section:**
    *   **Headline:** "Code Together, Build Faster".
    *   **Actions:** "Start Coding Now" (Go to Auth) and "Learn More" (Opens a modal with Developer Profile & User Guide).
*   **Feature Highlights:**
    *   **Real-time Collaboration:** Emphasizes simultaneous editing.
    *   **AI-Powered Tools:** Highlights code explanation and fixing capabilities.
    *   **Secure & Private:** Assures users of data encryption and permission control.

### 3.2 Authentication Page (`/auth`)
A unified interface for user entry.

*   **Dual Mode:** Single card component that toggles between **Sign In** and **Sign Up**.
*   **Sign In:** Requires Email and Password. Verifies credentials against MongoDB and issues a JWT.
*   **Sign Up:** Creates a new user account with Email and Password.
*   **Feedback:** Uses toast notifications to alert users of success (e.g., "Welcome back!") or errors (e.g., "Invalid credentials").

### 3.3 Dashboard (`/dashboard`)
The central hub for managing a user's coding projects.

*   **Header:** Logo and **Sign Out** button.
*   **Project Management Bar:**
    *   **Search:** Real-time filtering of projects by name.
    *   **Filter:** View "All Projects", "Owned by Me", or "Shared with Me".
    *   **Sort:** Order by "Last Updated" or "Name (A-Z)".
    *   **View Toggle:** Switch between **Grid View** (visual cards) and **List View** (compact rows).
*   **Action Buttons:**
    1.  **New Project:** Opens a dialog to enter a project name and create a blank project.
    2.  **Import from GitHub:** Dialog to paste a public repository URL for cloning.
    3.  **Import Local:** Opens the system file picker to upload a local directory directly into a new project.
*   **Project Cards:**
    *   Display Project Name, Last Updated timestamp, and Language tag.
    *   **Members:** Avatars of the owner and collaborators.
    *   **Actions:**
        *   **Share:** Copies the project URL to clipboard for inviting others.
        *   **Delete:** (Owner only) Permanently removes the project and files.

### 3.4 Project Editor (`/project/:id`)
The core experience—a full-featured IDE in the browser.

*   **Layout:**
    *   **Activity Bar (Left):** Navigation icons for Explorer, Search, Source Control (placeholder), Chat, Collaborators, and Activity Log.
    *   **Sidebar (Left Panel):** Context-sensitive content based on the Activity Bar selection (e.g., File Tree, Chat Window).
    *   **Editor Area (Center):** The main Monaco editor instance.
    *   **Terminal (Bottom):** Collapsible panel for command output and execution.

*   **Key Features:**
    *   **File Explorer:** Create files/folders, upload files, download individual files, or export the entire project as a ZIP.
    *   **Editor Tabs:** Manage multiple open files simultaneously.
    *   **Real-time Collaboration:**
        *   **Cursors:** See exactly where other users are typing (labeled with their name).
        *   **Edits:** Changes appear instantly for all connected users using Yjs.
    *   **Communication:**
        *   **Text Chat:** Dedicated sidebar for persistent team messaging.
        *   **Video/Audio Call:** Integrated WebRTC calling for face-to-face collaboration.
    *   **AI Assistant:**
        *   **Inline Autocomplete:** Suggests code as you type.
        *   **AI Panel:** Sidebar tool to "Explain Code", "Fix Bugs", or "Generate Code" based on prompts.
    *   **Code Execution:**
        *   **Run Code (Play Icon):** Executes the current file.
            *   *JavaScript/TypeScript:* Runs directly in the browser.
            *   *Python/Java/C/C++:* Sends code to the backend for execution (via `socket.io`).
        *   **Run Project:** Triggers `npm start` logic for Node.js projects in the terminal.

### 3.5 AI Compiler (`/compiler`)
A standalone, lightweight playground for quick code testing without creating a full project.

*   **Language Support:** Python, JavaScript, TypeScript, Java, C++, C, Go, Rust, Ruby, PHP.
*   **Interface:**
    *   **Language Selector:** Sidebar with icons for each supported language.
    *   **Editor:** Split-screen view with Code input on the left and Output on the right.
    *   **AI Integration:** Dedicated panel to help debug or explain the code in the scratchpad.
*   **Execution:** Sends code to the backend execution engine and streams results back to the output pane.

---

## 4. Workflows

### Creating a Project
1.  User logs in and lands on the Dashboard.
2.  Clicks "New Project", names it "My App", and confirms.
3.  System creates a project ID in MongoDB and redirects to `/project/:id`.

### Collaborating
1.  User A opens a project.
2.  User A clicks the "Share" icon on the dashboard or copies the URL.
3.  User B pastes the URL into their browser.
4.  User B is authenticated and joins the session.
5.  A and B see each other's avatars in the "Online Users" list and can edit files together.

### AI Assistance
1.  User encounters a bug in `script.js`.
2.  User highlights the buggy code.
3.  User clicks the "AI Assistant" (Sparkles icon) and selects "Fix Bug".
4.  AI analyzes the code, proposes a fix, and the user clicks "Apply" to insert it into the editor.

---

## 5. Security Measures

*   **Authentication:** All sensitive routes are protected via JWT verification middleware.
*   **Sandboxing:** (Planned/Partial) Backend code execution is isolated to prevent server compromise.
*   **Environment Variables:** API keys (like OpenAI) are stored on the server (`.env`) and never exposed to the client.
