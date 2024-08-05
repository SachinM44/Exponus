interface Blogcardprops{
    authorName:string;
    title:string;
    content:string;
    publishDate:string;

}
export const Blogcard=({
    authorName,
    title,
    content,
    publishDate
}:Blogcardprops)=>{
return <div>
     <div className="flex"> 
        <div className="flex justify-center flex-col">
             <Avatar name={authorName}/>
        </div>
       <div className=" pl-2 text-slate-600"> {authorName}
        </div> 
         <div className="flex justify-center flex-col pl-2">
            <Cicle />
         </div>
        <div className=" pl-2 font-thin">
        {publishDate}
        </div>
     </div>
     <div className=" text-xl font-semibold">
        {title}
     </div>
     <div className="text-md font-thin">
        {content.slice(0,100) + "..."}
     </div>
     <div className="text-slate-500 font-thin">
        {`${Math.ceil(content.length/100)} minutes(s)
        read`}
     </div>
     <div className="bg-slate-200 h-1 w-full text-slate-400">

     </div>
</div>
}
function Cicle(){
    return <div className="h-1 w-1 rounded-full bg-slate-500">

    </div>
}
 const Avatar=({name}: {name:string})=>{
    return <div>
        <div className="relative inline-flex items-center justify-center w-5 h-5 overflow-hidden bg-gray-400 rounded-full dark:bg-gray-600">
    <span className="text-sm  text-gray-600 dark:text-gray-600">{name[0]}</span>
</div>
    </div>
}