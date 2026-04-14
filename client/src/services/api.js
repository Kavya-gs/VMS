import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

let loadingContext = null;

export const setLoadingContext = (context) => {
  loadingContext = context;
};

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  if (loadingContext && req.showLoader !== false) {
    loadingContext.startLoading();
  }

  return req;
});

API.interceptors.response.use(
  (response) => {
    if (loadingContext && response.config?.showLoader !== false) {
      loadingContext.stopLoading();
    }
    return response;
  },
  (error) => {
    if (loadingContext && error.config?.showLoader !== false) {
      loadingContext.stopLoading();
    }
    return Promise.reject(error);
  }
);

export default API;