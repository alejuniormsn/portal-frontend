import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import {
  dateNow,
  isValidatedIntervalDates,
  keepDate,
  transformDate,
  transformDateHour,
  validatedDate,
} from "../../shared/utils/workingWithDates";
import {
  ICameraReviewForm,
  RevisaoCameraService,
} from "../../services/revisao-camera/RevisaoCameraService";
import {
  IVehicle,
  VehicleService,
} from "../../services/vehicle/VehicleService";
import checkCircleIcon from "../../assets/icons/check_circle.svg";
import checkCircleRedIcon from "../../assets/icons/check_circle_red.svg";
import InputMask from "react-input-mask";
import * as yup from "yup";
import { VTextField, VForm, useVForm, VSelect } from "../../shared/forms";
import { ISelectMonitoring } from "../../services/monitoramento/MonitoramentoService";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FerramentasDeDetalhe } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks/UseDebounce";
import { messageError } from "../../shared/utils/messages/messageError";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { useAuthContext } from "../../contexts";
import { canDo } from "../../shared/utils/canDo";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { canAccess } from "../../shared/utils/canAccess";
import { goBack } from "../../shared/utils/goBack";
import { doNotDelete } from "../../shared/utils/messages/doNotRun";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";
import { handleValidationFormErrors } from "../../shared/error/handleValidationFormErrors";

const formValidationSchema: yup.SchemaOf<ICameraReviewForm> = yup
  .object()
  .shape({
    monitor_registration: yup
      .number()
      .required("Chapa do monitor é obrigatória")
      .min(4, "Chapa do monitor deve ter no mínimo 4 caracteres"),
    car: yup.number().required("Veículo é obrigatório"),
    date_camera: yup.string().required("Data do lançamento é obrigatória"),
    date_occurrence: yup.string().required("Data da ocorrência é obrigatória"),
    camera_occurrence: yup.number().required("Ocorrência é obrigatória"),
    camera_status: yup.number().required("Status é obrigatório"),
    reviewed_by: yup.string().nullable().notRequired(),
    date_review: yup.string().nullable().notRequired(),
    video_path: yup.string().nullable().notRequired(),
    there_video: yup.number().required(),
    comment: yup
      .string()
      .required("Comentário é obrigatório")
      .min(10, "Comentário deve ter no mínimo 10 caracteres"),
    driver_registration: yup.number().nullable().notRequired(),
    ra_globus: yup.string().nullable().notRequired(),
  });

export const DetalheRevisaoCameras: React.FC = () => {
  const { formRef, save, saveAndClose, isSaveAndClose } = useVForm();
  const { id = "nova" } = useParams<"id">();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<ISelectMonitoring[]>([]);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [currentStatus, setCurrentStatus] = useState(0);
  const [searchParams] = useSearchParams();
  const [cameraOccurrence, setCameraOccurrence] = useState<ISelectMonitoring[]>(
    []
  );

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const AWAITING_MONITORING = 1;
  const AWAITING_CAMERA_REVIEW = 2;
  const AWAITING_CUT_VIDEO = 3;
  const FINISHED = 4;
  const CAMERA_REVIEW = 16;

  const search = useMemo(() => {
    return searchParams.get("search");
  }, [searchParams]);

  const change = useMemo(() => {
    return searchParams.get("change");
  }, [searchParams]);

  const cleanForm = () => {
    formRef.current?.setErrors({} as any);
    formRef.current?.setData({
      monitor_registration: loggedUser.registration,
      car: NaN,
      date_camera: keepDate(dateNow()),
      date_occurrence: keepDate(dateNow()),
      reviewed_by: "",
      date_review: "",
      comment: "",
      video_path: "",
      there_video: 2,
      camera_occurrence: NaN,
      camera_status: AWAITING_MONITORING,
      driver_registration: null,
      ra_globus: "",
    });
  };

  const payload = (data: ICameraReviewForm) => {
    return {
      ...data,
      date_camera: transformDate(data.date_camera),
      date_occurrence: transformDate(data.date_occurrence),
      video_path: data.video_path ? data.video_path : null,
      date_review: data.date_review
        ? transformDateHour(data.date_review)
        : null,
      reviewed_by: data.reviewed_by ? data.reviewed_by.toUpperCase() : null,
      driver_registration: data.driver_registration
        ? data.driver_registration
        : null,
      ra_globus: data.ra_globus ? data.ra_globus.toUpperCase() : null,
      created_at: dateNow(),
      updated_at: null,
    };
  };

  const payloadUpdate = (data: ICameraReviewForm) => {
    const newPayload = payload(data);
    return {
      ...newPayload,
      created_at: undefined,
      id: undefined,
      updated_at: dateNow(),
    };
  };

  const payloadApproved = (data: ICameraReviewForm) => {
    const newPayload = payload(data);
    const occurrence = cameraOccurrence.find(
      (e) => e.id === Number(data.camera_occurrence)
    );
    return {
      ...newPayload,
      camera_status: occurrence?.f23
        ? currentStatus + 1
        : currentStatus === AWAITING_CAMERA_REVIEW
        ? FINISHED
        : currentStatus + 1,
      created_at: undefined,
      id: undefined,
      updated_at: dateNow(),
    };
  };

  const payloadReproved = (data: ICameraReviewForm) => {
    return {
      camera_status: currentStatus - 1,
      comment: data.comment,
      video_path: data.video_path ? data.video_path : null,
      date_review: data.date_review
        ? transformDateHour(data.date_review)
        : null,
      reviewed_by: data.reviewed_by ? data.reviewed_by.toUpperCase() : null,
      there_video: data.there_video,
      updated_at: dateNow(),
    };
  };

  const handleSave = async (dados: ICameraReviewForm) => {
    if (!isValidatedIntervalDates(dados.date_occurrence, dados.date_camera)) {
      const errorMessage =
        "Data da ocorrência não pode ser maior que a data do lançamento";
      formRef.current?.setFieldError("date_occurrence", errorMessage);
      return messageWarning(errorMessage);
    }

    try {
      setIsLoading(true);
      const validatedData = await formValidationSchema.validate(dados, {
        abortEarly: false,
      });
      if (id === "nova") {
        await RevisaoCameraService.createCameraReview(
          payload(validatedData),
          accessToken
        );
      } else {
        await RevisaoCameraService.updateCameraReview(
          Number(id),
          payloadUpdate(validatedData),
          accessToken
        );
      }

      messageSuccess("Registro salvo com sucesso!");

      if (isSaveAndClose()) {
        goBack();
      } else {
        cleanForm();
      }
    } catch (error: any) {
      if (error.inner) {
        handleValidationFormErrors(error, formRef);
        messageError(error.message);
      } else {
        messageError(handleErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (currentStatus >= AWAITING_CAMERA_REVIEW) return doNotDelete();
    try {
      setIsLoading(true);
      if (await confirmDialog()) {
        await RevisaoCameraService.deleteCameraReview(id, accessToken);
        messageSuccess("Registro apagado com sucesso!");
        goBack();
      } else {
        return messageWarning("Cancelado pelo usuário");
      }
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const validatedReview = (data: ICameraReviewForm) => {
    const validations = [
      {
        field: "date_review",
        fn: (data: ICameraReviewForm) => !!data.date_review,
        message: "O campo Data de verificação é obrigatório",
      },
      {
        field: "reviewed_by",
        fn: (data: ICameraReviewForm) => !!data.reviewed_by,
        message: "O campo Verificado por é obrigatório",
      },
      {
        field: "there_video",
        fn: (data: ICameraReviewForm) =>
          !(data.there_video === 1 && data.video_path === null),
        message: "Defina o campo Tem vídeo? corretamente",
      },
      {
        field: "date_review",
        fn: (data: ICameraReviewForm) =>
          data.date_review == null || validatedDate(data.date_review),
        message: "Data de verificação inválida",
      },
    ];

    for (const { field, fn, message } of validations) {
      if (!fn(data)) {
        formRef.current?.setFieldError(field, message);
        throw new Error(message);
      }
    }
  };

  const handleApprove = async (id: number, cod_department: number) => {
    if (!canAccess(loggedUser.access_level, cod_department)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    const data = formRef.current?.getData() as ICameraReviewForm;

    try {
      setIsLoading(true);
      const validatedData = await formValidationSchema.validate(data, {
        abortEarly: false,
      });

      if (currentStatus === AWAITING_CAMERA_REVIEW) validatedReview(data);

      if (await confirmDialog()) {
        await RevisaoCameraService.updateCameraReview(
          id,
          payloadApproved(validatedData),
          accessToken
        );
        messageSuccess("Registro salvo com sucesso!");
        goBack();
      } else {
        return messageWarning("Cancelado pelo usuário");
      }
    } catch (error: any) {
      if (error.inner) {
        handleValidationFormErrors(error, formRef);
        messageError(error.message);
      } else {
        messageError(handleErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReprove = async (id: number, cod_department: number) => {
    if (!canAccess(loggedUser.access_level, cod_department)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    const data = formRef.current?.getData() as ICameraReviewForm;

    try {
      setIsLoading(true);
      if (await confirmDialog("Realmente deseja finalizar ?")) {
        await RevisaoCameraService.updateStatusCameraReview(
          id,
          payloadReproved(data),
          accessToken
        );
        messageSuccess("Enviado com sucesso");
        goBack();
      } else return messageWarning("Cancelado pelo usuário");
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    debounce(async () => {
      if (id === "nova") return cleanForm();

      try {
        setIsLoading(true);
        const result = await RevisaoCameraService.getCameraReview(
          Number(id),
          accessToken
        );
        if (result instanceof Error) throw result;
        const transformResult = {
          ...result,
          date_review: keepDate(result.date_review),
          date_camera: keepDate(result.date_camera),
          date_occurrence: keepDate(result.date_occurrence),
          camera_occurrence: result.camera_occurrence[0].id,
          camera_status: result.camera_status[0].id,
        };
        formRef.current?.setData(transformResult);
        setCurrentStatus(transformResult.camera_status);
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, [id, reload]);

  useEffect(() => {
    debounce(async () => {
      try {
        setIsLoading(true);

        if (localStorage.getItem("cameraStatus")) {
          setCameraStatus(
            JSON.parse(localStorage.getItem("cameraStatus") || "[]")
          );
          setCameraOccurrence(
            JSON.parse(localStorage.getItem("cameraOccurrence") || "[]")
          );
          setVehicles(JSON.parse(localStorage.getItem("vehicles") || "[]"));
          return;
        }

        const [cameraStatus, cameraOccurrence, cameraVehicles] =
          await Promise.all([
            RevisaoCameraService.getAllCameraReviewStatus(accessToken),
            RevisaoCameraService.getAllOccurrence(accessToken),
            VehicleService.getAllVehicles(accessToken),
          ]);

        if (cameraStatus instanceof Error) throw cameraStatus;
        setCameraStatus(cameraStatus);
        localStorage.setItem("cameraStatus", JSON.stringify(cameraStatus));

        if (cameraOccurrence instanceof Error) throw cameraOccurrence;
        setCameraOccurrence(cameraOccurrence);
        localStorage.setItem(
          "cameraOccurrence",
          JSON.stringify(cameraOccurrence)
        );

        if (cameraVehicles instanceof Error) throw cameraVehicles;
        setVehicles(cameraVehicles);
        localStorage.setItem("vehicles", JSON.stringify(cameraVehicles));
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  return (
    <LayoutBaseDePagina
      titulo={
        id === "nova"
          ? `Nova Revisão de Câmeras ou Solicitação de Imagens`
          : search
          ? `Consulta de Revisão de Câmeras: ${formRef.current?.getData().car}`
          : `Alteração de Revisão de Câmeras: ${formRef.current?.getData().car}`
      }
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarBotaoSalvar={id === "nova"}
          mostrarBotaoSalvarEFechar={!search && currentStatus !== 3}
          mostrarBotaoVoltar
          aoClicarEmSalvar={save}
          aoClicarEmSalvarEFechar={saveAndClose}
          mostrarBotaoLimpar={id === "nova" && !search}
          aoClicarEmVoltar={() => goBack()}
          aoClicarEmApagar={() => handleDelete(Number(id))}
        />
      }
    >
      <Box
        ml={2}
        mr={2}
      >
        <Card>
          <CardContent>
            <VForm
              ref={formRef}
              onSubmit={handleSave}
            >
              <Box
                display="flex"
                flexDirection="column"
                component={Paper}
                variant="outlined"
              >
                <Grid
                  container
                  direction="column"
                  padding={2}
                  spacing={2}
                >
                  {isLoading && (
                    <Grid item>
                      <LinearProgress variant="indeterminate" />
                    </Grid>
                  )}
                  <Grid item>
                    <Typography variant="h6">Detalhamento</Typography>
                  </Grid>
                  <Grid
                    container
                    item
                    direction="row"
                    spacing={2}
                  >
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={1}
                      lg={1}
                      xl={1}
                    >
                      <VTextField
                        fullWidth
                        name="id"
                        label="Cód. Id"
                        disabled
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VSelect
                        fullWidth
                        name="car"
                        label="Veículos"
                        disabled={
                          !!search || currentStatus >= AWAITING_CAMERA_REVIEW
                        }
                      >
                        {vehicles.map((item) => (
                          <MenuItem
                            key={item.id}
                            value={item.car}
                          >
                            {item.car}
                          </MenuItem>
                        ))}
                      </VSelect>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={1}
                      lg={1}
                      xl={1}
                    >
                      <VTextField
                        fullWidth
                        name="monitor_registration"
                        label="Monitor"
                        placeholder="Chapa monitor"
                        disabled={
                          !!search || currentStatus >= AWAITING_CAMERA_REVIEW
                        }
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="date_camera"
                        label="Data do lançamento"
                        placeholder="DD/MM/YYYY"
                        disabled={
                          !!search || currentStatus >= AWAITING_CAMERA_REVIEW
                        }
                        InputProps={{
                          inputComponent: InputMask as any,
                          inputProps: {
                            mask: "99/99/9999",
                            maskChar: null,
                          },
                        }}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="driver_registration"
                        label="Matrícula colaborador"
                        placeholder="Colaborador envolvido"
                        disabled={
                          !!search || currentStatus >= AWAITING_CAMERA_REVIEW
                        }
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="date_occurrence"
                        label="Data da ocorrência"
                        placeholder="DD/MM/YYYY"
                        disabled={
                          !!search || currentStatus >= AWAITING_CAMERA_REVIEW
                        }
                        InputProps={{
                          inputComponent: InputMask as any,
                          inputProps: {
                            mask: "99/99/9999",
                            maskChar: null,
                          },
                        }}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="ra_globus"
                        label="N° RA Globus"
                        placeholder="RA Globus"
                        disabled={!!search || currentStatus >= FINISHED}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={8}
                      lg={8}
                      xl={8}
                    >
                      <VSelect
                        fullWidth
                        name="camera_occurrence"
                        label="Ocorrências"
                        disabled={
                          !!search || currentStatus >= AWAITING_CAMERA_REVIEW
                        }
                      >
                        {cameraOccurrence.map((item) => (
                          <MenuItem
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </MenuItem>
                        ))}
                      </VSelect>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={4}
                      lg={4}
                      xl={4}
                    >
                      <VSelect
                        fullWidth
                        name="camera_status"
                        label="Status"
                        disabled
                      >
                        {cameraStatus.map((item) => (
                          <MenuItem
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </MenuItem>
                        ))}
                      </VSelect>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={12}
                      lg={12}
                      xl={12}
                    >
                      <VTextField
                        fullWidth
                        name="comment"
                        label="Comentários"
                        multiline
                        maxRows={3}
                        disabled={!!search || currentStatus >= FINISHED}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="date_review"
                        label="Data verificação"
                        placeholder="DD/MM/YYYY"
                        disabled={
                          !!search ||
                          currentStatus > AWAITING_CAMERA_REVIEW ||
                          !canDo(loggedUser.department, CAMERA_REVIEW)
                        }
                        InputProps={{
                          inputComponent: InputMask as any,
                          inputProps: {
                            mask: "99/99/9999",
                            maskChar: null,
                          },
                        }}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="reviewed_by"
                        label="Verificado por"
                        placeholder="Verificado por"
                        disabled={
                          !!search ||
                          currentStatus > AWAITING_CAMERA_REVIEW ||
                          !canDo(loggedUser.department, CAMERA_REVIEW)
                        }
                      />
                    </Grid>
                  </Grid>
                  <Grid
                    container
                    item
                    direction="row"
                    spacing={2}
                  >
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VSelect
                        fullWidth
                        name="there_video"
                        label="Tem vídeo?"
                        disabled={
                          !!search ||
                          currentStatus > AWAITING_CAMERA_REVIEW ||
                          !canDo(loggedUser.department, CAMERA_REVIEW)
                        }
                      >
                        <MenuItem value={1}>Sim</MenuItem>
                        <MenuItem value={2}>Não</MenuItem>
                      </VSelect>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={10}
                      lg={10}
                      xl={10}
                    >
                      <VTextField
                        fullWidth
                        name="video_path"
                        label="Endereço do vídeo"
                        disabled={!!search}
                      />
                    </Grid>
                  </Grid>
                  <Grid
                    container
                    item
                    spacing={2}
                    display="flex"
                    direction="row"
                    justifyContent="end"
                  >
                    <Grid item>
                      {!!change && currentStatus !== AWAITING_MONITORING ? (
                        <Button
                          color="primary"
                          variant="outlined"
                          style={{ border: "3px solid" }}
                          onClick={() =>
                            handleReprove(Number(id), CAMERA_REVIEW)
                          }
                          startIcon={<img src={checkCircleRedIcon} />}
                          disabled={currentStatus >= FINISHED}
                        >
                          <Typography
                            variant="button"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                            overflow="hidden"
                          >
                            Devolver Processo
                          </Typography>
                        </Button>
                      ) : null}
                    </Grid>
                    <Grid item>
                      {!!change && (
                        <Button
                          color="primary"
                          variant="contained"
                          onClick={() =>
                            handleApprove(Number(id), CAMERA_REVIEW)
                          }
                          startIcon={<img src={checkCircleIcon} />}
                          disabled={currentStatus >= FINISHED}
                        >
                          <Typography
                            variant="button"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                            overflow="hidden"
                          >
                            {currentStatus < AWAITING_CUT_VIDEO
                              ? "Gravar"
                              : "Finalizar"}
                          </Typography>
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            </VForm>
          </CardContent>
        </Card>
      </Box>
    </LayoutBaseDePagina>
  );
};
