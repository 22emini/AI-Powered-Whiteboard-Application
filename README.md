# AI-Powered Whiteboard Application

A full-stack, real-time whiteboard with an infinite canvas for team collaboration. Users can sketch, add sticky notes and shapes, and generate content on the board with natural-language prompts powered by Google Gemini.

> **Status:** In development. The backend is being built step by step.

## Features (planned)

- **Infinite canvas** with freehand drawing, text, sticky notes, shapes, arrows, images and emojis
- **Live data charts** on the canvas
- **Real-time collaboration** with multiplayer drawing and live cursors
- **AI generation (Gemini):** sticky-note brainstorming, flowchart diagrams, data-to-chart visualization

## Tech Stack

| Layer         | Technology                          |
| ------------- | ----------------------------------- |
| Frontend      | React                               |
| Backend       | Node.js, Express                    |
| Real-time     | Socket.IO                           |
| Database      | Neon Postgres, accessed via Prisma  |
| Auth          | Neon Auth                           |
| File storage  | Neon Object Storage                 |
| AI            | Google Gemini (`@google/genai`)     |

## Project Structure

```
AI-Powered-Whiteboard-Application/
├── backend/            # Express API + Socket.IO server
│   ├── server.js
│   ├── .env            # local secrets (never committed)
│   └── package.json
├── frontend/           # React app (to be added)
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) project (Postgres connection string)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com)

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
DATABASE_URL='postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require'
GEMINI_API_KEY=your_key_here
```

Run the dev server:

```bash
npm run dev
```

Check that it works:

- `GET http://localhost:3000/` returns the welcome page
- `GET http://localhost:3000/health` returns a JSON status message

### Scripts

| Command       | Description                              |
| ------------- | ---------------------------------------- |
| `npm run dev` | Start the server with nodemon (reload)   |
| `npm start`   | Start the server with Node               |

## Roadmap

- [x] Express server with health check
- [ ] Neon connection and Prisma schema (users, boards, elements)
- [ ] Board CRUD API
- [ ] Authentication (Neon Auth)
- [ ] Real-time sync with Socket.IO
- [ ] Gemini AI generation endpoints
- [ ] Image uploads (Neon Object Storage)
- [ ] React frontend

## Security

Never commit `.env` files or credentials. If a secret is exposed, rotate it immediately.

## License

ISC
