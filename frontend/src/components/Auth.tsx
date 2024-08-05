import { signinInput, signupInput } from "@exponus1/exponus-common";
import axios from "axios";
import { ChangeEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";

export const Auth = ({ type }: { type: "signup" | "signin" }) => {
    const navigate = useNavigate();
    const [postInput, setPostInput] = useState<signinInput | signupInput>({
        name: "",
        username: "",
        password: ""
    });

    async function sendRequest() {
        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/user/${type === "signup" ? "signup" : "signin"}`, postInput);
            const jwt = response.data;
            localStorage.setItem("token", jwt);
            await navigate("/blogs");
        } catch (e) {
            console.error(e); {
              alert("Error while signing up")
            };
        }
    }

    return (
        <div className="h-screen flex justify-center flex-col">
            <div className="flex justify-center">
                <div>
                    <div>
                        <div className="text-4xl font-bold">
                            {type === "signup" ? "Create an account" : "Sign in"}
                        </div>
                        <div className="text-slate-600 pl-6">
                            {type === "signin" ? "Don't have an account?" : "Already have an account?"}
                            <Link className="underline pl-2" to={type === "signin" ? "signup" : "/signin"}>
                                {type === "signin" ? "Sign up" : "Sign in"}
                            </Link>
                        </div>
                    </div>

                    {type === "signup" && (
                        <LabelledInput
                            label="Name"
                            placeholder="Sachin..."
                            onChange={(e) => {
                                setPostInput({
                                    ...postInput,
                                    name: e.target.value
                                });
                            }}
                        />
                    )}
                    <LabelledInput
                        label="Username"
                        placeholder="sachin@gmail.com"
                        onChange={(e) => {
                            setPostInput({
                                ...postInput,
                                username: e.target.value
                            });
                        }}
                    />
                    <LabelledInput
                        label="Password"
                        type="password"
                        placeholder="12345"
                        onChange={(e) => {
                            setPostInput({
                                ...postInput,
                                password: e.target.value
                            });
                        }}
                    />
                    <button
                        type="button"
                        className="mt-5 w-full text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
                        onClick={sendRequest}
                    >
                        {type === "signup" ? "Sign up" : "Sign in"}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface LabelledInputType {
    label: string;
    placeholder: string;
    type?: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function LabelledInput({ label, placeholder, onChange, type }: LabelledInputType) {
    return (
        <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{label}</label>
            <input
                onChange={onChange}
                type={type || "text"}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder={placeholder}
                required
            />
        </div>
    );
}
