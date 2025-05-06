import React, { useEffect, useState, useMemo, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
// import Appbar from "../components/Appbar"
import { FullBlog } from "../components/FullBlog"

export const Blog = () => {
    const { id } = useParams()
    const blogId = useMemo(() => parseInt(id || "0"), [id])
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    return (
        <div>
            {/* Remove Appbar render */}
            {/* <Appbar /> */}
            <FullBlog />
        </div>
    )
}

export default Blog;