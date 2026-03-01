import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { WalletConnectScreen } from "../screens/WalletConnectScreen";
import { OnboardingScreen } from "../screens/OnboardingScreen";

import {
  ConversationListScreen,
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
  ConversationList: undefined;
  Chat: { threadId?: string; recommendationId?: string } | undefined;
  Policy: undefined;
  Profile: undefined;
  History: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
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
            onComplete={() => props.navigation.replace("ConversationList")}
          />
        )}
      </Stack.Screen>

      {/* Step 3: choose conversation thread */}
      <Stack.Screen
        name="ConversationList"
        component={ConversationListScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />

      {/* Step 4: pure agent UX */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />

      {/* Step 5: modal slide-ups */}
      <Stack.Group screenOptions={{ presentation: "modal", headerShown: false }}>
        <Stack.Screen name="Policy" component={PolicyScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <>
      <StatusBar />
      <AppStack />
    </>
  );
};
