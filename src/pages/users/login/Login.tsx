import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Divider,
  FormHelperText,
  IconButton,
  OutlinedInput,
  Typography,
} from "@mui/material";
import logoETT from "./../../../assets/logoETT.png";
import packageJson from "../../../../package.json";
import visibilityIcon from "../../../assets/icons/visibility.svg";
import visibilityOffIcon from "../../../assets/icons/visibility_off.svg";
import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "../../../contexts/AuthContext";
import { handleErrorMessage } from "../../../shared/error/handleErrorMessage";
import { messageError } from "../../../shared/utils/messages/messageError";

export const Login: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, login } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const registrationRef = useRef<HTMLInputElement | null>(null);
  const { version } = packageJson;

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      if (!registration || !password) {
        throw Error("Credenciais inválidas");
      }

      await login({ registration: Number(registration), password });
    } catch (error: any) {
      setRegistrationError("Credenciais inválidas");
      setPasswordError("Credenciais inválidas");
      messageError(handleErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPassword("");
    setRegistration("");
  }, [isAuthenticated]);

  useEffect(() => {
    registrationRef.current?.focus();
  }, []);

  if (isAuthenticated) return <>{children}</>;

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
    >
      <Card>
        <CardContent>
          <Box
            display="flex"
            justifyContent="center"
            paddingTop={2}
            width={320}
          >
            <Box
              display="flex"
              flexDirection="column"
              width="100%"
              gap={3}
            >
              <CardMedia
                component="img"
                height={52}
                image={logoETT}
                alt="logomarca ETT"
                sx={{ objectFit: "contain" }}
              />
              <Typography
                variant="h6"
                align="center"
                color={"#585858"}
              >
                Portal Administrativo
              </Typography>

              <Box>
                <OutlinedInput
                  inputRef={registrationRef}
                  fullWidth
                  id="registration"
                  placeholder="Digite sua matrícula"
                  value={registration}
                  disabled={isLoading}
                  error={!!registrationError}
                  onKeyDown={() => setRegistrationError("")}
                  onChange={(e) => setRegistration(e.target.value)}
                />
                {registrationError && (
                  <FormHelperText error>{registrationError}</FormHelperText>
                )}
              </Box>
              <Box>
                <OutlinedInput
                  fullWidth
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  disabled={isLoading}
                  error={!!passwordError}
                  onKeyDown={() => setPasswordError("")}
                  onChange={(e) => setPassword(e.target.value)}
                  endAdornment={
                    <IconButton onClick={handleClickShowPassword}>
                      {showPassword ? (
                        <img src={visibilityIcon} />
                      ) : (
                        <img src={visibilityOffIcon} />
                      )}
                    </IconButton>
                  }
                />
                {passwordError && (
                  <FormHelperText error>{passwordError}</FormHelperText>
                )}
              </Box>
              <Button
                variant="contained"
                disabled={isLoading}
                onClick={handleSubmit}
                size="large"
                endIcon={
                  isLoading && (
                    <CircularProgress
                      variant="indeterminate"
                      color="inherit"
                      size={20}
                    />
                  )
                }
              >
                Login
              </Button>
              <Divider />
              <Typography
                variant="body2"
                align="right"
                color={"#585858"}
              >
                {`v. ${version}`}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
