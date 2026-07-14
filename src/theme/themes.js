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
  const border = isDark ? "rgba(255,255,255,.08)" : "rgba(0, 0, 0, 0.12)";
  const hover = isDark ? "rgba(255,255,255,.08)" : "rgba(0, 0, 0, 0.04)";
  const paper = isDark ? "#2F2F2F" : "#FFFFFF";
  const background = isDark ? "#212121" : "#F8FAFC";
  const textPrimary = isDark ? "#FFFFFF" : "#111827";
  const textSecondary = isDark ? "#A1A1AA" : "#374151";
  const tooltipBg = isDark ? "#3A3A3A" : "#111827";

  return {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body, #root": {
          backgroundColor: background,
          backgroundImage: isDark ? "none" : "radial-gradient(circle at 50% 50%, #FCFDFF 0%, #EEF4FC 100%)",
          color: textPrimary,
          fontFamily,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        },
        "html, body, #root, header, .MuiPaper-root, .MuiBox-root, .MuiTypography-root, .MuiIconButton-root, .MuiButton-root, .MuiOutlinedInput-root": {
          transition: "background-color 650ms cubic-bezier(0.4, 0, 0.2, 1), background 650ms cubic-bezier(0.4, 0, 0.2, 1), color 650ms cubic-bezier(0.4, 0, 0.2, 1), border-color 650ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 650ms cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 650ms cubic-bezier(0.4, 0, 0.2, 1)",
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
          borderRadius: 22,
          textTransform: "none",
          fontWeight: 600,
          fontFamily,
          transition: "all 300ms cubic-bezier(.22,1,.36,1)",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(1px)",
          },
        },
        containedPrimary: {
          background: isDark
            ? "#FFFFFF"
            : "linear-gradient(135deg, #0EA5FF 0%, #2563EB 100%)",
          color: isDark ? "#111111" : "#FFFFFF",
          boxShadow: isDark
            ? "none"
            : "0 4px 14px rgba(14, 165, 255, 0.35)",
          "&:hover": {
            background: isDark
              ? "#FFFFFF"
              : "linear-gradient(135deg, #1eaeff, #3b82f6 100%)",
            boxShadow: isDark
              ? "none"
              : "0 6px 20px rgba(14, 165, 255, 0.45)",
          },
        },
        outlinedPrimary: {
          backgroundColor: isDark ? "transparent" : "#FFFFFF",
          color: isDark ? "#ffffff" : "#2563EB",
          borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(220, 228, 240, 0.9)",
          "&:hover": {
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#EEF6FF",
            borderColor: isDark ? "rgba(255,255,255,0.25)" : "#2563EB",
          },
        },
        textPrimary: {
          color: isDark ? "#ffffff" : "#2563EB",
          "&:hover": {
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#EEF6FF",
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
          transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: hover,
            transform: "scale(1.05)",
            boxShadow: isDark 
              ? "0 4px 12px rgba(0,0,0,0.3)" 
              : "0 4px 10px rgba(0,0,0,0.04)",
          },
          "&:active": {
            transform: "scale(0.95)",
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
        root: ({ theme }) => ({
          borderRadius: 16,
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.015)",
          transition: "all 200ms ease",
          "& fieldset": {
            borderColor: border,
            transition: "border-color 200ms ease",
          },
          "&:hover fieldset": {
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)",
          },
          "&.Mui-focused": {
            boxShadow: isDark
              ? "0 0 0 3px rgba(255,255,255,0.12)"
              : `0 0 0 3px ${theme.palette.primary.main}1a`,
          },
          "&.Mui-focused fieldset": {
            borderColor: isDark ? "rgba(255,255,255,0.3)" : theme.palette.primary.main,
            borderWidth: 1,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 18,
          boxShadow: isDark ? "none" : "0 12px 30px rgba(31,41,55,.08)",
          backgroundColor: paper,
          border: isDark ? "none" : `1px solid ${border}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 22,
          backgroundColor: paper,
          border: `1px solid ${border}`,
          boxShadow: isDark
            ? "0 15px 40px rgba(0,0,0,0.5)"
            : "0 12px 30px rgba(31,41,55,.08)",
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
            : "0 12px 30px rgba(31,41,55,.08)",
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
      default: "#F8FAFD",
      paper: "#FFFFFF",
    },
    primary: {
      main: "#2563EB",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#667085",
    },
    text: {
      primary: "#1F2937",
      secondary: "#667085",
      muted: "#98A2B3",
      links: "#0EA5FF",
    },
    divider: "rgba(0, 0, 0, 0.05)",
    action: {
      hover: "rgba(14, 165, 255, 0.04)",
    },
    chatgpt: {
      sidebar: "rgba(255, 255, 255, 0.65)",
      border: "rgba(255, 255, 255, 0.7)",
      hover: "rgba(0, 0, 0, 0.03)",
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