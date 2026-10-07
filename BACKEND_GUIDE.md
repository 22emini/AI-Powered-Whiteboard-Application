# Backend Guide — what each new file does and why

Use this to understand (and retype) the backend pieces added after auth/boards. Read in this order; each section builds on the one before.

## 0. The big picture

```
Browser ──REST (fetch)──► Express routes ──► controllers ──► Prisma ──► Postgres
   ▲                                              │
   └────────── Socket.IO (live updates) ◄─────────┘  emitToBoard(...)
```

Rule of thumb: **REST changes data, Socket.IO announces the change.**
The browser never sends element edits over the socket. It calls REST, the controller saves, then calls `emitToBoard`, and every other browser in that board's "room" gets the event.

---

## 1. `utils/boardAccess.js` — one place that answers "who can do what?"

```js
getBoardRole(boardId, userId)  // "owner" | "editor" | "viewer" | null
canView(role)                  // role !== null
canEdit(role)                  // owner or editor
```

**How it works:** load the board; if `board.ownerId === userId` → `owner`. Otherwise look for a `BoardMember` row (composite key `boardId_userId`) and return its `role`. No row → `null`.

**Why:** every controller (elements, members, AI, upload, sockets) needs the same permission check. Writing it once avoids copy-paste bugs.

**Key idea:** a `null` role returns **404 "Board not found"** (not 403) so outsiders can't even learn that a board id exists. A `viewer` trying to edit gets **403**.

---

## 2. `src/config/socket.js` — real-time layer

Exports two functions:

- `initSocket(httpServer)` – creates the Socket.IO `Server`, attaches auth + event handlers.
- `emitToBoard(boardId, event, payload)` – used by REST controllers to broadcast.

**Concepts**

| Concept | In the code |
|---|---|
| Auth for sockets | `io.use(...)` middleware reads `socket.handshake.auth.token`, runs `jwt.verify`, stores `socket.userId`. Bad/no token → connection refused. |
| Rooms | `socket.join("board:<id>")`. A room = everyone currently looking at one board. |
| Join check | `board:join` calls `getBoardRole`; no access → ack `{ok:false}`; else join and ack `{ok:true, role}`. The frontend uses `role` to decide read-only vs edit. |
| Presence | `user:joined` / `user:left` are sent to the *other* people in the room (`socket.to(room)` excludes the sender). `disconnecting` fires `user:left` for every board room. |
| Live cursors | `cursor:move` is relayed to others and **never saved**. Ignored unless the sender has joined that room (privacy). |
| `emitToBoard` | `io.to(room).emit(...)` — **everyone** in the room incl. the person who made the change. The `if (!io) return` guard makes it safe if sockets aren't running. |

**Why `http.createServer(app)` in `server.js`:** Socket.IO attaches to the raw HTTP server, not the Express `app`.

---

## 3. `controller/element.js` (rewritten) — elements with permissions + broadcast

Pattern in every handler:

1. `getBoardRole(...)` → `404` if null.
2. For writes: `canEdit(role)` → `403` if viewer.
3. Prisma create / update / delete.
4. `emitToBoard(boardId, "element:created" | "element:updated" | "element:deleted", ...)`.
5. Respond.

Notes:
- Update/delete only get an **element id**, so first `findUnique` the element to learn its `boardId`, then check the role on *that* board.
- `PATCH` `data` **replaces** the whole JSON `data` object, so clients must send the merged object (the frontend does this in `saveData`).
- Delete responds `204` and emits `{ id }`.

## 4. `controller/board.js` (changed) — shared boards appear in lists

`GetAllBoards` now uses `where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] }` so boards shared with you show up. `GetById` uses `getBoardRole` too. **Rename and delete stay owner-only.**

---

## 5. `controller/member.js` + `routes/memberRoute.js` — sharing

| Endpoint | Who | What |
|---|---|---|
| `POST /api/boards/:boardId/members` `{email, role}` | owner | find user by email → `boardMember.upsert` (add or change role) |
| `GET  /api/boards/:boardId/members` | any member | `findMany` + `include: { user: { select: {id,email,name} } }` (never leaks `passwordHash`) |
| `DELETE /api/boards/:boardId/members/:userId` | owner | `deleteMany`; `count === 0` → 404 |

**Why `upsert`:** sharing with the same person twice just updates their role instead of failing on the composite primary key.

The router file only maps URL + `requireAuth` → controller function.

---

## 6. AI: `service/gemini.js`, `controller/ai.js`, `routes/aiRoute.js`

**`service/gemini.js`** — talks to Google Gemini.
- `PROMPTS` has one prompt template per mode (`sticky_notes`, `flowchart`, `chart`). Each tells the model to return **only JSON in an exact shape**.
- `askGemini(mode, prompt)`: no `GEMINI_API_KEY` → throws error with `status = 503`. Otherwise calls `generateContent` with `responseMimeType: "application/json"`, strips accidental ```` ``` ```` fences, `JSON.parse`; parse failure → `status = 502`.

**`controller/ai.js`** — `POST /api/boards/:boardId/ai/generate` `{mode, prompt, x?, y?}`
1. Validate `mode` and `prompt` (400).
2. Role check (editor+).
3. `askGemini`.
4. **Convert AI JSON into real elements** (the AI doesn't know our schema):
   - `notesToElements` → grid of `sticky` elements.
   - `chartToElements` → one `chart` element.
   - flowchart → `shape` nodes laid out in columns, then `arrow` elements whose `data` holds `fromElementId` / `toElementId` (needs node rows saved first to get real ids, hence the transaction).
5. Save with `prisma.$transaction([...])` (all or nothing).
6. `emitToBoard(boardId, "elements:created", created)` and respond `201`.

Error mapping: 503 = no key, 502 = bad AI output, 500 = anything else (e.g. invalid key / quota — look at the backend console).

---

## 7. Uploads: `service/storage.js`, `controller/upload.js`, `routes/uploadRoute.js`

**`service/storage.js`** — multer config.
- `diskStorage` saves into `backend/uploads` with a **random UUID filename** (never trust the user's filename).
- `limits.fileSize` 5 MB, `fileFilter` allows png/jpeg/gif/webp only.
- `fileUrl(req, filename)` builds the public URL. Everything storage-related is here, so moving to S3/Neon Object Storage later means editing only this file.

**`routes/uploadRoute.js`** — wraps `upload.single("image")` in a small function so multer errors (too big, wrong type) become clean `400 {message}` instead of crashing.

**`controller/upload.js`** — checks role, creates an `image` element with `data: {url, originalName, mimeType, size}`, emits `element:created`. If the role check fails it **deletes the already-saved file** (`fs.unlink`) so no orphans pile up.

`server.js` serves the folder with `app.use("/uploads", express.static(UPLOAD_DIR))`.

---

## 8. `server.js` wiring (order matters)

```
express.json() → cors() → /uploads static → /health, /
→ /api/boards, /api/auth, /api (elements, members, ai, uploads)
→ 404 JSON handler   (after all routes)
→ error handler      (4 args: err, req, res, next — must be last)
→ http.createServer(app) → initSocket(server) → server.listen
```

The 404 handler must come **after** routes; the error handler **last**.

---

## 9. Postman

`backend/postman/ai-whiteboard.postman_collection.json` + `local.postman_environment.json`. Import both, select the *Local* environment, run **Auth → Login**; its test script stores the token in the environment and later requests send it automatically.

---

## 10. How the frontend uses all this

| Frontend | Backend |
|---|---|
| `lib/api.ts` | every REST endpoint above, with `Authorization: Bearer <token>` |
| `lib/socket.ts` + `BoardEditor` | `board:join` ack → role; `element:*`, `elements:created`, `cursor:move`, `user:*` |
| `ShareModal` | member endpoints |
| `AIPanel` | `/ai/generate` |
| image tool | `/uploads` (+ `GET /uploads/<file>` to display) |
