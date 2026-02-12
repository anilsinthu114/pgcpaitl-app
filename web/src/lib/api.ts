import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:5000/api", // Use relative paths to allow Next.js proxying
    headers: {
        "Content-Type": "application/json",
    },
});


api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("adminToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export const submitApplication = async (data: any) => {
    const response = await api.post("/application/submit", data);
    return response.data;
};

