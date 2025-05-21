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
  IMaintenanceCarForm,
  ISelectMaintenance,
  ISelectStatus,
  ManutencaoService,
} from "../../services/manutencao/ManutencaoService";
import {
  dateNow,
  keepDate,
  keepDateHour,
  transformDate,
} from "../../shared/utils/workingWithDates";
import {
  IVehicle,
  VehicleService,
} from "../../services/vehicle/VehicleService";
import checkCircleIcon from "../../assets/icons/check_circle.svg";
import InputMask from "react-input-mask";
import * as yup from "yup";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { VTextField, VForm, useVForm, VSelect } from "../../shared/forms";
import { FerramentasDeDetalhe } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";
import { useDebounce } from "../../shared/hooks/UseDebounce";
import { useAuthContext } from "../../contexts";
import { confirmDialog } from "../../shared/utils/messages/confirmDialog";
import { messageError } from "../../shared/utils/messages/messageError";
import { messageSuccess } from "../../shared/utils/messages/messageSuccess";
import { messageWarning } from "../../shared/utils/messages/messageWarning";
import { goBack } from "../../shared/utils/goBack";
import { doNotDelete } from "../../shared/utils/messages/doNotRun";
import { canAccess } from "../../shared/utils/canAccess";
import { handleValidationFormErrors } from "../../shared/error/handleValidationFormErrors";
import { handleErrorMessage } from "../../shared/error/handleErrorMessage";

const formValidationSchema: yup.SchemaOf<IMaintenanceCarForm> = yup
  .object()
  .shape({
    car: yup.number().required(),
    date_maintenance: yup.string().required(),
    comments: yup.string().nullable(),
    types: yup.number().required(),
    details: yup.number().required(),
    status: yup.number().required(),
    approver: yup.number().nullable(),
  });

export const DetalheDeManutencao: React.FC = () => {
  const { formRef, save, saveAndClose, isSaveAndClose } = useVForm();
  const { id = "nova" } = useParams<"id">();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [types, setTypes] = useState<ISelectMaintenance[]>([]);
  const [details, setDetails] = useState<ISelectMaintenance[]>([]);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [status, setStatus] = useState<ISelectStatus[]>([]);
  const [currentStatus, setCurrentStatus] = useState(1);
  const [changeForm, setChangeForm] = useState(false);
  const [searchParams] = useSearchParams();

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const AWAITING_MAINTENANCE = 1;
  const APPROVED = 4;
  const MAINTENANCE = 14;

  const search = useMemo(() => {
    return searchParams.get("search");
  }, [searchParams]);

  const change = useMemo(() => {
    return searchParams.get("change");
  }, [searchParams]);

  const cleanForm = {
    car: NaN,
    date_maintenance: keepDate(
      new Date(new Date().setDate(new Date().getDate() + 1)).toISOString()
    ),
    comments: "",
    updated_at: keepDate(dateNow()),
    types: NaN,
    details: NaN,
    status: AWAITING_MAINTENANCE,
    approver: 0,
  };

  const payload = (data: IMaintenanceCarForm) => {
    return {
      ...data,
      date_maintenance: transformDate(data.date_maintenance),
      comments: data.comments ? data.comments : null,
      types: data.types,
      details: data.details,
      status: data.status,
      registration_source: loggedUser.registration,
      created_at: dateNow(),
      updated_at: null,
      approver: null,
    };
  };

  const payloadUpdate = (data: IMaintenanceCarForm) => {
    const newPayload = payload(data);
    return {
      ...newPayload,
      updated_at: dateNow(),
      created_at: undefined,
    };
  };

  const handleSave = async (dados: IMaintenanceCarForm) => {
    if (!canAccess(loggedUser.access_level, MAINTENANCE)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    try {
      setIsLoading(true);
      const validatedData = await formValidationSchema.validate(dados, {
        abortEarly: false,
      });
      if (id === "nova") {
        await ManutencaoService.createMaintenanceCar(
          payload(validatedData),
          accessToken
        );
      } else {
        await ManutencaoService.updateMaintenanceCar(
          Number(id),
          payloadUpdate(validatedData),
          accessToken
        );
        setChangeForm(false);
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

  const handleDelete = async (id: number) => {
    if (!canAccess(loggedUser.access_level, MAINTENANCE)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    if (currentStatus !== AWAITING_MAINTENANCE) doNotDelete();

    try {
      setIsLoading(true);
      if (await confirmDialog()) {
        await ManutencaoService.deleteMaintenanceCar(id, accessToken);
        messageSuccess("Registro excluído com sucesso!");
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

  const handleApprove = async (id: number) => {
    if (changeForm) {
      return messageWarning(
        "Salve suas alterações no formulário antes de seguir"
      );
    }

    if (!canAccess(loggedUser.access_level, MAINTENANCE)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    try {
      setIsLoading(true);
      if (await confirmDialog()) {
        await ManutencaoService.updateStatusMaintenanceCar(
          id,
          {
            status: APPROVED,
            updated_at: dateNow(),
            approver: loggedUser.registration,
          },
          accessToken
        );
        messageSuccess("Aprovado com sucesso");
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

  useEffect(() => {
    debounce(async () => {
      if (id === "nova") {
        return formRef.current?.setData(cleanForm);
      }

      try {
        setIsLoading(true);
        const result = await ManutencaoService.getMaintenanceCar(
          Number(id),
          accessToken
        );
        if (result instanceof Error) throw result;
        const transformResult = {
          ...result,
          date_maintenance: keepDate(result.date_maintenance),
          types: result.types[0].id,
          details: result.details[0].id,
          status: result.status[0].id,
          updated_at: keepDateHour(result.updated_at),
        };
        formRef.current?.setData(transformResult);
        setCurrentStatus(result.status[0].id);
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

        if (localStorage.getItem("maintenanceTypes")) {
          setTypes(
            JSON.parse(localStorage.getItem("maintenanceTypes") || "[]")
          );
          setStatus(
            JSON.parse(localStorage.getItem("maintenanceStatus") || "[]")
          );
          setDetails(
            JSON.parse(localStorage.getItem("maintenanceDetails") || "[]")
          );
          setVehicles(JSON.parse(localStorage.getItem("vehicles") || "[]"));
          return;
        }

        const [
          maintenanceTypes,
          maintenanceStatus,
          maintenanceDetails,
          maintenanceVehicles,
        ] = await Promise.all([
          ManutencaoService.getAllMaintenanceTypes(accessToken),
          ManutencaoService.getAllMaintenanceStatus(accessToken),
          ManutencaoService.getAllMaintenanceDetails(accessToken),
          VehicleService.getAllVehicles(accessToken),
        ]);

        if (maintenanceTypes instanceof Error) throw maintenanceTypes;
        setTypes(maintenanceTypes);
        localStorage.setItem(
          "maintenanceTypes",
          JSON.stringify(maintenanceTypes)
        );

        if (maintenanceStatus instanceof Error) throw maintenanceStatus;
        setStatus(maintenanceStatus);
        localStorage.setItem(
          "maintenanceStatus",
          JSON.stringify(maintenanceStatus)
        );

        if (maintenanceDetails instanceof Error) throw maintenanceDetails;
        setDetails(maintenanceDetails);
        localStorage.setItem(
          "maintenanceDetails",
          JSON.stringify(maintenanceDetails)
        );

        if (maintenanceVehicles instanceof Error) throw maintenanceVehicles;
        setVehicles(maintenanceVehicles);
        localStorage.setItem("vehicles", JSON.stringify(maintenanceVehicles));
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
          ? "Novo Pedido de Veículo"
          : search
          ? `Consulta de Pedido de Veículo: ${formRef.current?.getData().car}`
          : `Alteração de Pedido de Veículo: ${formRef.current?.getData().car}`
      }
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarBotaoSalvar={!search}
          aoClicarEmSalvar={save}
          mostrarBotaoSalvarEFechar={!search}
          aoClicarEmSalvarEFechar={saveAndClose}
          mostrarBotaoApagar={id !== "nova" && !search}
          mostrarBotaoLimpar={id === "nova" && !search}
          aoClicarEmApagar={() => handleDelete(Number(id))}
          mostrarBotaoVoltar
          aoClicarEmVoltar={() => goBack()}
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
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VSelect
                        fullWidth
                        name="car"
                        label="Veículos"
                        disabled={
                          !!search || currentStatus !== AWAITING_MAINTENANCE
                        }
                        onChange={() => setChangeForm(true)}
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
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="date_maintenance"
                        label="Data"
                        placeholder="DD/MM/YYYY"
                        disabled={
                          !!search || currentStatus !== AWAITING_MAINTENANCE
                        }
                        onChange={() => setChangeForm(true)}
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
                      md={4}
                      lg={4}
                      xl={4}
                    >
                      <VSelect
                        fullWidth
                        name="types"
                        label="Tipo de Manutenção"
                        disabled={
                          !!search || currentStatus !== AWAITING_MAINTENANCE
                        }
                        onChange={() => setChangeForm(true)}
                      >
                        {types.map((item) => (
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
                        name="status"
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
                      md={8}
                      lg={8}
                      xl={8}
                    >
                      <VSelect
                        fullWidth
                        name="details"
                        label="Detalhamento da Manutenção"
                        disabled={
                          !!search || currentStatus !== AWAITING_MAINTENANCE
                        }
                        onChange={() => setChangeForm(true)}
                      >
                        {details.map((item) => (
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
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="approver"
                        label="Aprovador"
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
                      <VTextField
                        fullWidth
                        name="registration_source"
                        label="Operador"
                        disabled
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
                      <VTextField
                        fullWidth
                        name="comments"
                        label="Comentários"
                        multiline
                        disabled={!!search}
                        onChange={() => setChangeForm(true)}
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
                      <VTextField
                        fullWidth
                        name="updated_at"
                        label="Última Alteração"
                        disabled
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
                    {/* <Grid item>
                      {!!change && (
                        <Button
                          color="primary"
                          variant="outlined"
                          onClick={() => handleReprove(Number(id))}
                          startIcon={<Icon>unpublished</Icon>}
                          style={{ border: "3px solid" }}
                          disabled={currentStatus >= APPROVED}
                        >
                          <Typography
                            variant="button"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                            overflow="hidden"
                          >
                            Cancelar
                          </Typography>
                        </Button>
                      )}
                    </Grid> */}
                    <Grid item>
                      {!!change && (
                        <Button
                          color="primary"
                          variant="contained"
                          onClick={() => handleApprove(Number(id))}
                          startIcon={<img src={checkCircleIcon} />}
                          disabled={currentStatus >= APPROVED}
                        >
                          <Typography
                            variant="button"
                            whiteSpace="nowrap"
                            textOverflow="ellipsis"
                            overflow="hidden"
                          >
                            Aprovar
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
