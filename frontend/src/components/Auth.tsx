import { ChangeEvent, useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SignupInput, SigninInput, signupInput, signinInput } from "@exponus1/exponus-common";
import apiClient from "../lib/apiClient";
import { ThemeToggle } from "./ThemeToggle";
import toast from "react-hot-toast";
import axios from "axios";

export const Auth = ({ type }: { type: "signup" | "signin" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/blogs"; // Default redirect to blogs
    
    const [postInputs, setPostInputs] = useState<SignupInput | SigninInput>({
        name: type === 'signup' ? "" : undefined,
        username: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setFieldErrors({});

        const schema = type === 'signup' ? signupInput : signinInput;
        const parseResult = schema.safeParse(postInputs);

        if (!parseResult.success) {
            const flattenedErrors = parseResult.error.flatten().fieldErrors;
            setFieldErrors(flattenedErrors);
            setError("Please check the errors below.");
            return;
        }
        
        try {
            setLoading(true);
            
            const response = await apiClient.post(`/api/v1/user/${type === "signup" ? "signup" : "signin"}`, parseResult.data);
            // Extract the token from the response object
            const jwt = response.data.token;
            
            // Make sure we're storing a string token
            if (jwt && typeof jwt === 'string') {
                localStorage.setItem("token", jwt);
                toast.success(type === "signup" ? "Account created successfully!" : "Welcome back!");
                navigate(from);
            } else {
                // Handle unexpected response format
                console.error("Unexpected token format:", response.data);
                toast.error("Authentication failed: Invalid token format");
            }
        } catch(error) {
            let errorMsg = "An error occurred. Please try again.";
            
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    const status = error.response.status;
                    
                    if (status === 409) {
                        errorMsg = error.response.data?.message || "Username already exists. Please choose a different username.";
                        setFieldErrors(prev => ({ ...prev, username: "Username already exists" }));
                    } else if (status === 403) {
                        errorMsg = "Invalid username or password.";
                    } else if (status === 411) {
                        errorMsg = "Please check your inputs and try again.";
                    } else if (error.response.data?.message) {
                        errorMsg = error.response.data.message;
                    }
                } else if (error.request) {
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
                                error={fieldErrors.name}
                                onChange={(e) => {
                                    setPostInputs(prev => ({ ...prev, name: e.target.value }))
                                }} 
                            />
                        )}
                        <LabelledInput 
                            label="Username" 
                            placeholder="username123" 
                            error={fieldErrors.username}
                            onChange={(e) => {
                                setPostInputs(prev => ({ ...prev, username: e.target.value }))
                            }}
                        />
                        <LabelledInput 
                            label="Password" 
                            type="password" 
                            placeholder="••••••••" 
                            error={fieldErrors.password}
                            onChange={(e) => {
                                setPostInputs(prev => ({ ...prev, password: e.target.value }))
                            }}
                        />
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
                aria-invalid={!!error}
                className={`bg-gray-50 border ${error ? 'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'} text-sm rounded-lg block w-full p-2.5 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white ${error ? 'dark:text-red-400 dark:focus:ring-red-500 dark:focus:border-red-500' : 'dark:focus:ring-blue-500 dark:focus:border-blue-500'}`}
                placeholder={placeholder} 
                required 
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}