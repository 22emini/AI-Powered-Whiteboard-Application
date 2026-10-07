import { prisma } from "../src/config/db.js";
import { getBoardRole, canView, canEdit } from "../utils/boardAccess.js";
import { emitToBoard } from "../src/config/socket.js";
import { askGemini, AI_MODES } from "../service/gemini.js";

const COLORS = ["yellow", "pink", "green", "blue", "orange"];

// ---- turn the AI's JSON into element rows (not saved yet) ----

const notesToElements = (ai, startX, startY) => {
    if (!Array.isArray(ai.notes) || ai.notes.length === 0) return null;

    return ai.notes.slice(0, 20).map((note, i) => ({
        type: "sticky",
        x: startX + (i % 4) * 220,
        y: startY + Math.floor(i / 4) * 200,
        data: {
            text: String(note.text || "").slice(0, 200),
            color: COLORS.includes(note.color) ? note.color : "yellow",
        },
    }));
};

const chartToElements = (ai, startX, startY) => {
    const okLists =
        Array.isArray(ai.labels) &&
        Array.isArray(ai.values) &&
        ai.labels.length > 0 &&
        ai.labels.length === ai.values.length &&
        ai.values.every((v) => typeof v === "number");
    if (!okLists) return null;

    return [
        {
            type: "chart",
            x: startX,
            y: startY,
            data: {
                chartType: ["bar", "line", "pie"].includes(ai.chartType) ? ai.chartType : "bar",
                title: String(ai.title || "Chart").slice(0, 100),
                labels: ai.labels.slice(0, 12).map(String),
                values: ai.values.slice(0, 12),
            },
        },
    ];
};

// ---- the endpoint ----

// POST /api/boards/:boardId/ai/generate
// body: { mode: "sticky_notes" | "flowchart" | "chart", prompt: "...", x?, y? }
export const GenerateWithAI = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { mode, prompt } = req.body;
        const startX = Number.isFinite(req.body.x) ? req.body.x : 100;
        const startY = Number.isFinite(req.body.y) ? req.body.y : 100;

        if (!AI_MODES.includes(mode)) {
            return res.status(400).json({ message: `mode must be one of: ${AI_MODES.join(", ")}` });
        }
        if (!prompt || typeof prompt !== "string" || prompt.length > 1000) {
            return res.status(400).json({ message: "prompt is required (max 1000 characters)" });
        }

        const role = await getBoardRole(boardId, req.userId);
        if (!canView(role)) {
            return res.status(404).json({ message: "Board not found" });
        }
        if (!canEdit(role)) {
            return res.status(403).json({ message: "You have view-only access" });
        }

        const ai = await askGemini(mode, prompt);

        let created;

        if (mode === "flowchart") {
            if (!Array.isArray(ai.nodes) || ai.nodes.length === 0) {
                return res.status(502).json({ message: "AI returned an unusable flowchart" });
            }

            // nodes first (we need their new ids), then arrows between them
            created = await prisma.$transaction(async (tx) => {
                const idMap = {};
                const rows = [];

                for (const [i, node] of ai.nodes.slice(0, 12).entries()) {
                    const el = await tx.element.create({
                        data: {
                            boardId,
                            type: "shape",
                            x: startX + (i % 3) * 260,
                            y: startY + Math.floor(i / 3) * 160,
                            data: {
                                shape: "rectangle",
                                label: String(node.label || "").slice(0, 60),
                                width: 180,
                                height: 70,
                            },
                        },
                    });
                    idMap[node.id] = el;
                    rows.push(el);
                }

                for (const edge of Array.isArray(ai.edges) ? ai.edges.slice(0, 30) : []) {
                    const from = idMap[edge.from];
                    const to = idMap[edge.to];
                    if (!from || !to) continue; // skip edges pointing at unknown nodes

                    const arrow = await tx.element.create({
                        data: {
                            boardId,
                            type: "arrow",
                            x: from.x,
                            y: from.y,
                            data: {
                                fromElementId: from.id,
                                toElementId: to.id,
                                label: String(edge.label || "").slice(0, 40),
                            },
                        },
                    });
                    rows.push(arrow);
                }

                return rows;
            });
        } else {
            const build = mode === "sticky_notes" ? notesToElements : chartToElements;
            const items = build(ai, startX, startY);
            if (!items) {
                return res.status(502).json({ message: "AI returned unusable data, try again" });
            }

            created = await prisma.$transaction(
                items.map((item) => prisma.element.create({ data: { boardId, ...item } }))
            );
        }

        emitToBoard(boardId, "elements:created", created);
        res.status(201).json({ message: "Generated", mode, result: created });
    } catch (error) {
        console.log(error);
        if (error.status === 503) {
            return res.status(503).json({ message: "AI is not configured on the server" });
        }
        if (error.status === 502) {
            return res.status(502).json({ message: error.message });
        }
        res.status(500).json({ message: "Could not generate content" });
    }
};
