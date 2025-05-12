import { AxiosError } from "axios";

export const errorInterceptor = (error: AxiosError) => {
  if (error.message === "Network Error") {
    return Promise.reject(new Error());
  }

  // if (error.response?.status === 401) {
  //   alert("Credenciais inválidas.");
  // }

  return Promise.reject(error);
};
