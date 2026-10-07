# AI-Powered Whiteboard Application

A full-stack, real-time whiteboard with an infinite canvas for team collaboration. Users can sketch, add sticky notes and shapes, and generate content on the board with natural-language prompts powered by Google Gemini.

> **Status:** The backend is feature-complete (auth, boards, elements, sharing, real-time, AI, uploads). The React frontend is in progress.

## Features

- **Boards and elements:** sticky notes, shapes, text, arrows, images and charts stored as JSON elements
- **Authentication:** email + password signup/login with bcrypt and JWT
- **Sharing:** invite other users to a board as `viewer` or `editor`
- **Real-time collaboration:** Socket.IO rooms per board, live element updates and live cursors
- **AI generation (Gemini):** sticky-note brainstorming, flowcharts, and data-to-chart
- **Video calls:** one-click video call inside every board room (embedded Jitsi Meet, one room per board, no API keys needed). Click **Call** in the board's top bar; everyone who opens the same board joins the same call
- **Image uploads** onto the canvas

## Tech Stack

| Layer         | Technology                                           |
| ------------- | ---------------------------------------------------- |
| Frontend      | React / Next.js (in `frontend/`)                     |
| Backend       | Node.js, Express 5 (ES modules)                      |
| Real-time     | Socket.IO                                            |
| Database      | Neon Postgres, accessed through Prisma 7 + `pg`      |
| Auth          | bcrypt + JSON Web Tokens                             |
| File storage  | Local disk (`backend/uploads`), behind `service/storage.js` so it can be swapped for Neon/S3 storage |
| AI            | Google Gemini (`@google/genai`)                      |
| Video calls   | Jitsi Meet embed (`meet.jit.si` iframe)              |
| Dev runner    | `tsx` (runs the Prisma 7 generated client in Node)   |

## Project Structure

```
AI-Powered-Whiteboard-Application/
├── backend/
│   ├── server.js               # app entry: middleware, routes, Socket.IO, listen
│   ├── routes/                 # URL -> controller mapping
│   ├── controller/             # request handling (board, element, User, member, ai, upload)
│   ├── middleware/auth.js      # JWT check, sets req.userId
│   ├── service/                # gemini.js (AI), storage.js (uploads)
│   ├── utils/boardAccess.js    # owner / editor / viewer permission helper
│   ├── src/config/             # db.js (Prisma client), socket.js (Socket.IO)
│   ├── prisma/                 # schema.prisma, migrations/
│   ├── postman/                # importable Postman collection + environment
│   ├── prisma7.config.ts       # Prisma CLI config (reads DATABASE_URL)
│   ├── generated/prisma/       # generated client (gitignored)
│   ├── uploads/                # uploaded images (gitignored)
│   └── .env                    # local secrets (gitignored)
├── frontend/                   # UI
└── README.md
```

## Data Model

- **User**: id, email, passwordHash, name, age, phone, job
- **Board**: id, title, owner (User), elements, members
- **Element**: id, board, `type` (sticky, shape, text, arrow, image, chart), `x`, `y`, `data` (JSON with type-specific properties)
- **BoardMember**: board + user + role (`viewer` / `editor`)

Deleting a board also deletes its elements and memberships (cascade).

### Permissions

| Action                         | Owner | Editor | Viewer |
| ------------------------------ | :---: | :----: | :----: |
| View board and elements        |  yes  |  yes   |  yes   |
| Add / edit / delete elements   |  yes  |  yes   |   no   |
| AI generation, image upload    |  yes  |  yes   |   no   |
| Rename / delete board          |  yes  |   no   |   no   |
| Add / remove members           |  yes  |   no   |   no   |

Users with no access get `404` (the board's existence is not revealed).

## Getting Started

### Prerequisites

- Node.js 22+
- A [Neon](https://neon.tech) project (Postgres connection string)
- A Google Gemini API key from [Google AI Studio](https://aistudio.google.com) (for AI features)

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL='postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require'
JWT_SECRET=a_long_random_string
GEMINI_API_KEY=your_key_here
# optional
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:3000
```

Generate a secret with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Set up the database:

```bash
npx prisma migrate dev --name init   # create / update tables
npx prisma generate                  # Prisma 7 does not do this automatically
```

Run `npx prisma generate` after every schema change.

Start the dev server (always from `backend/`):

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
- Import `backend/postman/ai-whiteboard.postman_collection.json` into Postman (see below).

## API

Base URL: `http://localhost:5000`. All `/api` routes except `/api/auth/*` need the header `Authorization: Bearer <token>`.

### Auth
| Method | Path                | Body                                                        |
| ------ | ------------------- | ----------------------------------------------------------- |
| `POST` | `/api/auth/signup`  | `{ email, password (8+), name?, age?, phone?, job? }`       |
| `POST` | `/api/auth/login`   | `{ email, password }`                                       |

### Boards
| Method   | Path               | Body                | Notes                          |
| -------- | ------------------ | ------------------- | ------------------------------ |
| `GET`    | `/api/boards`      | -                   | boards you own or are shared on |
| `POST`   | `/api/boards`      | `{ title }`         |                                |
| `GET`    | `/api/boards/:id`  | -                   | includes elements              |
| `PATCH`  | `/api/boards/:id`  | `{ title }`         | owner only                     |
| `DELETE` | `/api/boards/:id`  | -                   | owner only                     |

### Elements
| Method   | Path                              | Body                                 |
| -------- | --------------------------------- | ------------------------------------ |
| `POST`   | `/api/boards/:boardId/elements`   | `{ type, x, y, data }`               |
| `GET`    | `/api/boards/:boardId/elements`   | -                                    |
| `PATCH`  | `/api/elements/:id`               | `{ x?, y?, data? }`                  |
| `DELETE` | `/api/elements/:id`               | -                                    |

### Sharing (owner only, except listing)
| Method   | Path                                   | Body                              |
| -------- | -------------------------------------- | --------------------------------- |
| `POST`   | `/api/boards/:boardId/members`         | `{ email, role: viewer\|editor }` |
| `GET`    | `/api/boards/:boardId/members`         | -                                 |
| `DELETE` | `/api/boards/:boardId/members/:userId` | -                                 |

### AI
| Method | Path                                | Body                                             |
| ------ | ----------------------------------- | ------------------------------------------------ |
| `POST` | `/api/boards/:boardId/ai/generate`  | `{ mode: sticky_notes\|flowchart\|chart, prompt, x?, y? }` |

Generated elements are saved to the board and broadcast over Socket.IO. Returns `503` if `GEMINI_API_KEY` is not set.

### Uploads
| Method | Path                              | Body                                              |
| ------ | --------------------------------- | ------------------------------------------------- |
| `POST` | `/api/boards/:boardId/uploads`    | `multipart/form-data`: `image` (file, 5 MB max), `x?`, `y?` |

Creates an `image` element. Files are served from `/uploads/<name>`.

### Health
`GET /`, `GET /health`, `GET /db-test`

Errors: `400` bad input, `401` not logged in, `403` view-only, `404` not found / no access, `409` duplicate, `502/503` AI problems, `500` server error.

## Real-time (Socket.IO)

Connect to the same host and port, passing the JWT:

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:5000", { auth: { token } });

socket.emit("board:join", boardId, (res) => console.log(res)); // { ok, role }

socket.on("element:created", (element) => {});
socket.on("element:updated", (element) => {});
socket.on("element:deleted", ({ id }) => {});
socket.on("elements:created", (elements) => {}); // AI generation
socket.on("user:joined", ({ userId }) => {});
socket.on("user:left", ({ userId }) => {});

socket.emit("cursor:move", { boardId, x, y });     // send your cursor
socket.on("cursor:move", ({ userId, x, y }) => {}); // others' cursors
```

Element changes are made through the REST API; the server then broadcasts them to everyone in the board's room. Cursor positions are relayed live and never saved. Users without access to a board cannot join its room.

## Postman

Import `backend/postman/ai-whiteboard.postman_collection.json` (and optionally `local.postman_environment.json`).

1. Check the `baseUrl` variable matches your `PORT`.
2. Run **01 Auth > Signup**. The token is saved automatically.
3. Run **02 Boards > Create board**. `boardId` is saved automatically.
4. Run the other folders. For **04 Sharing**, first run **Auth > Signup - second user**.

The collection also includes negative tests (401, 403, 404, 400) that assert the expected status codes.

## Roadmap

- [x] Express server with health check
- [x] Neon connection and Prisma schema
- [x] Board CRUD API
- [x] Authentication (signup, login, JWT middleware)
- [x] Element endpoints
- [x] Board sharing with roles
- [x] Real-time sync with Socket.IO
- [x] Gemini AI generation endpoints
- [x] Image uploads (local disk)
- [ ] Move uploads to Neon Object Storage / S3
- [ ] React frontend (canvas, tools, AI panel)
- [ ] Rate limiting, refresh tokens, password reset

## Security

Never commit `.env` files or credentials. If a secret is exposed, rotate it immediately. Uploaded image URLs are public (random, unguessable names); do not upload sensitive images.

## License

ISC

## Frontend (Next.js)

```bash
cd frontend
npm install
# .env.local -> NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev   # http://localhost:3000 (backend runs on 5000)
```

Pages: `/` landing, `/signin`, `/signup`, `/dashboard`, `/board/[id]` editor.

Editor shortcuts: V select, H pan, S sticky, T text, R/O/D shapes, A arrow, L line, P pen, Del delete, Ctrl+D duplicate, Ctrl+wheel zoom, Space+drag pan. Also: emoji, image upload, charts, AI panel, share, PNG/SVG export and live cursors.

See BACKEND_GUIDE.md for how the backend pieces work.
