import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { Colors, DarkColors, ThemeColors } from "../constants/Colors";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "fws_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const systemColorScheme = useRNColorScheme();

  // NOTE: We do not call NativeWind's setColorScheme here.
  // NativeWind's automatic dark mode (via `useColorScheme` from react-native)
  // handles the Tailwind dark class automatically. Calling setColorScheme
  // manually requires darkMode: 'class' in tailwind.config and causes a
  // runtime error when that option isn't set.

  // Resolve whether the current active theme is dark
  const isDark =
    themeMode === "system"
      ? systemColorScheme === "dark"
      : themeMode === "dark";

  const colors = isDark ? DarkColors : Colors;

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEY);
        if (
          savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system"
        ) {
          setThemeModeState(savedTheme);
        }
        // If no saved theme, default stays "system" (initial state).
      } catch (error) {
        console.error("Failed to load theme from storage", error);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme to storage", error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme: themeMode, isDark, colors, setThemeMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
