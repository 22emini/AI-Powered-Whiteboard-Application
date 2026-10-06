import { prisma } from "../config/prisma.js";




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


const CreateBoard = async (req,res)=>{
try {
const {title}= req.body;

if(!title){
    res.status(400).json({message:"Please Enter the Board Title"})
    return;
}

} catch (error){
    res.status(500).json({message:"THere an issue in Creating the board"})


}
    

    
}
