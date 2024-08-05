import { Hono } from "hono";
import { userRouter } from "./user";
import { blogRoutes } from "./blog";
import { cors } from "hono/cors";



const app=new Hono<{
  Bindings: {
  DATABASE_URL: string,
  JWT_SECRET: string
  }
}>();
app.use('/*', cors())
app.route('/api/v1/user',userRouter)
app.route('/api/v1/blog', blogRoutes)

export default app;