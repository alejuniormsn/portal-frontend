import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";

export interface IGender {
  id?: number;
  name: number;
}

const getAllGender = async (
  accessToken?: string
): Promise<IGender[] | Error> => {
  try {
    const { data } = await Api.get("/gender", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const GenderService = {
  getAllGender,
};
