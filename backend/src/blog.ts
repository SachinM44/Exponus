import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify  } from 'hono/jwt'
import { Hono } from "hono";
import { createblogInput, updateblogInput } from '@exponus1/exponus-common';

export const blogRoutes=new Hono<{
    Bindings:{
        DATABASE_URL: string,
        JWT_SECRET: string
    },
    Variables:{
        userId: string;
    }
}>();
////////////////////////////middleware
blogRoutes.use('/*',async (c,next)=>{
const authToken=c.req.header("Authorization") || "";
try{
     const user=await verify(authToken, c.env.JWT_SECRET);
 if(user){
    //@ts-ignore
    c.set("userId",user.id);
    await next();
 }else{
    c.status(403) 
    return c.json({
        msg:"are not logged in"
    })
 }
}catch(e){
    c.status(404)
   return  c.json({
    msg:"dude you are not loged-in "
   })
}
});

/// create users blogs  here 
blogRoutes.post('/',async (c)=>{
    const body=await c.req.json()
    const {success}=createblogInput.safeParse(body)
    if(!success){
        c.status(403)
        return c.json({
            mag:"inncorrect inputs"
        })
    }
    const userId=c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate()) 
    const post= await prisma.blog.create({
        
    data: {
        title:body.title,
        content:body.content,
        authorId:Number(userId)
    }
  })
  return c.json({
    id:post.id
  })
})
//////////////////to update ur posts/blogs
blogRoutes.put('/',async (c)=>{
    const body=await c.req.json()
    const {success}=updateblogInput.safeParse(body)
    if(!success){
        c.status(403)
        return c.json({
            msg:"invalid inputs"
        })
    }
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate()) 
    const post= await prisma.blog.update({
        where: {
            id:body.id
        },
        data: {
            title:body.title,
            content:body.content,
           
        }
    })
    return c.json({
        id:post.id
    })

})
/////////////////////paggination
blogRoutes.get('/bulk',async (c)=>{
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate()) 
    const blog= await prisma.blog.findMany({
        select: {
            content:true,
            title:true,
            id:true,
            author : {
                select:{
                    name : true
                }
            }
        }
    });
    return c.json({
        blog
    })

})
/////////////////
blogRoutes.get('/:id',async (c)=>{
    const id=await c.req.param("id")
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate()) 
    const body=await c.req.json()

    try{
        const blog= await prisma.blog.findFirst({
            where: {
                
                id: Number(id)
            }
        })
        return c.json({
            blog
        })
    } catch(e){
        c.status(411);
        return c.json({
            msg:"error while loading the constent "
        })
    }

})
 