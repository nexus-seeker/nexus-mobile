import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WalletConnectScreen } from "../screens/WalletConnectScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";

import {
  ChatScreen,
  PolicyScreen,
  ProfileScreen,
  HistoryScreen,
} from "../screens";

/**
 * Navigation flow:
 *   WalletConnect → Onboarding (auto-checks status) → Chat (Main Screen)
 *
 * The Onboarding screen handles the wallet setup gate — if the wallet is
 * already initialized it passes through instantly; if not, it presents
 * the explicit Set Up Wallet UI before unlocking the app.
 *
 * Secondary screens (Policy, Profile, History) are presented as native modals
 * floating over the main Chat screen.
 */

export type RootStackParamList = {
  WalletConnect: undefined;
  Onboarding: undefined;
  Chat: undefined;
  Policy: undefined;
  Profile: undefined;
  History: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName="WalletConnect">
      {/* Step 1: connect wallet */}
      <Stack.Screen name="WalletConnect" options={{ headerShown: false }}>
        {(props) => (
          <WalletConnectScreen
            onConnected={() => props.navigation.replace("Onboarding")}
          />
        )}
      </Stack.Screen>

      {/* Step 2: onboarding gate — passes straight through if already set up */}
      <Stack.Screen
        name="Onboarding"
        options={{ headerShown: false, gestureEnabled: false }}
      >
        {(props) => (
          <OnboardingScreen
            onComplete={() => props.navigation.replace("Chat")}
          />
        )}
      </Stack.Screen>

      {/* Step 3: pure agent UX - Chat is the root */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />

      {/* Step 4: modal slide-ups */}
      <Stack.Group screenOptions={{ presentation: "modal", headerShown: false }}>
        <Stack.Screen name="Policy" component={PolicyScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> { }

export const AppNavigator = (props: NavigationProps) => {
  const colorScheme = useColorScheme();
  const theme =
    colorScheme === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;

  return (
    <NavigationContainer theme={theme} {...props}>
      <StatusBar />
      <AppStack />
    </NavigationContainer>
  );
};
