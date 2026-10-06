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

### Database, Storage, and Authentication (Neon Ecosystem)
The entire backend infrastructure leverages **Neon**:
*   **Neon Postgres:** Manages the relational data.
*   **Neon Auth:** Handles secure user login and authentication.
*   **Neon Object Storage:** Stores and serves user-uploaded images and assets.

### Artificial Intelligence
*   **Google Gemini:** The AI engine driving all generative features on the whiteboard (sticky notes, flowcharts, data-to-chart conversions).