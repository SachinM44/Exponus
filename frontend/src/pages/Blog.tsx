// export const Blog=()=>{
//     return <div>
//         blog
//     </div>
// }
import { Appbar } from "../components/Appbar"
import { Blogcard } from "../components/Blogcard"

export const Blog=()=>{
    return <div>
            <Appbar />
         <div className="flex justify-center flex-col">
          {blogs.map{blog=> <div className=" max-w-xl">
            <Blogcard
              authorName={blog.author.name || " Anonymous"}
              title={blog.content}
             content={"how the ugly website makes $38838 a month what to know really .. read more about this  "}
             publishDate={"2nd feb 2025"}
        />
        </div>}}
        
 </div>
</div>
}