import {
  Box,
  Button,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Theme,
  Typography,
  useMediaQuery,
} from "@mui/material";
import filterIcon from "../../../assets/icons/filter.svg";
import restartIcon from "../../../assets/icons/restart_alt.svg";
import saveIcon from "../../../assets/icons/save.svg";
import deleteIcon from "../../../assets/icons/delete.svg";
import addIcon from "../../../assets/icons/add.svg";
import westIcon from "../../../assets/icons/west.svg";
import convertIcon from "../../../assets/icons/convert.svg";
import searchIcon from "../../../assets/icons/search.svg";
import integrationIcon from "../../../assets/icons/integration.svg";
import checkCircleRedIcon from "../../../assets/icons/check_circle_red.svg";
import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useVForm, VForm, VSelect } from "../../forms";

interface ISelect {
  id: number;
  name?: string;
}

interface IFerramentasDeDetalheProps {
  mostrarBotaoApagar?: boolean;
  aoClicarEmApagar?: () => void;
  mostrarBotaoSalvar?: boolean;
  aoClicarEmSalvar?: () => void;
  mostrarBotaoSalvarEFechar?: boolean;
  aoClicarEmSalvarEFechar?: () => void;
  mostrarBotaoVoltar?: boolean;
  aoClicarEmVoltar?: () => void;
  placeholderDaBusca?: string;
  labelBotaoDaBusca?: string;
  mostrarInputBusca?: boolean;
  aoClicarEmBotaoDaBusca?: (busca: string) => void;
  mostrarBotaoBuscaNome?: boolean;
  aoClicarEmBotaoDaBuscaNome?: (busca: string) => void;
  mostrarBotaoLimpar?: boolean;
  mostrarBotaoNovo?: boolean;
  aoClicarEmNovo?: () => void;
  arrayNovoSelect?: ISelect[];
  mostrarInputNovoSelect?: boolean;
  aoClicarEmNovoSelect?: (inputNovo: string) => void;
  mostrarBotaoIntegração?: boolean;
  aoClicarEmBotaoIntegração?: (busca: string) => void;
  mostrarBotaoFinalizarChamado?: boolean;
  aoClicarEmBotaoFinalizarChamado?: (busca: string) => void;
}
export const FerramentasDeDetalhe: React.FC<IFerramentasDeDetalheProps> = ({
  mostrarBotaoApagar = false,
  aoClicarEmApagar,
  mostrarBotaoSalvar = true,
  aoClicarEmSalvar,
  mostrarBotaoSalvarEFechar = false,
  aoClicarEmSalvarEFechar,
  mostrarBotaoVoltar = false,
  aoClicarEmVoltar,
  mostrarBotaoNovo = false,
  aoClicarEmNovo,
  placeholderDaBusca = "busca...",
  labelBotaoDaBusca = "Filtrar",
  mostrarInputBusca = false,
  aoClicarEmBotaoDaBusca: filtroDaBusca,
  mostrarBotaoBuscaNome = false,
  aoClicarEmBotaoDaBuscaNome: filtroDaBuscaNome,
  mostrarBotaoLimpar,
  arrayNovoSelect,
  mostrarInputNovoSelect = false,
  aoClicarEmNovoSelect,
  mostrarBotaoIntegração = false,
  aoClicarEmBotaoIntegração,
  mostrarBotaoFinalizarChamado = false,
  aoClicarEmBotaoFinalizarChamado,
}) => {
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const [busca, setBusca] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const [inputNovo, setInputNovo] = useState("");
  const { formRef } = useVForm();

  const reload = useMemo(() => {
    return searchParams.get("reload") || "";
  }, [searchParams]);

  const handleClean = () => {
    setSearchParams(
      {
        busca: "",
        dataInicio: "",
        dataFim: "",
        reload: reload === "true" ? "false" : "true",
      },
      { replace: true }
    );
    setBusca("");
  };

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  return (
    <Box
      marginX={2}
      padding={1.5}
      paddingX={2}
      mb={2}
      component={Paper}
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
    >
      <Box
        display="flex"
        gap={2}
        flexDirection="row"
        flexWrap="wrap"
      >
        {mostrarInputBusca && (
          <>
            <TextField
              size="small"
              inputRef={passwordRef}
              value={busca}
              placeholder={placeholderDaBusca}
              onChange={(e) => setBusca?.(e.target.value)}
              InputProps={
                !smDown || !mdDown
                  ? {
                      startAdornment: (
                        <InputAdornment position="start">
                          <img src={searchIcon} />
                        </InputAdornment>
                      ),
                    }
                  : undefined
              }
            />
            <Button
              color="primary"
              variant="contained"
              onClick={() => filtroDaBusca?.(busca)}
              startIcon={<img src={filterIcon} />}
              style={{ height: "40px" }}
            >
              <Typography
                variant="button"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {labelBotaoDaBusca}
              </Typography>
            </Button>
          </>
        )}
        {mostrarBotaoBuscaNome && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => filtroDaBuscaNome?.(busca)}
            startIcon={<img src={filterIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Nome
            </Typography>
          </Button>
        )}
        {mostrarBotaoSalvar && (
          <Button
            color="primary"
            variant="contained"
            onClick={aoClicarEmSalvar}
            startIcon={<img src={saveIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Salvar
            </Typography>
          </Button>
        )}
        {mostrarBotaoSalvarEFechar && (
          <Button
            color="primary"
            variant="contained"
            onClick={aoClicarEmSalvarEFechar}
            startIcon={<img src={saveIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Salvar e fechar
            </Typography>
          </Button>
        )}

        {mostrarBotaoLimpar && (
          <Button
            color="primary"
            variant="outlined"
            onClick={handleClean}
            startIcon={<img src={restartIcon} />}
            style={{ border: "3px solid", height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Limpar
            </Typography>
          </Button>
        )}

        {mostrarBotaoApagar && (
          <Button
            color="primary"
            variant="outlined"
            onClick={aoClicarEmApagar}
            startIcon={<img src={deleteIcon} />}
            style={{ border: "3px solid", height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Deletar
            </Typography>
          </Button>
        )}
        {mostrarBotaoNovo && (
          <Button
            color="primary"
            variant="outlined"
            onClick={aoClicarEmNovo}
            startIcon={<img src={addIcon} />}
            style={{ border: "3px solid", height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Nova
            </Typography>
          </Button>
        )}
        {mostrarBotaoFinalizarChamado && (
          <Button
            color="primary"
            variant="outlined"
            onClick={() => aoClicarEmBotaoFinalizarChamado?.(busca)}
            startIcon={<img src={checkCircleRedIcon} />}
            style={{ border: "3px solid", height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Finalizar Chamado
            </Typography>
          </Button>
        )}
        {mostrarBotaoIntegração && (
          <Button
            color="primary"
            variant="outlined"
            onClick={() => aoClicarEmBotaoIntegração?.(busca)}
            startIcon={<img src={integrationIcon} />}
            style={{ border: "3px solid", height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Integração user globus
            </Typography>
          </Button>
        )}
        {mostrarBotaoVoltar && (
          <Button
            color="primary"
            variant="outlined"
            onClick={aoClicarEmVoltar}
            startIcon={<img src={westIcon} />}
            style={{ border: "3px solid", height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Voltar
            </Typography>
          </Button>
        )}
        {mostrarInputNovoSelect && (
          <>
            <VForm
              ref={formRef}
              onSubmit={() => null}
            >
              <VSelect
                name="occurrence"
                label="Nova ocorrência"
                value={inputNovo}
                onChange={(e) => setInputNovo?.(e.target.value)}
                size="small"
                style={{ minWidth: "240px", marginRight: "16px" }}
              >
                {arrayNovoSelect
                  ? arrayNovoSelect.map((item) => (
                      <MenuItem
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </MenuItem>
                    ))
                  : null}
              </VSelect>
              <Button
                color="primary"
                variant="outlined"
                onClick={() => aoClicarEmNovoSelect?.(inputNovo)}
                startIcon={<img src={convertIcon} />}
                style={{ border: "3px solid", height: "40px" }}
              >
                <Typography
                  variant="button"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                >
                  Converter
                </Typography>
              </Button>
            </VForm>
          </>
        )}
      </Box>
    </Box>
  );
};
