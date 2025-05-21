import logoETT from "../../../assets/logoETT.png";
import {
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import {
  useAppThemeContext,
  useAuthContext,
  useDrawerContext,
} from "../../../contexts";
import fullscreenIcon from "../../../assets/icons/fullscreen.svg";
import windowedIcon from "../../../assets/icons/windowed.svg";
import logoutIcon from "../../../assets/icons/logout.svg";
import darkModeIcon from "../../../assets/icons/dark_mode.svg";
import upArrowIcon from "../../../assets/icons/up_arrow.svg";
import downArrowIcon from "../../../assets/icons/down_arrow.svg";
import cameraIcon from "../../../assets/icons/linked_camera.svg";
import rightArrowIcon from "../../../assets/icons/right_arrow.svg";
import busIcon from "../../../assets/icons/directions_bus.svg";
import clickIcon from "../../../assets/icons/ads_click.svg";
import busAlertIcon from "../../../assets/icons/bus_alert.svg";
import hearingIcon from "../../../assets/icons/hearing.svg";
import usersIcon from "../../../assets/icons/supervised_user_circle.svg";
import home from "../../../assets/icons/home.svg";
import { useMatch, useNavigate } from "react-router-dom";
import { useState } from "react";

interface IListItemLinkProps {
  to: string;
  icon: string;
  label: string;
  onClick?: () => void;
}

const ListItemLink: React.FC<IListItemLinkProps> = ({
  to,
  icon,
  label,
  onClick,
}) => {
  const navigate = useNavigate();
  const iconMap: Record<string, string> = {
    home: home,
    bus_alert: busAlertIcon,
    ads_click: clickIcon,
    linked_camera: cameraIcon,
    double_arrow: rightArrowIcon,
    hearing: hearingIcon,
    directions_bus: busIcon,
  };

  const handleClick = () => {
    navigate(to);
    onClick?.();
  };

  return (
    <ListItemButton
      selected={useMatch({ path: to, end: true }) !== null}
      onClick={handleClick}
    >
      <ListItemIcon>{icon && <img src={iconMap[icon]} />}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
};

interface ISubMenuProps {
  label: string;
  icon: string;
  subItems: IListItemLinkProps[];
}

const SubMenu: React.FC<ISubMenuProps> = ({ label, icon, subItems }) => {
  const [open, setOpen] = useState(false);
  const iconMap: Record<string, string> = {
    supervised_user_circle: usersIcon,
  };

  const handleToggle = () => {
    setOpen(!open);
  };

  return (
    <>
      <ListItemButton onClick={handleToggle}>
        <ListItemIcon>{icon && <img src={iconMap[icon]} />}</ListItemIcon>
        <ListItemText primary={label} />
        <img src={open ? upArrowIcon : downArrowIcon} />
      </ListItemButton>
      {open && (
        <List
          component="div"
          disablePadding
        >
          {subItems.map((subItem) => (
            <ListItemLink
              key={subItem.to}
              to={subItem.to}
              icon={subItem.icon}
              label={subItem.label}
            />
          ))}
        </List>
      )}
    </>
  );
};

export const MenuLateral: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));

  const { isDrawerOpen, drawerOptions, toggleDrawerOpen } = useDrawerContext();
  const { toggleTheme } = useAppThemeContext();
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  const handleLogout = () => {
    navigate("/");
    logout();
  };

  return (
    <>
      <Drawer
        open={isDrawerOpen}
        variant={smDown ? "temporary" : "permanent"}
        onClose={toggleDrawerOpen}
      >
        <Box
          width={theme.spacing(26)}
          height="100%"
          display="flex"
          flexDirection="column"
          sx={{ overflowY: "hidden" }} //ocultar a barra de rolagem
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            mt={2}
            mb={2}
          >
            <img
              src={logoETT}
              alt="logomarca da ett"
            />
          </Box>

          <Divider />

          <Box flex={1}>
            <List component="nav">
              {drawerOptions.map((drawerOption) => {
                if (drawerOption.subItems) {
                  return (
                    <SubMenu
                      key={drawerOption.label}
                      label={drawerOption.label}
                      icon={drawerOption.icon}
                      subItems={drawerOption.subItems}
                    />
                  );
                } else {
                  return (
                    <ListItemLink
                      to={drawerOption.path || ""}
                      key={drawerOption.path}
                      icon={drawerOption.icon}
                      label={drawerOption.label}
                      onClick={smDown ? toggleDrawerOpen : undefined}
                    />
                  );
                }
              })}
            </List>
          </Box>

          <Box>
            <List component="nav">
              <ListItemButton onClick={toggleFullScreen}>
                <ListItemIcon>
                  <img src={isFullScreen ? windowedIcon : fullscreenIcon} />
                </ListItemIcon>
                <ListItemText primary="Tela cheia" />
              </ListItemButton>
              <ListItemButton onClick={toggleTheme}>
                <ListItemIcon>
                  <img src={darkModeIcon} />
                </ListItemIcon>
                <ListItemText primary="Tema" />
              </ListItemButton>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon>
                  <img src={logoutIcon} />
                </ListItemIcon>
                <ListItemText primary="Sair" />
              </ListItemButton>
            </List>
          </Box>
        </Box>
      </Drawer>

      <Box
        height="100vh"
        marginLeft={smDown ? 0 : theme.spacing(26)}
      >
        {children}
      </Box>
    </>
  );
};
