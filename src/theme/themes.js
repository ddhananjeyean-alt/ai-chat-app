import { createTheme } from "@mui/material/styles";

const fontFamily = '"Inter", system-ui, "Segoe UI", Roboto, sans-serif';

const typography = {
  fontFamily,
  h1: { fontFamily, fontSize: 40, fontWeight: 700, lineHeight: 1.2 },
  h2: { fontFamily, fontSize: 34, fontWeight: 700, lineHeight: 1.2 },
  h3: { fontFamily, fontSize: 28, fontWeight: 700, lineHeight: 1.25 },
  h4: { fontFamily, fontSize: 24, fontWeight: 700, lineHeight: 1.3 },
  h5: { fontFamily, fontSize: 20, fontWeight: 600, lineHeight: 1.35 },
  h6: { fontFamily, fontSize: 16, fontWeight: 600, lineHeight: 1.4 },
  body1: { fontFamily, fontSize: 15, lineHeight: 1.7 },
  body2: { fontFamily, fontSize: 14, lineHeight: 1.6 },
  button: { fontFamily, fontSize: 14, fontWeight: 500, textTransform: "none" },
  caption: { fontFamily, fontSize: 12.5 },
};

const shape = { borderRadius: 14 };

const transitions = {
  duration: {
    shortest: 150,
    shorter: 180,
    short: 200,
    standard: 200,
    complex: 250,
    enteringScreen: 200,
    leavingScreen: 180,
  },
};

function scrollbarStyles(mode) {
  const thumb = mode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
  return {
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: "transparent transparent",
    },
    "*::-webkit-scrollbar": {
      width: 6,
      height: 6,
    },
    "*::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "*::-webkit-scrollbar-thumb": {
      background: "transparent",
      borderRadius: 10,
    },
    "*:hover::-webkit-scrollbar-thumb": {
      background: thumb,
    },
  };
}

function buildComponents(mode) {
  const isDark = mode === "dark";
  const border = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const hover = isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.05)";
  const paper = isDark ? "#2F2F2F" : "#FFFFFF";
  const background = isDark ? "#212121" : "#FFFFFF";
  const textPrimary = isDark ? "#FFFFFF" : "#202123";
  const textSecondary = isDark ? "#A1A1AA" : "#6B7280";
  const tooltipBg = isDark ? "#3A3A3A" : "#111111";

  return {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body": {
          backgroundColor: background,
          color: textPrimary,
          fontFamily,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },
        "#root": {
          backgroundColor: background,
        },
        "::selection": {
          background: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)",
          color: textPrimary,
        },
        a: {
          color: isDark ? "#5B9BFF" : "#1D6FE0",
          textDecoration: "none",
          transition: "opacity 200ms ease",
        },
        "a:hover": {
          opacity: 0.85,
          textDecoration: "underline",
        },
        code: {
          fontFamily: '"Fira Code", monospace',
          background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
          padding: "2px 6px",
          borderRadius: 6,
          fontSize: "0.85em",
        },
        pre: {
          fontFamily: '"Fira Code", monospace',
          background: isDark ? "#1E1E1E" : "#F5F5F5",
          borderRadius: 12,
          padding: 16,
          overflowX: "auto",
        },
        ...scrollbarStyles(mode),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: "none",
          fontWeight: 500,
          fontFamily,
          transition: "background 200ms ease, transform 200ms ease, box-shadow 200ms ease",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          "&:hover": {
            filter: "brightness(1.08)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 36,
          height: 36,
          borderRadius: 10,
          transition: "background 200ms ease, transform 200ms ease",
          "&:hover": {
            backgroundColor: hover,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          transition: "background 200ms ease, box-shadow 200ms ease, border-color 200ms ease",
          "& fieldset": {
            borderColor: border,
            transition: "border-color 200ms ease",
          },
          "&:hover fieldset": {
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.18)",
          },
          "&.Mui-focused": {
            boxShadow: isDark
              ? "0 0 0 3px rgba(255,255,255,0.12)"
              : "0 0 0 3px rgba(0,0,0,0.08)",
          },
          "&.Mui-focused fieldset": {
            borderColor: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)",
            borderWidth: 1,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 18,
          boxShadow: "none",
          backgroundColor: paper,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 22,
          backgroundColor: paper,
          border: `1px solid ${border}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? "0 8px 30px rgba(0,0,0,0.5)"
            : "0 8px 30px rgba(0,0,0,0.12)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: "2px 6px",
          fontSize: 14,
          fontFamily,
          transition: "background 200ms ease",
          "&:hover": {
            backgroundColor: hover,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 10,
          backgroundColor: tooltipBg,
          color: "#FFFFFF",
          fontSize: 12.5,
          fontFamily,
          padding: "6px 10px",
        },
        arrow: {
          color: tooltipBg,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: border,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          backgroundImage: "none",
        },
      },
    },
  };
}

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#212121",
      paper: "#2F2F2F",
    },
    primary: {
      main: "#FFFFFF",
      contrastText: "#111111",
    },
    secondary: {
      main: "#A1A1AA",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#A1A1AA",
    },
    divider: "rgba(255,255,255,.08)",
    action: {
      hover: "rgba(255,255,255,.08)",
    },
    chatgpt: {
      sidebar: "#171717",
      border: "rgba(255,255,255,.08)",
      hover: "rgba(255,255,255,.08)",
    },
  },
  typography,
  shape,
  transitions,
  components: buildComponents("dark"),
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    primary: {
      main: "#202123",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#6B7280",
    },
    text: {
      primary: "#202123",
      secondary: "#6B7280",
    },
    divider: "rgba(0,0,0,.08)",
    action: {
      hover: "rgba(0,0,0,.05)",
    },
    chatgpt: {
      sidebar: "#F7F7F8",
      border: "rgba(0,0,0,.08)",
      hover: "rgba(0,0,0,.05)",
    },
  },
  typography,
  shape,
  transitions,
  components: buildComponents("light"),
});
export const themes = {
  midnight: darkTheme,
  dark: darkTheme,
  light: lightTheme,
};

export const getTheme = (mode) => (mode === "light" ? lightTheme : darkTheme);



export default darkTheme;