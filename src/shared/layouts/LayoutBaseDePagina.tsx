import { ReactNode } from "react";
import {
  Avatar,
  IconButton,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import logoETT from "../../assets/logoETT.png";
import accountIcon from "../../assets/icons/account.svg";
import menuIcon from "../../assets/icons/menu.svg";
import { useAuthContext, useDrawerContext } from "../../contexts";
import { usedName } from "../utils/usedName";

interface ILayoutBaseDePaginaProps {
  titulo: string;
  barraDeFerramentas: ReactNode;
  children: ReactNode;
}
export const LayoutBaseDePagina: React.FC<ILayoutBaseDePaginaProps> = ({
  children,
  titulo,
  barraDeFerramentas,
}) => {
  const theme = useTheme();
  const smDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const mdDown = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));

  const { toggleDrawerOpen } = useDrawerContext();
  const { loggedUser } = useAuthContext();

  return (
    <Box
      height="100%"
      display="flex"
      flexDirection="column"
    >
      {smDown && (
        <Box
          ml={2}
          display="flex"
          flexDirection="row"
          justifyContent="space-between"
          height={theme.spacing(smDown ? 6 : mdDown ? 8 : 12)}
        >
          <Box
            display="flex"
            justifyContent="center"
          >
            <Avatar
              src={logoETT}
              alt="logomarca da ett"
              variant="rounded"
            />
          </Box>
          <Box mr={2}>
            <IconButton onClick={toggleDrawerOpen}>
              <img src={menuIcon} />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Box
          ml={2}
          mt={smDown ? 0 : 2}
          height={theme.spacing(smDown ? 4 : mdDown ? 6 : 8)}
        >
          <Typography
            overflow="hidden"
            whiteSpace="nowrap"
            textOverflow="ellipses"
            variant={smDown ? "h6" : mdDown ? "h5" : "h4"}
          >
            {titulo}
          </Typography>
        </Box>
        <Box
          mr={2}
          mt={2}
        >
          <Box>
            <Box
              display={"flex"}
              flexDirection={"row"}
            >
              <Typography>
                {usedName(loggedUser.name, loggedUser.registration)}
              </Typography>
              <Box
                mr={2}
                ml={1}
              >
                <img src={accountIcon} />
              </Box>
            </Box>
            <Box
              textAlign={"end"}
              mr={6}
            >
              <Typography>{loggedUser.name_main_department}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {barraDeFerramentas && barraDeFerramentas}

      <Box
        flex={1}
        overflow="auto"
      >
        {children}
      </Box>
      <Box
        display="flex"
        justifyContent="center"
      >
        <Typography
          variant="subtitle1"
          style={{ fontSize: "12px" }}
        >
          Copyright© 2025 ETT, todos os direitos reservados.
        </Typography>
      </Box>
    </Box>
  );
};
