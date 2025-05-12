import { createTheme } from "@mui/material";
import { cyan, red } from "@mui/material/colors";

export const LightTheme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 820,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: {
      main: red[600],
      dark: red[900],
      light: red[500],
      contrastText: "#ffffff",
    },
    secondary: {
      main: cyan[500],
      dark: cyan[400],
      light: cyan[300],
      contrastText: "#ffffff",
    },
    background: {
      paper: "#ffffff",
      default: "#f2f2f2",
    },
  },
});
