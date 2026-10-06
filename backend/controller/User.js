import { prisma } from "../src/config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";



const makeToken = (userId) => {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// user sign up

export const  SignUp = async (req,res) =>{
    const { email, name, password } = req.body;

    try{


        if( !email || !password  ){
            res.status(400).json({message:"Please Enter email and password"})
            return;

        } 

        if(password.length < 8){
          return  res.status(400).json({message:"Please Enter the Password Length Greater Than 6"});
          
        }
        const check = await prisma.user.findUnique({
            where:{
                email:email
            }
        })
        if(check){
            return  res.status(409).json({message:"Email already exists, User another Email"});
          
        }
const passwordHash= await bcrypt.hash(password,10)
    const user = await  prisma.user.create({
        data:{
            email:email,
            name:name,
       passwordHash: passwordHash
        }
    })
    res.status(201).json({
    message: "Account created",
    token: makeToken(user.id),
    user: { id: user.id, email: user.email, name: user.name },
});

    }catch(error){
        console.log(error);
        res.status(500).json({message:"There an issue in creating user"})
    }
}

// login 

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please Enter Email and Password" });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.passwordHash);

        if (!match) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.status(200).json({
            message: "Logged in",
            token: makeToken(user.id),
            user: { id: user.id, email: user.email, name: user.name },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "There an issue in logging in" });
    }
};
