import http from 'http';
import { io } from '../frontend/node_modules/socket.io-client/build/esm/index.js';
import { prisma } from './src/config/db.js';

const TEST_PORT = 5055;
process.env.PORT = String(TEST_PORT);

console.log("=========================================");
console.log("🚀 STARTING COMPREHENSIVE BACKEND TEST SUITE");
console.log("=========================================\n");

const BASE_URL = `http://localhost:${TEST_PORT}`;
let serverProcess;

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function run() {
    let passed = 0;
    let failed = 0;

    function assert(desc, condition, details = "") {
        if (condition) {
            console.log(`  ✅ PASS: ${desc}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${desc} ${details ? "- " + details : ""}`);
            failed++;
        }
    }

    // 1. Start Server
    console.log("1. Starting backend server on port " + TEST_PORT + "...");
    const { default: express } = await import('express');
    // Dynamically import server.js to boot on TEST_PORT
    await import('./server.js');
    await sleep(1500);

    const testEmailOwner = `test_owner_${Date.now()}@example.com`;
    const testEmailEditor = `test_editor_${Date.now()}@example.com`;
    const testPassword = "Password123!";

    let ownerToken = "";
    let ownerId = "";
    let editorToken = "";
    let editorId = "";
    let boardId = "";
    let elementId = "";

    try {
        // 2. Health & Root Tests
        console.log("\n2. Testing Base Endpoints...");
        const rootRes = await fetch(`${BASE_URL}/`);
        assert("GET / returns 200", rootRes.status === 200);

        const healthRes = await fetch(`${BASE_URL}/health`);
        const healthJson = await healthRes.json();
        assert("GET /health returns 200 with message", healthRes.status === 200 && healthJson.message);

        const dbRes = await fetch(`${BASE_URL}/db-test`);
        const dbJson = await dbRes.json();
        assert("GET /db-test connects to database", dbRes.status === 200 && Array.isArray(dbJson));

        // 3. Auth Tests
        console.log("\n3. Testing Auth Endpoints...");
        const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmailOwner,
                password: testPassword,
                name: "Test Owner",
                job: "Engineer",
                age: "28"
            })
        });
        const signupJson = await signupRes.json();
        assert("POST /api/auth/signup creates user and returns JWT token", signupRes.status === 201 && signupJson.token);
        ownerToken = signupJson.token;
        ownerId = signupJson.user?.id;

        // Duplicate signup test
        const dupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmailOwner,
                password: testPassword
            })
        });
        assert("POST /api/auth/signup rejects duplicate email with 409", dupRes.status === 409);

        // Login test
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmailOwner,
                password: testPassword
            })
        });
        const loginJson = await loginRes.json();
        assert("POST /api/auth/login succeeds with valid credentials", loginRes.status === 200 && loginJson.token);

        // Invalid password test
        const invalidLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmailOwner,
                password: "WrongPassword!"
            })
        });
        assert("POST /api/auth/login rejects wrong password with 401", invalidLoginRes.status === 401);

        // Signup second user (Editor)
        const signupEdRes = await fetch(`${BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmailEditor,
                password: testPassword,
                name: "Test Editor"
            })
        });
        const signupEdJson = await signupEdRes.json();
        editorToken = signupEdJson.token;
        editorId = signupEdJson.user?.id;
        assert("POST /api/auth/signup creates second user", signupEdRes.status === 201 && editorToken);

        // 4. Board CRUD Tests
        console.log("\n4. Testing Board CRUD Endpoints...");
        // Unauthenticated access
        const noAuthRes = await fetch(`${BASE_URL}/api/boards`);
        assert("GET /api/boards rejects missing token with 401", noAuthRes.status === 401);

        // Create board
        const createBoardRes = await fetch(`${BASE_URL}/api/boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({ title: "Automated Test Board" })
        });
        const createBoardJson = await createBoardRes.json();
        boardId = createBoardJson.result?.id;
        assert("POST /api/boards creates board", createBoardRes.status === 201 && boardId);

        // Get board
        const getBoardRes = await fetch(`${BASE_URL}/api/boards/${boardId}`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        const getBoardJson = await getBoardRes.json();
        assert("GET /api/boards/:id returns board details", getBoardRes.status === 200 && getBoardJson.title === "Automated Test Board");

        // Rename board
        const renameRes = await fetch(`${BASE_URL}/api/boards/${boardId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({ title: "Renamed Test Board" })
        });
        assert("PATCH /api/boards/:id updates title", renameRes.status === 200);

        // 5. Element CRUD Tests
        console.log("\n5. Testing Canvas Element CRUD Endpoints...");
        const createElRes = await fetch(`${BASE_URL}/api/boards/${boardId}/elements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                type: "sticky",
                x: 100,
                y: 150,
                data: { text: "Hello Sticky Note", color: "yellow" }
            })
        });
        const createElJson = await createElRes.json();
        elementId = createElJson.result?.id;
        assert("POST /api/boards/:id/elements creates sticky element", createElRes.status === 201 && elementId);

        // Update element
        const updateElRes = await fetch(`${BASE_URL}/api/elements/${elementId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                x: 200,
                y: 250,
                data: { text: "Updated Sticky Note", color: "blue" }
            })
        });
        assert("PATCH /api/elements/:id updates position & data", updateElRes.status === 200);

        // List elements
        const listElRes = await fetch(`${BASE_URL}/api/boards/${boardId}/elements`, {
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        const listElJson = await listElRes.json();
        assert("GET /api/boards/:id/elements returns elements list", listElRes.status === 200 && listElJson.result?.length >= 1);

        // 6. Board Member & Sharing Tests
        console.log("\n6. Testing Sharing and Permissions...");
        const addMemberRes = await fetch(`${BASE_URL}/api/boards/${boardId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                email: testEmailEditor,
                role: "editor"
            })
        });
        assert("POST /api/boards/:id/members adds member", addMemberRes.status === 201 || addMemberRes.status === 200);

        // Editor can access board
        const editorBoardRes = await fetch(`${BASE_URL}/api/boards/${boardId}`, {
            headers: { 'Authorization': `Bearer ${editorToken}` }
        });
        assert("GET /api/boards/:id allowed for invited editor", editorBoardRes.status === 200);

        // 7. Real-Time Socket.IO Tests
        console.log("\n7. Testing Real-Time WebSockets (Socket.IO)...");
        const socketPromise = new Promise((resolve, reject) => {
            const socket = io(BASE_URL, {
                auth: { token: ownerToken },
                transports: ["websocket", "polling"]
            });

            const timeout = setTimeout(() => {
                socket.disconnect();
                reject(new Error("Socket test timed out"));
            }, 5000);

            socket.on("connect", () => {
                socket.emit("board:join", boardId, (ack) => {
                    assert("Socket.IO join board acknowledged with role", ack && ack.ok && ack.role === "owner");

                    // Test cursor movement event
                    socket.emit("cursor:move", { boardId, x: 340, y: 520 });

                    clearTimeout(timeout);
                    socket.disconnect();
                    resolve();
                });
            });

            socket.on("connect_error", (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });

        await socketPromise;
        assert("Socket.IO client connected and disconnected cleanly", true);

        // 8. Image Upload Test
        console.log("\n8. Testing File Upload Endpoint...");
        const formData = new FormData();
        const fakeBlob = new Blob(["fake png image content"], { type: "image/png" });
        formData.append("image", fakeBlob, "test-sketch.png");
        formData.append("x", "120");
        formData.append("y", "180");

        const uploadRes = await fetch(`${BASE_URL}/api/boards/${boardId}/uploads`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ownerToken}`
            },
            body: formData
        });
        const uploadJson = await uploadRes.json();
        assert("POST /api/boards/:id/uploads uploads image element", uploadRes.status === 201 && uploadJson.result?.data?.url);

        // 9. AI Generation Endpoint Test
        console.log("\n9. Testing AI Generation Endpoint...");
        const aiRes = await fetch(`${BASE_URL}/api/boards/${boardId}/ai/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ownerToken}`
            },
            body: JSON.stringify({
                mode: "sticky_notes",
                prompt: "Top 3 product design rules",
                x: 0,
                y: 0
            })
        });
        // Returns 201 Created when elements are generated, or 503 if GEMINI_API_KEY missing
        assert(
            "POST /api/boards/:id/ai/generate responds with valid status (201 Created or 503 API key notice)",
            aiRes.status === 201 || aiRes.status === 200 || aiRes.status === 503,
            `Status was: ${aiRes.status}`
        );

        // 10. Delete Element & Board
        console.log("\n10. Testing Cleanup & Cascade Delete...");
        const delElRes = await fetch(`${BASE_URL}/api/elements/${elementId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        assert("DELETE /api/elements/:id removes element (204 No Content)", delElRes.status === 204 || delElRes.status === 200);

        const delBoardRes = await fetch(`${BASE_URL}/api/boards/${boardId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${ownerToken}` }
        });
        assert("DELETE /api/boards/:id removes board (204 No Content)", delBoardRes.status === 204 || delBoardRes.status === 200);

    } catch (err) {
        console.error("Test execution encountered an error:", err);
        failed++;
    } finally {
        // Clean up database test users
        console.log("\nCleaning up test database records...");
        try {
            await prisma.user.deleteMany({
                where: { email: { in: [testEmailOwner, testEmailEditor] } }
            });
            console.log("✅ Test database records cleaned up.");
        } catch (cleanupErr) {
            console.warn("Notice: Cleanup error:", cleanupErr.message);
        }

        console.log("\n=========================================");
        console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
        console.log("=========================================\n");
        process.exit(failed > 0 ? 1 : 0);
    }
}

run();
