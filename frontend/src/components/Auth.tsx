import { ChangeEvent, useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SignupInput } from "@exponus1/exponus-common";
import apiClient from "../lib/apiClient";
import { ThemeToggle } from "./ThemeToggle";
import toast from "react-hot-toast";
import axios from "axios";

export const Auth = ({ type }: { type: "signup" | "signin" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/blogs"; // Default redirect to blogs
    
    const [postInputs, setPostInputs] = useState<SignupInput>({
        name: "",
        username: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<{
        username?: string;
        password?: string;
    }>({});

    const validateForm = () => {
        const errors: {
            username?: string;
            password?: string;
        } = {};
        let isValid = true;

        // Reset errors
        setError("");
        setFieldErrors({});

        // Validate username
        if (!postInputs.username.trim()) {
            errors.username = "Username is required";
            isValid = false;
        } else if (postInputs.username.trim().length < 3) {
            errors.username = "Username must be at least 3 characters";
            isValid = false;
        }

        // Validate password
        if (!postInputs.password) {
            errors.password = "Password is required";
            isValid = false;
        } else if (postInputs.password.length < 6) {
            errors.password = "Password must be at least 6 characters";
            isValid = false;
        }

        setFieldErrors(errors);
        return isValid;
    };

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!validateForm()) return;
        
        try {
            setLoading(true);
            setError("");
            
            // Direct API call without auth headers since we're signing in/up
            const response = await apiClient.post(`/api/v1/user/${type === "signup" ? "signup" : "signin"}`, postInputs);
            const jwt = response.data;
            localStorage.setItem("token", jwt);
            
            // Show success toast
            toast.success(type === "signup" ? "Account created successfully!" : "Welcome back!");
            
            navigate(from); // Redirect to the page they were trying to access, or blogs
        } catch(error) {
            // Type guard for axios errors with improved error handling
            let errorMsg = "An error occurred. Please try again.";
            
            if (axios.isAxiosError(error)) {
                // Handle specific error status codes
                if (error.response) {
                    const status = error.response.status;
                    
                    if (status === 409) {
                        // Username already exists
                        errorMsg = error.response.data?.message || "Username already exists. Please choose a different username.";
                        setFieldErrors(prev => ({ ...prev, username: "Username already exists" }));
                    } else if (status === 403) {
                        // Invalid credentials
                        errorMsg = "Invalid username or password.";
                    } else if (status === 411) {
                        // Invalid input
                        errorMsg = "Please check your inputs and try again.";
                    } else if (error.response.data?.message) {
                        // Use server-provided message
                        errorMsg = error.response.data.message;
                    }
                } else if (error.request) {
                    // Request made but no response received
                    errorMsg = "Could not connect to server. Please check your internet connection.";
                }
            }
            
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }
    
    return (
        <div className="h-screen flex justify-center flex-col dark:bg-gray-900">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="flex justify-center">
                <div className="w-full max-w-md px-6">
                    <div className="px-0 md:px-10">
                        <div className="text-3xl font-extrabold dark:text-white mb-2">
                            {type === "signin" ? "Welcome back" : "Create an account"}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                            {type === "signin" ? "Don't have an account?" : "Already have an account?" }
                            <Link className="pl-2 text-blue-600 dark:text-blue-400 hover:underline" to={type === "signin" ? "/" : "/signin"}>
                                {type === "signin" ? "Sign up" : "Sign in"}
                            </Link>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="pt-8">
                        {type === "signup" && (
                            <LabelledInput 
                                label="Name" 
                                placeholder="John Doe" 
                                onChange={(e) => {
                                    setPostInputs({
                                        ...postInputs,
                                        name: e.target.value
                                    })
                                }} 
                            />
                        )}
                        <LabelledInput 
                            label="Username" 
                            placeholder="username123" 
                            error={fieldErrors.username}
                            onChange={(e) => {
                                setPostInputs({
                                    ...postInputs,
                                    username: e.target.value
                                })
                            }}
                        />
                        {type === "signup" && !fieldErrors.username && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Username must be unique and at least 3 characters.
                            </p>
                        )}
                        <LabelledInput 
                            label="Password" 
                            type="password" 
                            placeholder="••••••••" 
                            error={fieldErrors.password}
                            onChange={(e) => {
                                setPostInputs({
                                    ...postInputs,
                                    password: e.target.value
                                })
                            }}
                        />
                        {type === "signup" && !fieldErrors.password && (
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                Password must be at least 6 characters.
                            </p>
                        )}
                        {error && (
                            <div className="mt-4 text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}
                        <button 
                            type="submit"
                            disabled={loading} 
                            className="mt-8 w-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-70 flex justify-center"
                        >
                            {loading ? (
                                <span className="inline-block h-5 w-5 border-t-2 border-white border-r-2 rounded-full animate-spin"></span>
                            ) : (
                                type === "signup" ? "Sign up" : "Sign in"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

interface LabelledInputType {
    label: string;
    placeholder: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    error?: string;
}

function LabelledInput({ label, placeholder, onChange, type, error }: LabelledInputType) {
    return (
        <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                {label}
            </label>
            <input 
                onChange={onChange} 
                type={type || "text"} 
                className={`bg-gray-50 border ${error ? 'border-red-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400`} 
                placeholder={placeholder} 
                required 
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}