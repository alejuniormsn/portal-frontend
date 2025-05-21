import {
  Box,
  Button,
  InputAdornment,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
  Theme,
  MenuItem,
} from "@mui/material";
import InputMask from "react-input-mask";
import filterIcon from "../../../assets/icons/filter.svg";
import restartIcon from "../../../assets/icons/restart_alt.svg";
import pdfIcon from "../../../assets/icons/picture_as_pdf.svg";
import addIcon from "../../../assets/icons/add.svg";
import searchIcon from "../../../assets/icons/search.svg";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { VSelect } from "../../forms/VSelect";
import { useVForm } from "../../forms/useVForm";
import { VForm } from "../../forms/VForm";

interface ISelect {
  id: number;
  name?: string;
}

interface IFerramentasDaListagemProps {
  placeholderDaBusca?: string;
  textoDoBotaoDeBusca?: string;
  mostrarInputBusca?: boolean;
  mostrarFiltrosDeData?: boolean;
  aoClicarEmFiltros?: (busca: string, incio: string, fim: string) => void;
  arrayNovoSelect?: ISelect[];
  mostrarInputNovoSelect?: boolean;
  aoClicarEmNovoSelect?: (inputNovo: string) => void;
  mostrarBotaoNovo?: boolean;
  aoClicarEmNovo?: () => void;
  mostrarBotaoPDF?: boolean;
  aoClicarEmPDF?: () => void;
  mostrarFiltroTipoOcorrencia?: boolean;
  aoClicarEmFiltroTipoOcorrencia?: (busca: string) => void;
  mostrarFiltroResponsavel?: boolean;
  aoClicarEmFiltroResponsavel?: (busca: string) => void;
  mostrarFiltroCarro?: boolean;
  aoClicarEmFiltroCarro?: (busca: string) => void;
  mostrarFiltroLinha?: boolean;
  aoClicarEmFiltroLinha?: (busca: string) => void;
  mostrarFiltroRA?: boolean;
  aoClicarEmFiltroRA?: (busca: string) => void;
  mostrarBotaoPendencia?: boolean;
  aoClicarEmPendencia?: () => void;
  mostrarBotaoLimpar?: boolean;
}
export const FerramentasDaListagem: React.FC<IFerramentasDaListagemProps> = ({
  placeholderDaBusca = "Busca por...",
  textoDoBotaoDeBusca = "Veículo",
  mostrarInputBusca = false,
  mostrarFiltrosDeData = false,
  aoClicarEmFiltros,
  arrayNovoSelect,
  mostrarInputNovoSelect = false,
  aoClicarEmNovoSelect,
  mostrarBotaoLimpar,
  mostrarBotaoNovo,
  aoClicarEmNovo,
  mostrarBotaoPDF,
  aoClicarEmPDF,
  mostrarFiltroTipoOcorrencia,
  aoClicarEmFiltroTipoOcorrencia,
  mostrarFiltroResponsavel,
  aoClicarEmFiltroResponsavel,
  mostrarFiltroCarro,
  aoClicarEmFiltroCarro,
  mostrarFiltroLinha,
  aoClicarEmFiltroLinha,
  mostrarFiltroRA,
  aoClicarEmFiltroRA,
  mostrarBotaoPendencia,
  aoClicarEmPendencia,
}) => {
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const passwordRef = useRef<HTMLInputElement | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [busca, setBusca] = useState("");
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
    setInicio("");
    setFim("");
  };

  useEffect(() => {
    passwordRef.current?.focus();
  }, []);

  return (
    <Box
      marginLeft={2}
      marginRight={4}
      padding={1.5}
      paddingX={2}
      mb={2}
      gap={2}
      component={Paper}
      display="flex"
      flexDirection="row"
      justifyContent="space-between"
    >
      <Box
        display="flex"
        gap={1}
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
              style={{ maxWidth: "200px" }}
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
            {mostrarFiltrosDeData && (
              <>
                <TextField
                  size="small"
                  value={inicio}
                  label="Data início"
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => setInicio(e.target.value)}
                  style={{ maxWidth: "130px" }}
                  InputProps={{
                    inputComponent: InputMask as any,
                    inputProps: {
                      mask: "99/99/9999",
                      maskChar: null,
                    },
                  }}
                />
                <TextField
                  size="small"
                  value={fim}
                  label="Data fim"
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => setFim(e.target.value)}
                  style={{ maxWidth: "130px" }}
                  InputProps={{
                    inputComponent: InputMask as any,
                    inputProps: {
                      mask: "99/99/9999",
                      maskChar: null,
                    },
                  }}
                />
              </>
            )}
            <Button
              color="primary"
              variant="contained"
              onClick={() => aoClicarEmFiltros?.(busca, inicio, fim)}
              startIcon={<img src={filterIcon} />}
              style={{ height: "40px" }}
            >
              <Typography
                variant="button"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {textoDoBotaoDeBusca}
              </Typography>
            </Button>
          </>
        )}
        {mostrarFiltroTipoOcorrencia && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => aoClicarEmFiltroTipoOcorrencia?.(busca)}
            startIcon={<img src={filterIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Tipo Ocorrência
            </Typography>
          </Button>
        )}
        {mostrarFiltroLinha && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => aoClicarEmFiltroLinha?.(busca)}
            startIcon={<img src={filterIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Linha
            </Typography>
          </Button>
        )}
        {mostrarFiltroRA && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => aoClicarEmFiltroRA?.(busca)}
            startIcon={<img src={filterIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              RA
            </Typography>
          </Button>
        )}
        {mostrarFiltroCarro && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => aoClicarEmFiltroCarro?.(busca)}
            startIcon={<img src={filterIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Carro
            </Typography>
          </Button>
        )}
        {mostrarFiltroResponsavel && (
          <Button
            color="primary"
            variant="contained"
            onClick={() => aoClicarEmFiltroResponsavel?.(busca)}
            startIcon={<img src={filterIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Responsável
            </Typography>
          </Button>
        )}
        {mostrarBotaoPendencia && (
          <Button
            color="primary"
            variant="contained"
            onClick={aoClicarEmPendencia}
            startIcon={<img src={filterIcon} />}
            style={{ height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Pendencia
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
        {mostrarBotaoPDF && (
          <Button
            color="primary"
            variant="outlined"
            onClick={aoClicarEmPDF}
            startIcon={<img src={pdfIcon} />}
            style={{ border: "3px solid", height: "40px" }}
          >
            <Typography
              variant="button"
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
            >
              Imprimir
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
              Novo
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
                startIcon={<img src={addIcon} />}
                style={{ border: "3px solid", height: "40px" }}
              >
                <Typography
                  variant="button"
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                >
                  Novo
                </Typography>
              </Button>
            </VForm>
          </>
        )}
      </Box>
    </Box>
  );
};
