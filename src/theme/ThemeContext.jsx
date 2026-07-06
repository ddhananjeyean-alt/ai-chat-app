import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import { createTheme } from "@mui/material/styles";
import { themes } from "./themes";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Theme
  const [themeName, setThemeName] = useState(() => {
    const saved = localStorage.getItem("themeName");
    return saved && themes[saved] ? saved : "midnight";
  });

  // Font Size
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem("fontSize") || "medium";
  });

  // Create theme with dynamic font size
  const currentTheme = useMemo(() => {
    const baseTheme = themes[themeName] || themes.midnight;

    const scale =
      fontSize === "small"
        ? 0.9
        : fontSize === "large"
        ? 1.15
        : 1;

    return createTheme(baseTheme, {
      typography: {
        fontFamily: baseTheme.typography.fontFamily,

        h1: { ...baseTheme.typography.h1, fontSize: `${2.5 * scale}rem` },
        h2: { ...baseTheme.typography.h2, fontSize: `${2.125 * scale}rem` },
        h3: { ...baseTheme.typography.h3, fontSize: `${1.75 * scale}rem` },
        h4: { ...baseTheme.typography.h4, fontSize: `${1.5 * scale}rem` },
        h5: { ...baseTheme.typography.h5, fontSize: `${1.25 * scale}rem` },
        h6: { ...baseTheme.typography.h6, fontSize: `${1.125 * scale}rem` },

        body1: {
          ...baseTheme.typography.body1,
          fontSize: `${1 * scale}rem`,
        },

        body2: {
          ...baseTheme.typography.body2,
          fontSize: `${0.9 * scale}rem`,
        },

        button: {
          ...baseTheme.typography.button,
          fontSize: `${0.9 * scale}rem`,
        },
      },
    });
  }, [themeName, fontSize]);

  // Change Theme
  const changeTheme = (newTheme) => {
    if (themes[newTheme]) {
      setThemeName(newTheme);
      localStorage.setItem("themeName", newTheme);
    }
  };

  // Save Font Size
  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
  }, [fontSize]);

  return (
    <ThemeContext.Provider
      value={{
        themeName,
        currentTheme,
        changeTheme,
        themes,
        fontSize,
        setFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}