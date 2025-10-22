import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL;

// Create an Axios instance
axios.defaults.baseURL = BASE_URL;
// const token = sessionStorage.getItem("biz-bozz");
const token = localStorage.getItem("biz-bozz-token");
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
axios.defaults.headers.common["Accept"] = "application/json";
axios.defaults.headers.post["Content-Type"] = "application/json";
// axios.defaults.withCredentials = true;

// export { setAuthToken };
export default axios;
