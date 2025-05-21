import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";
import {
  ISelectUser,
  IUser,
  IUserForm,
  RegistroUsuarioService,
} from "../../../services/users/registro-usuario/RegistroUsuarioService";
import {
  formatCpf,
  formatPhone,
  onlyNumbers,
} from "../../../shared/utils/formatStrings";
import passwordIcon from "../../../assets/icons/password.svg";
import passwordErrorIcon from "../../../assets/icons/password-error.svg";
import InputMask from "react-input-mask";
import CryptoJS from "crypto-js";
import { useEffect, useState, useMemo } from "react";
import { VTextField, VForm, useVForm, VSelect } from "../../../shared/forms";
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
import SelectionModal, {
  ItemModal,
} from "../../../shared/components/modal/SelectionModal";

export const RegistroUsuario: React.FC = () => {
  const { formRef } = useVForm();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [checkPassword, setCheckPassword] = useState("");
  const [photoBase64, setPhotoBase64] = useState("");
  const [departments, setDepartments] = useState<ISelectUser[]>([]);

  const [completedListUser, setCompletedListUser] = useState<IUser[]>([]);
  const [listModal, setListModal] = useState<ItemModal[]>([]);
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const DIGITS_PASSWORD = 6;
  const RH = 17;

  const busca = useMemo(() => {
    return searchParams.get("busca") || "";
  }, [searchParams]);

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const cleanForm = {
    registration: NaN,
    access_group: "",
    department: "",
    name_main_department: "",
    access_level: '[{"dpto": number, "level": number}]',
    name: "",
    cpf: "",
    mother_name: "",
    updated_at: "",
    phone: "",
    password: "",
    occurrence: "",
    email: "",
  };
  const handleClean = () => {
    formRef.current?.setData(cleanForm);
    formRef.current?.setErrors({} as any);
    setNewPassword("");
    setCheckPassword("");
    setPhotoBase64("");
  };

  const handleFilter = async (busca: string) => {
    if (!busca || isNaN(Number(busca)))
      return messageWarning("Informe uma matrícula válida, por favor...");

    try {
      setIsLoading(true);

      const result = await RegistroUsuarioService.getByRegistration(
        busca,
        accessToken
      );

      if (result instanceof Error) throw result;

      const transformResult = {
        ...result,
        cpf: formatCpf(result.cpf),
        updated_at: keepDateHour(result.updated_at),
        phone: formatPhone(result.phone),
        access_level: JSON.stringify(result.access_level),
        department: result.department[0],
      };

      formRef.current?.setData(transformResult);

      setPhotoBase64("");
      setSearchParams(`busca=${busca}&reload=${reload}`, { replace: true });
    } catch (error: any) {
      handleClean();
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const setUserForm = (user: IUser) => {
    const transformResult = {
      ...user,
      cpf: formatCpf(user.cpf),
      updated_at: keepDateHour(user.updated_at),
      phone: formatPhone(user.phone),
      access_level: JSON.stringify(user.access_level),
      department: user.department[0],
    };

    setPhotoBase64("");
    formRef.current?.setData(transformResult);
  };

  const handleSelectedUser = (id: number) => {
    setUserForm(completedListUser.filter((item) => item.id === id)[0]);
  };

  const handleFilterName = async (busca: string) => {
    if (!busca || (!isNaN(parseFloat(busca)) && isFinite(Number(busca))))
      return messageWarning("Informe um nome válido, por favor...");

    try {
      setIsLoading(true);

      const result = await RegistroUsuarioService.getByRegistrationByName(
        busca,
        accessToken
      );

      if (result instanceof Error) throw result;

      if (result.length === 1) {
        setUserForm(result[0]);
      } else {
        handleOpen();
        setCompletedListUser(result);
        setListModal(
          result
            .filter((item) => item.id !== undefined)
            .map((item) => ({ id: item.id as number, name: item.name }))
        );
      }
    } catch (error: any) {
      handleClean();
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const payload = (data: IUserForm) => {
    try {
      const password_hash = CryptoJS.MD5(
        formRef.current?.getData().password
      ).toString();
      return {
        registration: data.registration,
        name: data.name.toUpperCase(),
        mother_name: data.mother_name.toUpperCase(),
        email: data.email,
        cpf: onlyNumbers(data.cpf),
        phone: onlyNumbers(data.phone),
        password: password_hash,
        checking: undefined,
        department: [data.department],
        name_main_department:
          departments.filter((e) => e.id === data.department)[0].name || "",
        access_level: JSON.parse(data.access_level),
        access_group: Number(data.access_group),
        occurrence: data.occurrence ? data.occurrence : null,
        last_modified_by: loggedUser.registration,
        created_at: dateNow(),
        updated_at: null,
      };
    } catch (error: any) {
      throw new Error(
        `Houve um erro de validação, verifique todos os dados: ${error.message}`
      );
    }
  };

  const payloadUpdate = (data: IUserForm) => {
    const dados = payload(data);
    return {
      ...dados,
      created_at: undefined,
      updated_at: dateNow(),
    };
  };

  const handleSave = async () => {
    if (!canAccess(loggedUser.access_level, RH)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    const data = formRef.current?.getData() as IUserForm;

    if (
      !data.registration ||
      !data.cpf ||
      !data.email ||
      !data.name ||
      !data.mother_name ||
      !data.phone ||
      !data.department ||
      !data.access_group
    ) {
      return messageWarning("Preencha todos os campos obrigatórios.");
    }

    if (
      checkPassword.length !== DIGITS_PASSWORD ||
      checkPassword !== newPassword
    ) {
      return messageWarning("Verifique sua senha por favor");
    }

    try {
      setIsLoading(true);

      if (busca) {
        await RegistroUsuarioService.updateUser(
          Number(data.id),
          payloadUpdate(data),
          accessToken
        );
      } else {
        await RegistroUsuarioService.register(payload(data), accessToken);
      }

      messageSuccess("Registro salvo com sucesso!");
      handleClean();
      setSearchParams({}, { replace: true });
    } catch (error: any) {
      setNewPassword("");
      setCheckPassword("");
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserIntegration = async (busca: string) => {
    if (!busca) return messageWarning("Informe a matrícula, por favor...");

    try {
      setIsLoading(true);

      const result = await RegistroUsuarioService.getUserIntegration(
        busca,
        accessToken
      );

      if (result instanceof Error) throw result;

      const transformResult = {
        registration: Number(result.chapafunc),
        name: result.nome_func?.toUpperCase(),
        mother_name: result.nome_mae?.toUpperCase(),
        phone: onlyNumbers(result.telefone),
        cpf: onlyNumbers(result.cpf),
        email: result.email,
        last_modified_by: loggedUser.registration,
        created_at: dateNow(),
        updated_at: null,
      };

      setPhotoBase64(result.base64);
      setNewPassword("");
      setCheckPassword("");

      formRef.current?.setData(transformResult);

      setSearchParams(`busca=&reload=${reload}`, { replace: true });
    } catch (error: any) {
      handleClean();
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

        setDepartments(result);
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
      titulo={"Registro de Usuário"}
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarInputBusca
          placeholderDaBusca="Busca por ..."
          labelBotaoDaBusca="Chapa"
          aoClicarEmBotaoDaBusca={(busca) => handleFilter(busca)}
          mostrarBotaoBuscaNome
          aoClicarEmBotaoDaBuscaNome={(busca) => handleFilterName(busca)}
          mostrarBotaoSalvar
          mostrarBotaoLimpar
          aoClicarEmSalvar={handleSave}
          mostrarBotaoIntegração
          aoClicarEmBotaoIntegração={(busca) => handleUserIntegration(busca)}
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
                  <SelectionModal
                    open={open}
                    onClose={handleClose}
                    onSelect={(id) => handleSelectedUser(id)}
                    items={listModal}
                  />
                  <Grid item>
                    <Typography variant="h6">Detalhamento</Typography>
                  </Grid>
                  <Grid
                    container
                    item
                    direction="column"
                    spacing={2}
                  >
                    {photoBase64 && (
                      <CardMedia
                        component="img"
                        height={250}
                        image={photoBase64}
                        alt="logomarca ETT"
                        sx={{ objectFit: "contain" }}
                      />
                    )}
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
                        name="registration"
                        label="Matrícula"
                        placeholder="04 dígitos"
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      sm={12}
                      md={6}
                      lg={6}
                      xl={6}
                    >
                      <VTextField
                        fullWidth
                        name="name"
                        label="Nome"
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      sm={12}
                      md={3}
                      lg={3}
                      xl={3}
                    >
                      <VTextField
                        fullWidth
                        name="updated_at"
                        label="Última alteração"
                        disabled
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={3}
                      lg={3}
                      xl={3}
                    >
                      <VTextField
                        fullWidth
                        name="cpf"
                        label="CPF"
                        placeholder="mínimo de 10 dígitos (números)"
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={3}
                      lg={3}
                      xl={3}
                    >
                      <VTextField
                        fullWidth
                        name="phone"
                        label="Telefone"
                        placeholder="11 dígitos (números)"
                        InputProps={{
                          inputComponent: InputMask as any,
                          inputProps: {
                            mask: "(99) 99999-9999",
                            maskChar: null,
                          },
                        }}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={5}
                      lg={5}
                      xl={5}
                    >
                      <VTextField
                        fullWidth
                        name="access_level"
                        label="Acesso e nível de acesso"
                      />
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
                        name="access_group"
                        label="Grupo acesso"
                        placeholder="mínimo de 1 dígito (número)"
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={5}
                      lg={5}
                      xl={5}
                    >
                      <VTextField
                        fullWidth
                        name="mother_name"
                        label="Nome da Mãe"
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={3}
                      lg={3}
                      xl={3}
                    >
                      <VTextField
                        fullWidth
                        name="email"
                        label="E-Mail"
                        placeholder="email@address.com"
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
                        name="department"
                        label="Departamento Principal"
                      >
                        {departments.map((item) => (
                          <MenuItem
                            key={item.id}
                            value={item.id}
                          >
                            {`${item.name} - ${item.id}`}
                          </MenuItem>
                        ))}
                      </VSelect>
                    </Grid>
                  </Grid>
                  <Grid
                    container
                    item
                    direction="row"
                    alignItems="center"
                    spacing={2}
                  >
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={6}
                      lg={6}
                      xl={6}
                    >
                      <VTextField
                        fullWidth
                        name="password"
                        label="Nova senha"
                        placeholder="06 dígitos"
                        type="password"
                        disabled={isLoading}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </Grid>
                    <Grid
                      item
                      sm={12}
                      md={6}
                      lg={6}
                      xl={6}
                    >
                      {newPassword.length === 6 ? (
                        <Box
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          gap={2}
                        >
                          <img src={passwordIcon} />
                          <Typography variant="body1">
                            {newPassword.length} dígito(s)
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          gap={2}
                        >
                          <img src={passwordErrorIcon} />
                          <Typography variant="body1">
                            {newPassword.length} dígito(s)
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                  <Grid
                    container
                    item
                    direction="row"
                    alignItems="center"
                    spacing={2}
                  >
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={6}
                      lg={6}
                      xl={6}
                    >
                      <VTextField
                        fullWidth
                        name="checking"
                        label="Verificação da nova senha"
                        placeholder="06 dígitos"
                        type="password"
                        onChange={(e) => setCheckPassword(e.target.value)}
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      sm={12}
                      md={6}
                      lg={6}
                      xl={6}
                    >
                      {checkPassword.length === 6 &&
                      checkPassword === newPassword ? (
                        <Box
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          gap={2}
                        >
                          <img src={passwordIcon} />
                          <Typography variant="body1">
                            Senha confere! Obrigado.
                          </Typography>
                        </Box>
                      ) : (
                        <Box
                          display="flex"
                          flexDirection="row"
                          alignItems="center"
                          gap={2}
                        >
                          <img src={passwordErrorIcon} />
                          <Typography variant="body1">
                            Senha não confere!
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                  <Grid
                    container
                    item
                    xs={12}
                    sm={12}
                    md={12}
                    lg={12}
                    xl={12}
                  >
                    <VTextField
                      fullWidth
                      name="occurrence"
                      label="Ocorrência"
                      disabled={false}
                    />
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
