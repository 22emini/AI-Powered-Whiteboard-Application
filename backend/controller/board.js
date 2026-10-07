import { prisma } from "../src/config/db.js";


export const  GetAllBoards = async (req,res)=>{

    try {

        // boards I own + boards shared with me
        const result = await prisma.board.findMany({
            where: {
                OR: [
                    { ownerId: req.userId },
                    { members: { some: { userId: req.userId } } },
                ],
            },
            orderBy: { updatedAt: "desc" },
        });

        res.status(200).json({message:"Success",result:result});
    } catch(error){
        console.log(error)
        return res.status(500).json({message:"There an issue in getting Board data"})
    }
}


export const CreateBoard = async (req,res)=>{
try {
const {title}= req.body;

if(!title){
    res.status(400).json({message:"Please Enter the Board Title"})
    return;
}

const add = await prisma.board.create({
 data: { title: title, ownerId: req.userId },
})
res.status(201).json({message:"Success, board data has been created",result:add});

} catch (error){
    console.log(error);
    res.status(500).json({message:"THere an issue in Creating the board"})
}
    }


export const GetById = async (req,res)=>{
     try {
    const board = await prisma.board.findFirst({
    where: {
        id: req.params.id,
        OR: [
            { ownerId: req.userId },
            { members: { some: { userId: req.userId } } },
        ],
    },
    include: { elements: true },
});

        if (!board) {
            return res.status(404).json({ error: "Board not found" });
        }
        res.json(board);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not get board" })
    }
}

export const UpdateBoard = async (req,res)=>{
 try {
        const title = req.body.title;
        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }
      const result = await prisma.board.updateMany({
    where: { id: req.params.id, ownerId: req.userId },
    data: { title: title },
});
if (result.count === 0) {
    return res.status(404).json({ message: "Board not found" });
}
res.json({ message: "Board updated" });
;
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Board not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Could not update board" });
    }
}


export const DeleteBoard = async (req,res)=>{
      try {
   const result = await prisma.board.deleteMany({
    where: { id: req.params.id, ownerId: req.userId },
});
if (result.count === 0) {
    return res.status(404).json({ message: "Board not found" });
}
res.status(204).send();

    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Board not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Could not delete board" });
    }
}