import { Box, Card, CardMedia } from "@mui/material";

import { FerramentasDaListagem } from "../../shared/components";
import { LayoutBaseDePagina } from "../../shared/layouts";

import aviso2 from "../../assets/avisos/Aviso2.jpeg";
import aviso3 from "../../assets/avisos/Aviso3.jpeg";

export const Dashboard: React.FC = () => {
  return (
    <LayoutBaseDePagina
      titulo="Portal Administrativo"
      barraDeFerramentas={<FerramentasDaListagem mostrarInputBusca={false} />}
    >
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        ml={2}
        mr={4}
        gap={2}
      >
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          gap={2}
        >
          <Card raised>
            <CardMedia
              component="img"
              max-height="380"
              image={aviso2}
              alt="quadro de aviso ETT"
              sx={{ objectFit: "contain" }}
            />
          </Card>
          <Card raised>
            <CardMedia
              component="img"
              max-height="380"
              image={aviso3}
              alt="quadro de aviso ETT"
              sx={{ objectFit: "contain" }}
            />
          </Card>
        </Box>
      </Box>
    </LayoutBaseDePagina>
  );
};
