import { createTheme } from "@mui/material/styles";

export const getMuiTheme = (currentTheme) =>
  createTheme({
    palette: {
      mode:
        currentTheme.name === "Light"
          ? "light"
          : "dark",

      primary: {
        main: currentTheme.colors.primary,
      },

      background: {
        default: currentTheme.colors.background,
        paper: currentTheme.colors.card,
      },

      text: {
        primary: currentTheme.colors.text,
        secondary: currentTheme.colors.subText,
      },

      divider: currentTheme.colors.border,
    },

    typography: {
      fontFamily: [
        "Inter",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "sans-serif",
      ].join(","),

      h1: {
        fontWeight: 700,
      },

      h2: {
        fontWeight: 700,
      },

      h3: {
        fontWeight: 700,
      },

      h4: {
        fontWeight: 700,
      },

      h5: {
        fontWeight: 700,
      },

      h6: {
        fontWeight: 700,
      },

      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },

    shape: {
      borderRadius: 12,
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: "none",

            "&:hover": {
              boxShadow: "none",
            },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 14,
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
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
            borderRadius: 12,
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 14,
          },
        },
      },
    },
  });