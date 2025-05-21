import axios from "axios";

import { responseInterceptor, errorInterceptor } from "./interceptors";
import { Environment } from "../../../environment";

const axiosConfig = {
  baseURL: Environment.URL_BASE,
  timeout: 7000,
};

const Api = axios.create(axiosConfig);

Api.interceptors.response.use(
  (response) => responseInterceptor(response),
  (error) => errorInterceptor(error)
);

export { Api };
