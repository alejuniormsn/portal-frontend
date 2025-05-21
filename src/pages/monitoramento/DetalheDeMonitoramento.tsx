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
  ISelectMonitoring,
  MonitoramentoService,
  driverScale,
} from "../../services/monitoramento/MonitoramentoService";
import {
  dateNow,
  isValidatedIntervalDates,
  keepDate,
  keepDateMinute,
  transformDate,
  transformStr,
  validatedDate,
} from "../../shared/utils/workingWithDates";
import {
  IVehicle,
  VehicleService,
} from "../../services/vehicle/VehicleService";
import searchIcon from "../../assets/icons/search.svg";
import checkCircleIcon from "../../assets/icons/check_circle.svg";
import checkCircleRedIcon from "../../assets/icons/check_circle_red.svg";
import InputMask from "react-input-mask";
import * as yup from "yup";
import { VTextField, VForm, useVForm, VSelect } from "../../shared/forms";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { FerramentasDeDetalhe } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks/UseDebounce";
import { IMonitoringCarForm } from "../../services/monitoramento/MonitoramentoService";
import { messageError } from "../../shared/utils/messages/messageError";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { ISelectStatus } from "../../services/manutencao/ManutencaoService";
import { useAuthContext } from "../../contexts";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { canAccess } from "../../shared/utils/canAccess";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { goBack } from "../../shared/utils/goBack";
import { doNotDelete } from "../../shared/utils/messages/doNotRun";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";
import { handleValidationFormErrors } from "../../shared/error/handleValidationFormErrors";

const formValidationSchema: yup.SchemaOf<IMonitoringCarForm> = yup
  .object()
  .shape({
    monitor_registration: yup
      .number()
      .required("Matrícula do monitor é obrigatória")
      .min(4, "Matrícula do monitor deve ter no mínimo 4 caracteres"),
    date_check: yup.string().required("Data do monitoramento é obrigatória"),
    car: yup.number().required("Veículo é obrigatório"),
    driver_registration: yup
      .number()
      .required("Matrícula do colaborador é obrigatória")
      .min(4, "Matrícula do colaborador deve ter no mínimo 4 caracteres"),
    date_occurrence: yup.string().required("Data da ocorrência é obrigatória"),
    ra_globus: yup.string().nullable(),
    video_path: yup.string().nullable(),
    comment: yup.string().nullable(),
    treatment: yup
      .string()
      .nullable()
      .min(10, "Tratativa deve ter no mínimo 10 caracteres"),
    inspector_registration: yup.number().nullable(),
    date_inspector: yup.string().nullable(),
    type_occurrence: yup.number().required("Tipo de ocorrência é obrigatório"),
    occurrence: yup.number().required("Ocorrência é obrigatória"),
    monitoring_status: yup.number().required(),
  });

export const DetalheDeMonitoramento: React.FC = () => {
  const { formRef, save, saveAndClose, isSaveAndClose } = useVForm();
  const { id = "nova" } = useParams<"id">();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [occurrence, setOccurrence] = useState<ISelectMonitoring[]>([]);
  const [status, setStatus] = useState<ISelectStatus[]>([]);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [currentStatus, setCurrentStatus] = useState(0);
  const [driver, setDriver] = useState<driverScale[]>([]);
  const [searchParams] = useSearchParams();
  const [occurrenceTypes, setOccurrenceTypes] = useState<ISelectMonitoring[]>(
    []
  );

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const MONITORING = 10;
  const AWAITING_MONITORING = 1;
  const AWAITING_INSPECTOR = 2;
  const COMPLETED = 3;
  const SEM_OCORRENCIA = 28;

  const search = useMemo(() => {
    return searchParams.get("search");
  }, [searchParams]);

  const change = useMemo(() => {
    return searchParams.get("change");
  }, [searchParams]);

  const cleanForm: IMonitoringCarForm = {
    monitor_registration: loggedUser.registration,
    date_check: keepDate(dateNow()),
    car: NaN,
    driver_registration: loggedUser.registration,
    date_occurrence: keepDate(dateNow()),
    ra_globus: "",
    video_path: "",
    comment: "",
    treatment: "",
    type_occurrence: NaN,
    occurrence: NaN,
    monitoring_status: AWAITING_MONITORING,
    date_inspector: "",
    inspector_registration: 0,
  };

  const payload = (data: IMonitoringCarForm) => {
    return {
      ...data,
      date_check: transformDate(data.date_check),
      date_occurrence: transformDate(data.date_occurrence),
      comment: data.comment ? data.comment : null,
      treatment: data.treatment ? data.treatment : null,
      ra_globus: data.ra_globus ? data.ra_globus : null,
      video_path: data.video_path ? data.video_path : null,
      date_inspector: data.date_inspector
        ? transformDate(data.date_inspector)
        : null,
      inspector_registration: data.inspector_registration
        ? data.inspector_registration
        : null,
      created_at: dateNow(),
      updated_at: null,
      vehicle: undefined,
      date_scale: undefined,
      id: undefined,
    };
  };

  const payloadUpdate = (data: IMonitoringCarForm) => {
    const newPayload = payload(data);
    return {
      ...newPayload,
      updated_at: dateNow(),
      created_at: undefined,
    };
  };

  const payloadApproved = (data: IMonitoringCarForm) => {
    const newPayload = payload(data);
    return {
      ...newPayload,
      monitoring_status:
        data.occurrence === SEM_OCORRENCIA ? COMPLETED : currentStatus + 1,
      updated_at: dateNow(),
      created_at: undefined,
    };
  };

  const payloadReproved = (data: IMonitoringCarForm) => {
    return {
      monitoring_status: currentStatus - 1,
      treatment: data.treatment,
      inspector_registration: data.inspector_registration
        ? data.inspector_registration
        : null,
      date_inspector: data.date_inspector
        ? transformDate(data.date_inspector)
        : null,
      updated_at: dateNow(),
    };
  };

  const handleSave = async (dados: IMonitoringCarForm) => {
    if (!canAccess(loggedUser.access_level, MONITORING)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    if (!isValidatedIntervalDates(dados.date_occurrence, dados.date_check)) {
      const errorMessage =
        "Data da ocorrência não pode ser maior que a data do monitoramento";
      formRef.current?.setFieldError("date_occurrence", errorMessage);
      return messageWarning(errorMessage);
    }

    try {
      setIsLoading(true);
      const validatedData = await formValidationSchema.validate(dados, {
        abortEarly: false,
      });
      if (id === "nova") {
        await MonitoramentoService.createMonitoringCar(
          payload(validatedData),
          accessToken
        );
      } else {
        await MonitoramentoService.updateMonitoringCar(
          Number(id),
          payloadUpdate(validatedData),
          accessToken
        );
      }
      messageSuccess("Registro salvo com sucesso!");
      if (isSaveAndClose()) {
        goBack();
      } else {
        if (id === "nova") formRef.current?.setData(cleanForm);
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

  const validatedMonitoringCar = (data: IMonitoringCarForm) => {
    const validations = [
      {
        field: "treatment",
        fn: (data: IMonitoringCarForm) => !!data.treatment,
        message: "O campo Tratativa por é obrigatório",
      },
      {
        field: "date_inspector",
        fn: (data: IMonitoringCarForm) => !!data.date_inspector,
        message: "O campo Data de verificação é obrigatório",
      },
      {
        field: "inspector_registration",
        fn: (data: IMonitoringCarForm) => !!data.inspector_registration,
        message: "O campo Verificado por é obrigatório",
      },
      {
        field: "date_inspector",
        fn: (data: IMonitoringCarForm) =>
          data.date_inspector == null || validatedDate(data.date_inspector),
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

    const data = formRef.current?.getData() as IMonitoringCarForm;

    if (!isValidatedIntervalDates(data.date_occurrence, data.date_check)) {
      const errorMessage =
        "Data da ocorrência não pode ser maior que a data do monitoramento";
      formRef.current?.setFieldError("date_occurrence", errorMessage);
      return messageWarning(errorMessage);
    }

    try {
      setIsLoading(true);
      await formValidationSchema.validate(data, {
        abortEarly: false,
      });
      if (currentStatus === AWAITING_INSPECTOR) validatedMonitoringCar(data);
      if (await confirmDialog()) {
        await MonitoramentoService.updateMonitoringCar(
          Number(id),
          payloadApproved(data),
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

    const data = formRef.current?.getData() as IMonitoringCarForm;

    try {
      setIsLoading(true);
      await formValidationSchema.validate(data, {
        abortEarly: false,
      });
      if (await confirmDialog()) {
        if (currentStatus === AWAITING_INSPECTOR) validatedMonitoringCar(data);
        await MonitoramentoService.updateStatusMonitoringCar(
          id,
          payloadReproved(data),
          accessToken
        );
        messageSuccess("Enviado com sucesso");
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

  const handleDelete = async (id: number, cod_department: number) => {
    if (!canAccess(loggedUser.access_level, cod_department))
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );

    if (currentStatus >= AWAITING_INSPECTOR) return doNotDelete();

    try {
      setIsLoading(true);
      if (await confirmDialog()) {
        await MonitoramentoService.deleteMonitoringCar(id, accessToken);
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

  const handleSearchDriver = async () => {
    setDriver([]);

    const date_scale = formRef.current?.getData().date_scale;

    const vehicle = formRef.current?.getData().vehicle;

    if (!date_scale || !vehicle) {
      return messageWarning("Campos obrigatórios não preenchidos.");
    }

    try {
      setIsLoading(true);
      const result = await MonitoramentoService.getDriver(
        transformStr(date_scale),
        vehicle,
        accessToken
      );
      if (result instanceof Error) throw result;
      setDriver(result);
      messageSuccess("Registro encontrado com sucesso!");
    } catch (error: any) {
      setDriver([]);
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    debounce(async () => {
      if (id === "nova") return formRef.current?.setData(cleanForm);

      try {
        setIsLoading(true);
        const result = await MonitoramentoService.getMonitoringCar(
          Number(id),
          accessToken
        );
        if (result instanceof Error) throw result;
        const transformResult = {
          ...result,
          date_check: keepDate(result.date_check),
          date_occurrence: keepDate(result.date_occurrence),
          date_inspector: keepDate(result.date_inspector),
          type_occurrence: result.type_occurrence[0].id,
          occurrence: result.occurrence[0].id,
          monitoring_status: result.monitoring_status[0].id,
        };
        formRef.current?.setData(transformResult);
        setCurrentStatus(transformResult.monitoring_status);
      } catch (error: any) {
        messageError(handleErrorMessage(error));
        goBack();
      } finally {
        setIsLoading(false);
      }
    });
  }, [id, reload]);

  useEffect(() => {
    debounce(async () => {
      try {
        setIsLoading(true);

        if (localStorage.getItem("monitoringOccurrenceTypes")) {
          setOccurrenceTypes(
            JSON.parse(
              localStorage.getItem("monitoringOccurrenceTypes") || "[]"
            )
          );
          setStatus(
            JSON.parse(localStorage.getItem("monitoringStatus") || "[]")
          );
          setOccurrence(
            JSON.parse(localStorage.getItem("monitoringOccurrence") || "[]")
          );
          setVehicles(JSON.parse(localStorage.getItem("vehicles") || "[]"));
          return;
        }

        const [
          monitoringOccurrenceTypes,
          monitoringStatus,
          monitoringOccurrence,
          monitoringVehicles,
        ] = await Promise.all([
          MonitoramentoService.getAllOccurrenceTypes(accessToken),
          MonitoramentoService.getAllMonitoringStatus(accessToken),
          MonitoramentoService.getAllOccurrence(accessToken),
          VehicleService.getAllVehicles(accessToken),
        ]);

        if (monitoringOccurrenceTypes instanceof Error)
          throw monitoringOccurrenceTypes;
        setOccurrenceTypes(monitoringOccurrenceTypes);
        localStorage.setItem(
          "monitoringOccurrenceTypes",
          JSON.stringify(monitoringOccurrenceTypes)
        );

        if (monitoringStatus instanceof Error) throw monitoringStatus;
        setStatus(monitoringStatus);
        localStorage.setItem(
          "monitoringStatus",
          JSON.stringify(monitoringStatus)
        );

        if (monitoringOccurrence instanceof Error) throw monitoringOccurrence;
        setOccurrence(monitoringOccurrence);
        localStorage.setItem(
          "monitoringOccurrence",
          JSON.stringify(monitoringOccurrence)
        );

        if (monitoringVehicles instanceof Error) throw monitoringVehicles;
        setVehicles(monitoringVehicles);
        localStorage.setItem("vehicles", JSON.stringify(monitoringVehicles));
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
          ? `Novo Monitoramento de Veículo`
          : search
          ? `Consulta Monitoramento de Veículo: ${
              formRef.current?.getData().car
            }`
          : `Alteração de Monitoramento de Veículo: ${
              formRef.current?.getData().car
            }`
      }
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarBotaoSalvar={id === "nova"}
          mostrarBotaoSalvarEFechar={!search && currentStatus !== 3}
          mostrarBotaoApagar={id !== "nova" && !search && currentStatus !== 3}
          mostrarBotaoLimpar={id === "nova" && !search}
          mostrarBotaoVoltar
          aoClicarEmSalvar={save}
          aoClicarEmSalvarEFechar={saveAndClose}
          aoClicarEmVoltar={() => goBack()}
          aoClicarEmApagar={() => handleDelete(Number(id), MONITORING)}
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
                        label="ID"
                        disabled
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={1.5}
                      lg={1.5}
                      xl={1.5}
                    >
                      <VSelect
                        fullWidth
                        name="car"
                        label="Veículos"
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
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
                      md={1.5}
                      lg={1.5}
                      xl={1.5}
                    >
                      <VTextField
                        fullWidth
                        name="monitor_registration"
                        label="Matrícula monitor"
                        placeholder="Matrícula do monitor"
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
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
                        name="date_check"
                        label="Data do monitoramento"
                        placeholder="DD/MM/YYYY"
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
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
                      md={1.5}
                      lg={1.5}
                      xl={1.5}
                    >
                      <VTextField
                        fullWidth
                        name="driver_registration"
                        label="Matrícula colaborador"
                        placeholder="Colaborador envolvido"
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
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
                          !!search || currentStatus >= AWAITING_INSPECTOR
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
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
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
                      md={8}
                      lg={8}
                      xl={8}
                    >
                      <VSelect
                        fullWidth
                        name="occurrence"
                        label="Ocorrências"
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
                        }
                      >
                        {occurrence.map((item) => (
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
                        name="type_occurrence"
                        label="Tipo de ocorrência"
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
                        }
                      >
                        {occurrenceTypes.map((item) => (
                          <MenuItem
                            key={item.id}
                            value={item.id}
                          >
                            {item.name}
                          </MenuItem>
                        ))}
                      </VSelect>
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
                      md={8}
                      lg={8}
                      xl={8}
                    >
                      <VTextField
                        fullWidth
                        name="video_path"
                        label="Endereço do vídeo"
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
                        }
                      />
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
                        name="monitoring_status"
                        label="Status"
                        disabled
                      >
                        {status.map((item) => (
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
                        disabled={
                          !!search || currentStatus >= AWAITING_INSPECTOR
                        }
                      />
                    </Grid>
                    {id === "nova" && (
                      <Grid
                        container
                        direction="row"
                        alignItems="center"
                        padding={2}
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
                          <VTextField
                            fullWidth
                            name="vehicle"
                            label="Veículo escalado"
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
                            name="date_scale"
                            label="Data da escala"
                            placeholder="DD/MM/YYYY"
                            InputProps={{
                              inputComponent: InputMask as any,
                              inputProps: {
                                mask: "99/99/9999",
                                maskChar: null,
                              },
                            }}
                          />
                        </Grid>
                        <Grid item>
                          <Button
                            color="primary"
                            variant="outlined"
                            onClick={() => handleSearchDriver()}
                            startIcon={<img src={searchIcon} />}
                            style={{ border: "3px solid" }}
                            disabled={currentStatus >= COMPLETED}
                          >
                            <Typography
                              variant="button"
                              whiteSpace="nowrap"
                              textOverflow="ellipsis"
                              overflow="hidden"
                            >
                              Busca escala
                            </Typography>
                          </Button>
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={12}
                          md={12}
                          lg={12}
                          xl={12}
                        >
                          {driver.map((item) => (
                            <Grid
                              container
                              direction="row"
                              border={1}
                              borderRadius={1}
                              padding={2}
                              mb={2}
                              borderColor="#c1c1c1"
                              key={item.id}
                            >
                              <Grid item>
                                <Typography fontSize={14}>
                                  {`Carro: ${Number(
                                    item.prefixoveic
                                  )} - Linha: ${
                                    item.nroficiallinha
                                  } - Saída: ${keepDateMinute(
                                    item.horasaidagaragem
                                  )}hs - Recolhe: ${keepDateMinute(
                                    item.horarecolhida
                                  )}hs`}
                                  {` - Chapa: ${Number(item.chapafunc)} - ${
                                    item.nomefunc
                                  } - Função: ${item.descfuncao}`}
                                </Typography>
                              </Grid>
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    )}
                    {id !== "nova" && (
                      <>
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
                            name="inspector_registration"
                            label="Matrícula inspetor"
                            disabled={
                              !!search || currentStatus !== AWAITING_INSPECTOR
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
                            name="date_inspector"
                            label="Data da tratativa"
                            placeholder="DD/MM/YYYY"
                            disabled={
                              !!search || currentStatus !== AWAITING_INSPECTOR
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
                          md={12}
                          lg={12}
                          xl={12}
                        >
                          <VTextField
                            fullWidth
                            name="treatment"
                            label="Tratativa"
                            multiline
                            rows={3}
                            disabled={
                              !!search || currentStatus !== AWAITING_INSPECTOR
                            }
                          />
                        </Grid>
                      </>
                    )}
                  </Grid>
                  <Grid
                    container
                    item
                    spacing={4}
                    display="flex"
                    direction="row"
                    justifyContent="end"
                  >
                    <Grid item>
                      {!!change && currentStatus >= AWAITING_INSPECTOR ? (
                        <Button
                          color="primary"
                          variant="outlined"
                          style={{ border: "3px solid" }}
                          onClick={() => handleReprove(Number(id), MONITORING)}
                          startIcon={<img src={checkCircleRedIcon} />}
                          disabled={currentStatus >= COMPLETED}
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
                          onClick={() => handleApprove(Number(id), MONITORING)}
                          startIcon={<img src={checkCircleIcon} />}
                          disabled={currentStatus === COMPLETED}
                        >
                          <Typography
                            variant="button"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                            overflow="hidden"
                          >
                            {currentStatus === AWAITING_MONITORING
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
