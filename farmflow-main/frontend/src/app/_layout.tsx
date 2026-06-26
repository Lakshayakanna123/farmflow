import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import "../global.css";
import { useFonts as usePoppinsFonts, Poppins_700Bold, Poppins_600SemiBold, Poppins_400Regular } from '@expo-google-fonts/poppins';
import { useFonts as useInterFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

function RootLayoutContent() {
  const { isDark, colors } = useTheme();
  const [poppinsLoaded] = usePoppinsFonts({ Poppins_700Bold, Poppins_600SemiBold, Poppins_400Regular });
  const [interLoaded] = useInterFonts({ Inter_400Regular, Inter_600SemiBold });
  const fontsLoaded = poppinsLoaded && interLoaded;

  // Define Paper themes matching our custom organic palette
  const paperTheme = isDark
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: colors.primary,
          secondary: colors.secondary,
          background: colors.background,
          surface: colors.card,
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: colors.primary,
          secondary: colors.secondary,
          background: colors.background,
          surface: colors.card,
        },
      };

  useEffect(() => {
    // Hide the native splash screen after fonts are loaded and the app renders
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore */
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Keep splash screen visible until fonts load
    return null;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Entrance Routing */}
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="checklist" />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1 dark:bg-black">
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
