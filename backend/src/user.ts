import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign, verify  } from 'hono/jwt'
import { Hono } from "hono";
import { signinInput, signupInput } from '@exponus1/exponus-common';


///Added binding to elemenate ts-ignore
export const userRouter=new Hono<{
    Bindings:{
        DATABASE_URL: string;
        JWT_SECRET: string
    }
}>();
//sign-up route 
userRouter.post('/signup',async (c)=>{
  const body= await c.req.json();
  const { success}=signupInput.safeParse(body)
  if(!success){
    c.status(404)
    return c.json({
      msg:"wrong inputs are provided"
    })
  }
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  try{
  const user = await prisma.user.create({
    //@ts-ignore
    data: {
      
      email: body.email,
      password: body.password,
    },
  });
  
  const token=await sign({id:user.id}, c.env.JWT_SECRET)
   
  return c.json({
    jwt:token,
    msg:"user created "
  })
}catch(e){
  console.log(e)
  c.status(404)
  return c.text('invalid')
}
  });
  //sign-in route 
  userRouter.post('/signin',async (c)=>{
    const body=await c.req.json();
    const {success}=signinInput.safeParse(body)
    if(!success){
      c.status(403)
      return c.json({
        msg:"invalid input"
      })
    }
    const prisma = new PrismaClient({
      datasourceUrl : c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  const user=await prisma.user.findUnique({
    where:{
      email:body.email
    }
  })
  if(!user){
     c.status(404)
  return c.json({error:"user is not found"})
  }
  
  const token= await sign({id:user.id},c.env.JWT_SECRET)
  return c.json({jwt:token})
  })