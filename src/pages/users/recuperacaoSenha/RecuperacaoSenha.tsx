import {
  Box,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import {
  IUserPasswdForm,
  RecuperacaoSenhaService,
} from "../../../services/users/recuperacao-senha/RecuperacaoSenhaService";
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
import { VTextField, VForm, useVForm } from "../../../shared/forms";
import { FerramentasDeDetalhe } from "../../../shared/components";
import { LayoutBaseDePagina } from "../../../shared/layouts";
import { useDebounce } from "../../../shared/hooks";
import { useSearchParams } from "react-router-dom";
import { dateNow, keepDate } from "../../../shared/utils/workingWithDates";
import { messageError } from "../../../shared/utils/messages/messageError";
import { messageSuccess } from "../../../shared/utils/messages/messageSuccess";
import { useAuthContext } from "../../../contexts";
import { messageWarning } from "../../../shared/utils/messages/messageWarning";
import { handleErrorMessage } from "../../../shared/error/handleErrorMessage";
import { canAccess } from "../../../shared/utils/canAccess";

export const RecuperacaoSenha: React.FC = () => {
  const { formRef } = useVForm();
  const { accessToken } = useAuthContext();
  const { loggedUser } = useAuthContext();
  const { debounce } = useDebounce();
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [checkPassword, setCheckPassword] = useState("");

  const PLANTAO = 11;

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const cleanForm = {
    id: 0,
    registration: NaN,
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
    setNewPassword("");
    setCheckPassword("");
    formRef.current?.setData(cleanForm);
    formRef.current?.setErrors({} as any);
  };

  const handleFilter = async (busca: string) => {
    if (!busca) return messageWarning("Verifique sua busca...");

    debounce(async () => {
      try {
        setIsLoading(true);
        const result = await RecuperacaoSenhaService.getByRegistration(
          busca,
          accessToken
        );

        if (result instanceof Error) throw result;

        const payload = {
          ...result,
          cpf: formatCpf(result.cpf || ""),
          updated_at: keepDate(result.updated_at || ""),
          phone: formatPhone(result.phone || ""),
        };

        formRef.current?.setData(payload);
      } catch (error: any) {
        messageError(handleErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    });
  };

  const hashPassword = (password: string) => CryptoJS.MD5(password).toString();

  const validateForm = () => {
    const check = checkPassword.length === 6 && checkPassword === newPassword;

    if (!formRef.current?.getData().id || !check) {
      return false;
    } else {
      return true;
    }
  };

  const handleSave = async () => {
    if (!canAccess(loggedUser.access_level, PLANTAO)) {
      return messageWarning(
        "Você precisa de privilégios elevados para executar está ação"
      );
    }

    if (!validateForm()) return messageError("Verifique os dados e senha...");

    try {
      setIsLoading(true);

      let payload: IUserPasswdForm;

      const form = formRef.current?.getData();

      if (form) {
        payload = {
          occurrence: form.occurrence ?? null,
          last_modified_by: loggedUser.registration,
          password: hashPassword(form.password),
          email: form.email ?? null,
          phone: onlyNumbers(form.phone),
          updated_at: dateNow(),
        };
      } else {
        throw new Error("Algo de errado com o formulário");
      }

      await RecuperacaoSenhaService.updatePassword(
        form.id,
        payload,
        accessToken
      );

      messageSuccess("Salvo com sucesso");

      handleClean();
    } catch (error) {
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleClean();
  }, [reload]);

  return (
    <LayoutBaseDePagina
      titulo={"Recuperação de Senha do Usuário"}
      barraDeFerramentas={
        <FerramentasDeDetalhe
          mostrarInputBusca
          placeholderDaBusca="Busca por chapa..."
          aoClicarEmBotaoDaBusca={(busca) => handleFilter(busca)}
          mostrarBotaoLimpar
          mostrarBotaoSalvar
          aoClicarEmSalvar={handleSave}
        />
      }
    >
      <Box ml={2}>
        <Card>
          <CardContent>
            <VForm
              ref={formRef}
              onSubmit={() => null}
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
                      xs={6}
                      sm={6}
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
                      xs={6}
                      sm={6}
                      md={2}
                      lg={2}
                      xl={2}
                    >
                      <VTextField
                        fullWidth
                        name="registration"
                        label="Matrícula"
                        disabled
                      />
                    </Grid>
                    <Grid
                      container
                      item
                      xs={12}
                      sm={12}
                      md={9}
                      lg={9}
                      xl={9}
                    >
                      <VTextField
                        fullWidth
                        name="name"
                        label="Nome"
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
                        disabled
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
                      <VTextField
                        fullWidth
                        name="phone"
                        label="Telefone"
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
                      md={9}
                      lg={9}
                      xl={9}
                    >
                      <VTextField
                        fullWidth
                        name="mother_name"
                        label="Nome da Mãe"
                        disabled
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
                        label="Última alteração da senha"
                        disabled
                      />
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
                        type="password"
                        placeholder="Insira sua senha"
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
                        type="password"
                        placeholder="Insira a mesma senha novamente"
                        disabled={isLoading}
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
                      disabled={isLoading}
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
