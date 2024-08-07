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
return <div className=" p-4 border-b border-slate-200 pb-4">
     <div className="flex"> 
        <div className="flex justify-center pl-2 text-sm
         flex-col">
             <Avatar name={authorName}/>
        </div>
       <div className=" flex justify-center flex-col pl-2 text-slate-600"> {authorName}
        </div> 
         <div className="flex justify-center flex-col pl-2">
            <Cicle />
         </div>
        <div className=" text-sm pl-2 justify-center flex-col pt-0.5 font-thin ">
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
</div>
}
function Cicle(){
    return <div className="h-1 w-1 rounded-full bg-slate-500">

    </div>
}
 export const Avatar=({name ,size=6}: {name:string , size?:number})=>{
    return <div>
        <div className={`relative inline-flex items-center justify-center  w-${size} h-${size} overflow-hidden bg-gray-400 rounded-full dark:bg-gray-600`}>
    <span className="text-sm  text-gray-600 dark:text-gray-600">{name[0]}</span>
</div>
    </div>
}