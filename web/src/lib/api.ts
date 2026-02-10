import axios from "axios";

export const api = axios.create({
    baseURL: "/api", // Relative path assumes proxy or same domain
    headers: {
        "Content-Type": "application/json",
    },
});

export const submitApplication = async (data: any) => {
    const response = await api.post("/application/submit", data); // Verify endpoint name later
    return response.data;
};
