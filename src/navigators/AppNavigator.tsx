/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 */
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useColorScheme } from "react-native";
import { HomeNavigator } from "./HomeNavigator";
import { WalletConnectScreen } from "../screens/WalletConnectScreen";
import { StatusBar } from "expo-status-bar";

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 *
 */

type RootStackParamList = {
  WalletConnect: undefined;
  HomeTabs: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppStack = () => {
  return (
    <Stack.Navigator initialRouteName={"WalletConnect"}>
      <Stack.Screen
        name="WalletConnect"
        options={{ headerShown: false }}
      >
        {(props) => (
          <WalletConnectScreen
            onConnected={() => props.navigation.replace('HomeTabs')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="HomeTabs"
        component={HomeNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export interface NavigationProps
  extends Partial<React.ComponentProps<typeof NavigationContainer>> { }

export const AppNavigator = (props: NavigationProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? NavigationDarkTheme : NavigationDefaultTheme;

  return (
    <NavigationContainer
      theme={theme}
      {...props}
    >
      <StatusBar />
      <AppStack />
    </NavigationContainer>
  );
};
