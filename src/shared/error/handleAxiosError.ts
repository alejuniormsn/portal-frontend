import axios from "axios";

export const handleAxiosError = (error: any) => {
  if (axios.isAxiosError(error) && error.response) {
    throw error.response.data;
  } else {
    throw error;
  }
};
