# Building a Full-Stack AI-Powered Whiteboard Application

## Overview
This project is a full-stack, real-time AI Whiteboard application. It features an infinite canvas designed for team collaboration, allowing users to sketch, take notes, and visualize data. The core differentiator is the deep integration of artificial intelligence, enabling users to generate content, diagrams, and charts directly on the board using natural language prompts.

## Key Features
*   **Infinite Canvas:** A boundless workspace for brainstorming and design.
*   **Rich Toolset:** Includes freehand sketching, text integration, sticky notes, shapes, arrows, images, and emojis.
*   **Live Data Charts:** Ability to drop in and visualize data directly on the canvas.
*   **Real-Time Collaboration:** Multiplayer functionality allows teams to draw together on the same board with live, visible cursors.
*   **Native AI Generation (Powered by Gemini):**
    *   *Brainstorming:* Generate a wall of sticky notes from a single prompt.
    *   *Diagramming:* Automatically draw complete flowcharts.
    *   *Data Visualization:* Turn raw numbers into beautiful charts instantly.

## Tech Stack
The application is built on modern web technologies, specifically utilizing a modified **PERN stack** (PostgreSQL, Express, React, Node.js) enhanced with WebSockets and AI.

### Frontend
*   **React:** The core framework for the user interface.
*   *Note on UI Development:* The frontend UI was not hand-written. Instead, **Claude Code** was utilized to generate the UI page-by-page, wiring it directly to the custom API.

### Backend & Real-Time Layer
*   **Node.js & Express:** Handles the core API routing and server logic.
*   **Socket.IO:** Powers the real-time, low-latency collaboration features (live cursors, real-time drawing sync).
*   **Zod:** Installed for request validation if needed later (current routes use simple manual checks).

### Database, Storage, and Authentication
The backend uses **Neon** for hosting:
*   **Neon Postgres:** Manages the relational data, accessed through **Prisma 7** (with the `pg` driver adapter).
*   **Authentication:** Implemented by the developer (approach to be decided). Until then, boards are owned by a temporary test user (`TEMP_USER_ID`).
*   **Neon Object Storage:** Stores and serves user-uploaded images and assets.

### Data Model
*   **User**, **Board**, **Element** (type, x, y, JSON `data`), and **BoardMember** (role per user per board).

### Development Notes
*   The backend is written by hand as a learning project, with the AI assistant used only for guidance and explanations.
*   Prisma 7 generates TypeScript, so the server runs with `tsx` and `npx prisma generate` must be run manually after schema changes.

### Artificial Intelligence
*   **Google Gemini:** The AI engine driving all generative features on the whiteboard (sticky notes, flowcharts, data-to-chart conversions).