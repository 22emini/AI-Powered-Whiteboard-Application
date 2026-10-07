import { prisma } from "../src/config/db.js";
export const CreateElement = async (req, res) => {
try {
    

}catch(error){
    res.status(500).json({message:"An has occured in creating, An elememnt"})
    console.log(error)
}


}