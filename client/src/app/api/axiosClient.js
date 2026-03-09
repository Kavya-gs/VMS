import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:5173/api",
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosClient;