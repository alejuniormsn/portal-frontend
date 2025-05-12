import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  ListItemButton,
  Paper,
  Typography,
} from "@mui/material";
import { useEffect, useState, useMemo } from "react";
import { VTextField, VForm, useVForm } from "../../../shared/forms";
import { FerramentasDeDetalhe } from "../../../shared/components";
import { LayoutBaseDePagina } from "../../../shared/layouts";
import { useDebounce } from "../../../shared/hooks";
import { dateNow, keepDateHour } from "../../../shared/utils/workingWithDates";
import { messageError } from "../../../shared/utils/messages/messageError";
import { messageSuccess } from "../../../shared/utils/messages/messageSuccess";
import { useAuthContext } from "../../../contexts";
import { useSearchParams } from "react-router-dom";
import { messageWarning } from "../../../shared/utils/messages/messageWarning";
import { handleErrorMessage } from "../../../shared/error/handleErrorMessage";
import { canAccess } from "../../../shared/utils/canAccess";
import { List, ListItem, ListItemText, IconButton } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  IDepartment,
  RegistroUsuarioService,
} from "../../../services/users/registro-usuario/RegistroUsuarioService";
import {
  AccessGroupService,
  IAccessGroup,
} from "../../../services/users/access-group/AccessGroupService";
import { confirmDialog } from "../../../shared/utils/messages/confirmDialog";

export const GrupoDeAcesso: React.FC = () => {
  const { formRef } = useVForm();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [availableOptions, setAvailableOptions] = useState<IDepartment[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<IDepartment[]>([]);
  const [selectedAvailable, setSelectedAvailable] =
    useState<IDepartment | null>(null);
  const [selectedSelected, setSelectedSelected] = useState<IDepartment | null>(
    null
  );

  const RH = 17;

  const busca = useMemo(() => {
    return searchParams.get("busca") || "";
  }, [searchParams]);

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const handleClean = () => {
    formRef.current?.setErrors({} as any);
    setSelectedOptions([]);
    formRef.current?.setData({
      id: NaN,
      access_group: "",
      group_name: "",
      created_at: "",
      updated_at: "",
    });
  };

  const handleMoveToSelected = () => {
    if (selectedAvailable !== null) {
      setAvailableOptions((prev) =>
        prev.filter((opt) => opt.id !== selectedAvailable.id)
      );
      setSelectedOptions((prev) =>
        !prev.some((opt) => opt.id === selectedAvailable.id)
          ? [...prev, selectedAvailable]
          : prev
      );
      setSelectedAvailable(null);
    }
  };

  const handleMoveToAvailable = () => {
    if (selectedSelected !== null) {
      setSelectedOptions((prev) =>
        prev.filter((opt) => opt.id !== selectedSelected.id)
      );
      setAvailableOptions((prev) =>
        !prev.some((opt) => opt.id === selectedSelected.id)
          ? [...prev, selectedSelected]
          : prev
      );
      setSelectedSelected(null);
    }
  };

  const relateDepartmentsWithGroup = (
    accessGroup: IAccessGroup,
    departments: IDepartment[]
  ): IDepartment[] => {
    const groupDepartmentIds = new Set(
      accessGroup.group.map((item) => item.department_id)
    );
    const relatedDepartments = departments.filter((department) => {
      return groupDepartmentIds.has(department.id);
    });
    return relatedDepartments;
  };

  const handleFilter = async (busca: string) => {
    if (!busca)
      return messageWarning(
        "Informe o número do grupo de acesso, por favor..."
      );

    try {
      setIsLoading(true);

      const result = await AccessGroupService.getGroupsByGroup(Number(busca));

      if (result instanceof Error) throw result;

      const transformResult = {
        ...result,
        updated_at: keepDateHour(result.updated_at),
        created_at: keepDateHour(result.created_at),
      };

      formRef.current?.setData(transformResult);

      setSelectedOptions(relateDepartmentsWithGroup(result, availableOptions));
    } catch (error: any) {
      handleClean();
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const payloadGroupUpdate = (data: IAccessGroup) => {
    return {
      access_group: data.access_group,
      group_name: data.group_name,
      updated_at: dateNow(),
      group: selectedOptions.map((item) => {
        return {
          department_id: item.id,
          icon: item.access.icon,
          path: item?.access?.path ?? null,
          label: item.access.label,
          subItems: item.access.subItems?.map((subItem) => {
            return {
              to: subItem.to,
              icon: subItem.icon,
              label: subItem.label,
            };
          }),
        };
      }),
    };
  };

  const payloadGroup = (data: IAccessGroup) => {
    return {
      ...payloadGroupUpdate(data),
      created_at: dateNow(),
      updated_at: undefined,
    };
  };

  const handleSave = async () => {
    if (!canAccess(loggedUser.access_level, RH)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    try {
      setIsLoading(true);

      const data = formRef.current?.getData() as IAccessGroup;
      const groupId = formRef.current?.getData().id;

      if (!data.access_group) {
        const errorMessage = "Número do grupo é obrigatório";
        return formRef.current?.setFieldError("access_group", errorMessage);
      }

      if (!data.group_name) {
        const errorMessage = "Nome do grupo é obrigatório";
        return formRef.current?.setFieldError("group_name", errorMessage);
      }

      if (!selectedOptions.length) {
        return messageWarning(
          "Pelo menos uma das Opções Disponíveis é obrigatória"
        );
      }

      if (busca) {
        const result = await AccessGroupService.updateGroup(
          groupId,
          payloadGroupUpdate(data),
          accessToken
        );

        if (result instanceof Error) throw result;

        messageSuccess("Registro alterado com sucesso!");

        handleClean();
      } else {
        const result = await AccessGroupService.createGroup(
          payloadGroup(data),
          accessToken
        );

        if (result instanceof Error) throw result;

        messageSuccess("Registro salvo com sucesso!");

        handleClean();
      }
    } catch (error: any) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canAccess(loggedUser.access_level, RH)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    const id = formRef.current?.getData().id;

    if (!id) return messageWarning("Primeiro busque um grupo para deletar.");

    try {
      setIsLoading(true);

      if (await confirmDialog()) {
        await AccessGroupService.deleteGroup(Number(id), accessToken);
        messageSuccess("Grupo excluído com sucesso!");
        handleClean();
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
      try {
        setIsLoading(true);

        const result = await RegistroUsuarioService.getAllDepartments(
          accessToken
        );

        if (result instanceof Error) throw result;

        setAvailableOptions(result);

        handleClean();
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  }, [reload]);

  return (
    <LayoutBaseDePagina
      titulo={"Grupo de Acessos aos Módulos do Portal"}
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarInputBusca
          placeholderDaBusca="Busca o grupo..."
          aoClicarEmBotaoDaBusca={(busca) => handleFilter(busca)}
          mostrarBotaoLimpar
          mostrarBotaoSalvar
          aoClicarEmSalvar={handleSave}
          mostrarBotaoApagar
          aoClicarEmApagar={handleDelete}
        />
      }
    >
      <Box ml={2}>
        <Card>
          <CardContent>
            <VForm
              ref={formRef}
              onSubmit={handleSave}
            >
              <Box
                margin={1}
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
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="access_group"
                        label="Número do Grupo"
                        placeholder="número do grupo"
                        disabled={false}
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      sm={12}
                      md={5}
                      lg={5}
                      xl={5}
                    >
                      <VTextField
                        fullWidth
                        name="group_name"
                        label="Nome"
                        placeholder="nome do grupo"
                        disabled={false}
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="created_at"
                        label="Data de Criação"
                        disabled
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      sm={12}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="updated_at"
                        label="Última alteração"
                        disabled
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Box sx={{ padding: 2 }}>
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                  >
                    <Grid
                      item
                      xs={5}
                    >
                      <Paper
                        variant="outlined"
                        sx={{ padding: 2, maxHeight: 250, overflowY: "auto" }}
                      >
                        <Typography variant="h6">Opções Disponíveis</Typography>
                        <List>
                          {availableOptions.map((option) => (
                            <ListItem
                              key={option.id}
                              disablePadding
                            >
                              <ListItemButton
                                selected={selectedAvailable?.id === option.id}
                                onClick={() => setSelectedAvailable(option)}
                              >
                                <ListItemText primary={option.name} />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Grid>

                    <Grid
                      item
                      xs={2}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <IconButton
                        onClick={handleMoveToSelected}
                        disabled={selectedAvailable === null}
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                      <IconButton
                        onClick={handleMoveToAvailable}
                        disabled={selectedSelected === null}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    </Grid>

                    <Grid
                      item
                      xs={5}
                    >
                      <Paper
                        variant="outlined"
                        sx={{ padding: 2, maxHeight: 250, overflowY: "auto" }}
                      >
                        <Typography variant="h6">
                          Opções Selecionadas
                        </Typography>
                        <List>
                          {selectedOptions.map((option) => (
                            <ListItem
                              key={option.id}
                              disablePadding
                            >
                              <ListItemButton
                                selected={selectedSelected?.id === option.id}
                                onClick={() => setSelectedSelected(option)}
                              >
                                <ListItemText primary={option.name} />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </VForm>
          </CardContent>
        </Card>
      </Box>
    </LayoutBaseDePagina>
  );
};
