import { Hono } from "hono";
import { userRouter } from "./user";
import { blogRoutes } from "./blog";



const app=new Hono<{
  Bindings: {
  DATABASE_URL: string,
  JWT_SECRET: string
  }
}>();
app.route('/api/v1/user',userRouter)
app.route('/api/v1/blog', blogRoutes)

export default app;