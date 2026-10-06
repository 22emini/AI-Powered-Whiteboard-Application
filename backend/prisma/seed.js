import { prisma } from "../src/config/db.js";

async function main() {
    // 1. A test user (upsert = create if missing, otherwise leave as is)
    const user = await prisma.user.upsert({
        where: { id: "test-user-1" },
        update: {},
        create: {
            id: "test-user-1",
            email: "test@example.com",
            name: "Test User",
        },
    });

    // 2. A board that has some elements
    const board = await prisma.board.create({
        data: {
            title: "Sprint Planning",
            ownerId: user.id,
            elements: {
                create: [
                    {
                        type: "sticky",
                        x: 100,
                        y: 120,
                        data: { text: "Ship login page", color: "yellow" },
                    },
                    {
                        type: "sticky",
                        x: 320,
                        y: 120,
                        data: { text: "Fix canvas zoom bug", color: "pink" },
                    },
                    {
                        type: "shape",
                        x: 200,
                        y: 300,
                        data: { shape: "rectangle", width: 160, height: 90, color: "blue" },
                    },
                ],
            },
        },
    });

    // 3. A second, empty board
    await prisma.board.create({
        data: { title: "Brainstorm", ownerId: user.id },
    });

    console.log("Seeded user:", user.id);
    console.log("Seeded board:", board.id);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
