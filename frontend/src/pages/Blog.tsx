// export const Blog=()=>{
//     return <div>
//         blog
//     </div>
// }
import { Blogcard } from "../components/Blogcard"

export const Blog=()=>{
    return <div>
        <Blogcard
        authorName={"harkirat"}
        title={"title of the blog"}
        content={"content of blog "}
        publishDate={"2nd feb 2025"}
        />
    </div>
    
}