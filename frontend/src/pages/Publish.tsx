import { Appbar } from "../components/Appbar";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate } from "react-router-dom";
import { ChangeEvent, useState } from "react";

export const Publish = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const handlePublish = async () => {
    // Validate inputs
    if (!title.trim() || !description.trim()) {
      alert("Both title and content are required to publish a post.");
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You need to log in before publishing a post.");
      return;
    }

    try {
      // Make POST request to the backend
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/blog`,
        {
          title,
          content: description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Navigate to the blog post page after successful publishing
      navigate(`/blog/${response.data.id}`);
    } catch (error) {
      console.error("Error publishing post:", error);
      alert("Failed to publish the post. Please try again later.");
    }
  };

  return (
    <div>
      <Appbar />
      <div className="flex justify-center w-full pt-8">
        <div className="max-w-screen-lg w-full">
          {/* Title Input */}
          <input
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="Title"
          />

          {/* Text Editor */}
          <TextEditor onChange={(e) => setDescription(e.target.value)} />

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            type="submit"
            className="mt-4 inline-flex items-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-700 rounded-lg focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 hover:bg-blue-800"
          >
            Publish post
          </button>
        </div>
      </div>
    </div>
  );
};

// Text Editor Component
function TextEditor({
  onChange,
}: {
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className="mt-2">
      <textarea
        onChange={onChange}
        id="editor"
        rows={8}
        className="focus:outline-none block w-full px-2 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg"
        placeholder="Write an article..."
        required
      />
    </div>
  );
}
