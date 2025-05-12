import { handleAxiosError } from "../../shared/error/handleAxiosError";
import { Api } from "../api/axios-config";

export interface ISelect {
  id: number;
  name?: string;
  f23?: boolean;
  cod_department?: number;
}

export interface ICameraReview {
  id?: number;
  monitor_registration: number;
  car: number;
  date_camera: string;
  date_occurrence: string;
  reviewed_by?: string;
  date_review?: string;
  comment: string;
  video_path?: string;
  there_video: number;
  updated_at?: string;
  camera_occurrence: ISelect[];
  driver_registration?: number;
  ra_globus?: string;
  camera_status: ISelect[];
}

type resultAllCameraReview = {
  data: {
    success: boolean;
    statusCode: number;
    message: ICameraReview[];
  };
};

type resultCameraReview = {
  data: {
    success: boolean;
    statusCode: number;
    message: ICameraReview;
  };
};

type resultSelects = {
  data: {
    success: boolean;
    statusCode: number;
    message: ISelect[];
  };
};

type resultDelete = {
  data: {
    success: boolean;
    statusCode: number;
    message: string;
  };
};

export interface ICameraReviewBase {
  camera_status: number;
  comment: string;
  reviewed_by?: string | null;
  date_review?: string | null;
  video_path?: string | null;
  there_video: number;
}

export interface ICameraReviewForm extends ICameraReviewBase {
  monitor_registration: number;
  car: number;
  date_camera: string;
  date_occurrence: string;
  camera_occurrence: number;
  driver_registration?: number | null;
  ra_globus?: string | null;
}

export interface ICameraReviewUpdate extends ICameraReviewBase {
  updated_at: string;
}

interface IFilter {
  search?: number;
  startedDate: string;
  endDate: string;
}

const getAllCameraReview = async (
  filter: IFilter,
  accessToken?: string
): Promise<ICameraReview[] | Error> => {
  try {
    const { data }: resultAllCameraReview = await Api.get(
      `/camera-reviews/?busca=${filter.search}&dataInicio=${filter.startedDate}&dataFim=${filter.endDate}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getCameraReview = async (
  id: number,
  accessToken?: string
): Promise<ICameraReview | Error> => {
  try {
    const { data }: resultCameraReview = await Api.get(`/camera-review/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error) {
    throw handleAxiosError(error);
  }
};

const getAllCameraReviewStatus = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data }: resultSelects = await Api.get("/camera-review-status", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const getAllOccurrence = async (
  accessToken?: string
): Promise<ISelect[] | Error> => {
  try {
    const { data }: resultSelects = await Api.get("/camera-review-occurrence", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const createCameraReview = async (
  payload: ICameraReviewForm,
  accessToken?: string
): Promise<ICameraReview | Error> => {
  try {
    const { data }: resultCameraReview = await Api.post(
      "/camera-review",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateCameraReview = async (
  id: number,
  payload: ICameraReviewForm,
  accessToken?: string
): Promise<ICameraReview | Error> => {
  try {
    const { data }: resultCameraReview = await Api.put(
      `/camera-review/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const updateStatusCameraReview = async (
  id: number,
  payload: ICameraReviewUpdate,
  accessToken?: string
): Promise<ICameraReview | Error> => {
  try {
    const { data }: resultCameraReview = await Api.patch(
      `/camera-review/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

const deleteCameraReview = async (
  id: number,
  accessToken?: string
): Promise<string | Error> => {
  try {
    const { data }: resultDelete = await Api.delete(`/camera-review/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data.message;
  } catch (error: any) {
    throw handleAxiosError(error);
  }
};

export const RevisaoCameraService = {
  getAllCameraReview,
  getCameraReview,
  getAllOccurrence,
  getAllCameraReviewStatus,
  createCameraReview,
  updateCameraReview,
  deleteCameraReview,
  updateStatusCameraReview,
};
