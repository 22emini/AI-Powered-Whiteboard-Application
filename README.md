# AI-Powered Whiteboard Application

A full-stack, real-time whiteboard with an infinite canvas for team collaboration. Users can sketch, add sticky notes and shapes, and generate content on the board with natural-language prompts powered by Google Gemini.

> **Status:** In development. The backend foundation (server, database, board CRUD) is working. Auth, real-time sync and AI are next.

## Features (planned)

- **Infinite canvas** with freehand drawing, text, sticky notes, shapes, arrows, images and emojis
- **Live data charts** on the canvas
- **Real-time collaboration** with multiplayer drawing and live cursors
- **AI generation (Gemini):** sticky-note brainstorming, flowchart diagrams, data-to-chart visualization

## Tech Stack

| Layer         | Technology                                           |
| ------------- | ---------------------------------------------------- |
| Frontend      | React (to be added)                                  |
| Backend       | Node.js, Express 5 (ES modules)                      |
| Real-time     | Socket.IO (planned)                                  |
| Database      | Neon Postgres, accessed through Prisma 7 + `pg`      |
| Auth          | To be implemented                                    |
| File storage  | Neon Object Storage (planned)                        |
| AI            | Google Gemini (`@google/genai`) (planned)            |
| Dev runner    | `tsx` (runs the Prisma 7 generated client in Node)   |

## Project Structure

```
AI-Powered-Whiteboard-Application/
├── backend/
│   ├── server.js               # app entry: middleware, routes, listen
│   ├── routes/
│   │   └── boardRoutes.js      # maps URLs to controller functions
│   ├── controller/
│   │   └── board.js            # board CRUD logic
│   ├── src/config/
│   │   └── db.js               # Prisma client (pg adapter)
│   ├── prisma/
│   │   ├── schema.prisma       # data models
│   │   ├── migrations/         # generated SQL migrations
│   │   └── seed.js             # test data
│   ├── prisma7.config.ts       # Prisma CLI config (reads DATABASE_URL)
│   ├── generated/prisma/       # generated client (gitignored)
│   └── .env                    # local secrets (gitignored)
├── frontend/                   # React app (to be added)
└── README.md
```

## Data Model

- **User**: id, email, name
- **Board**: id, title, owner (User), elements, members
- **Element**: id, board, `type` (sticky, shape, text, ...), `x`, `y`, `data` (JSON with type-specific properties)
- **BoardMember**: board + user + role (`viewer` / `editor`)

Deleting a board also deletes its elements and memberships (cascade).

## Getting Started

### Prerequisites

- Node.js 22+
- A [Neon](https://neon.tech) project (Postgres connection string)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com) (needed later)

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
DATABASE_URL='postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require'
TEMP_USER_ID=test-user-1
GEMINI_API_KEY=your_key_here
```

`TEMP_USER_ID` is a stand-in owner for new boards until real authentication exists.

Set up the database:

```bash
npx prisma migrate dev --name init   # create the tables
npx prisma generate                  # generate the client (Prisma 7 does not do this automatically)
npx tsx prisma/seed.js               # optional: test user, boards and elements
```

Re-run `npx prisma generate` whenever `schema.prisma` changes.

Start the dev server:

```bash
npm run dev
```

### Scripts

| Command       | Description                                 |
| ------------- | ------------------------------------------- |
| `npm run dev` | Start the server with `tsx watch` (reloads) |
| `npm start`   | Start the server with `tsx`                 |

### Useful tools

- `npx prisma studio` opens a browser UI to view and edit table rows.

## API

Base URL: `http://localhost:3000`

| Method   | Path               | Body                  | Description                 |
| -------- | ------------------ | --------------------- | --------------------------- |
| `GET`    | `/`                | -                     | Welcome page                |
| `GET`    | `/health`          | -                     | Health check                |
| `GET`    | `/db-test`         | -                     | Database connection check   |
| `GET`    | `/api/boards`      | -                     | List all boards             |
| `POST`   | `/api/boards`      | `{ "title": "..." }`  | Create a board              |
| `GET`    | `/api/boards/:id`  | -                     | One board with its elements |
| `PATCH`  | `/api/boards/:id`  | `{ "title": "..." }`  | Rename a board              |
| `DELETE` | `/api/boards/:id`  | -                     | Delete a board              |

Errors: `400` for missing input, `404` for an unknown board, `500` for server errors.

When testing in Postman, set the body type to **raw → JSON**.

## Roadmap

- [x] Express server with health check
- [x] Neon connection and Prisma schema (users, boards, elements, members)
- [x] Board CRUD API
- [ ] Authentication (replace `TEMP_USER_ID` with the logged-in user)
- [ ] Element endpoints (add, move, delete elements on a board)
- [ ] Real-time sync with Socket.IO
- [ ] Gemini AI generation endpoints
- [ ] Image uploads (Neon Object Storage)
- [ ] React frontend

## Security

Never commit `.env` files or credentials. If a secret is exposed, rotate it immediately.

## License

ISC
