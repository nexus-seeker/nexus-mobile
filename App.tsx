// Polyfills
import "./src/polyfills";

import { StyleSheet, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppFonts } from "./src/theme/fonts";

import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { AppNavigator } from "./src/navigators/AppNavigator";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";
import { PolicyProvider } from "./src/contexts/PolicyContext";

const queryClient = new QueryClient();

export default function App() {
  const { fontsLoaded, fontError } = useAppFonts();
  const colorScheme = useColorScheme();

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }} />
    );
  }
  const theme = colorScheme === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ClusterProvider>
        <ConnectionProvider config={{ commitment: "processed" }}>
          <SafeAreaView
            style={[
              styles.shell,
              {
                backgroundColor: theme.colors.background,
              },
            ]}
          >
            <PolicyProvider>
              <AppNavigator />
            </PolicyProvider>
          </SafeAreaView>
        </ConnectionProvider>
      </ClusterProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
