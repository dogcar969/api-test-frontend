const axios = require("axios").default;

const baseURL = "http://localhost:8082/";

const instance = axios.create({
  baseURL,
  timeout: 10000,
});

instance.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("token");
    config.headers.Authorization = token;
    return config;
  },
  (err) => Promise.reject(err)
);

instance.interceptors.response.use(
  (data) => {
    console.log(data);
    return data.data;
  },
  (err) => {
    console.log(err);
    return err;
  }
);

export default instance;
