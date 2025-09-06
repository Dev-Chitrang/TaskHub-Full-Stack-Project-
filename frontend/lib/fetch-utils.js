import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000/api-v1";

const api = axios.create({
    baseURL: BASE_URL,
});

// 🔑 Interceptor to handle auth and dynamic Content-Type
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
        config.headers["Content-Type"] = "application/json";
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            window.dispatchEvent(new Event("force-logout"));
        }
        return Promise.reject(error.response);
    }
);

const postData = async (path, data) => {
    const res = await api.post(path, data);
    return res.data;
};

const getData = async (path) => {
    const res = await api.get(path);
    return res.data;
};

const updateData = async (path, data) => {
    const res = await api.put(path, data);
    return res.data;
};

const deleteData = async (path) => {
    const res = await api.delete(path);
    return res.data;
};

export { postData, getData, updateData, deleteData };
export default api;
