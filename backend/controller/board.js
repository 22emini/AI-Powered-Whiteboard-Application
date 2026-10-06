import { prisma } from "../src/config/db.js";

// TEMP: replace with the logged-in user once auth exists
const TEMP_USER_ID = process.env.TEMP_USER_ID;
export const  GetAllBoards = async (req,res)=>{


    try {


        const  result = await prisma.board.findMany();

        res.status(200).json({message:"Success",result:result});
        
        console.log("Success",result)
    } catch(error){
        return res.status(500).json({message:"There an issue in getting Board data"})

        console.log(error)
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
 data: { title: title, ownerId: TEMP_USER_ID },
})
res.status(201).json({message:"Success, board data has been created",result:add});

} catch (error){
    res.status(500).json({message:"THere an issue in Creating the board"})
}
    }


export const GetById = async (req,res)=>{
     try {
        const board = await prisma.board.findUnique({
            where: { id: req.params.id },
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
        const board = await prisma.board.update({
            where: { id: req.params.id },
            data: { title: title },
        });
        res.json(board);
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
        await prisma.board.delete({ where: { id: req.params.id } });
        res.status(204).send();
    } catch (error) {
        if (error.code === "P2025") {
            return res.status(404).json({ error: "Board not found" });
        }
        console.error(error);
        res.status(500).json({ error: "Could not delete board" });
    }
}