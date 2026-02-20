import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ChatScreen,
  HistoryScreen,
  PolicyScreen,
  ProfileScreen,
} from "../screens";

const Tab = createBottomTabNavigator();

/**
 * This is the main navigator with a bottom tab bar.
 * Each tab is a stack navigator with its own set of screens.
 *
 * More info: https://reactnavigation.org/docs/bottom-tab-navigator/
 */
export function HomeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "left",
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case "Chat":
              return (
                <MaterialCommunityIcon
                  name={focused ? "message" : "message-outline"}
                  size={size}
                  color={color}
                />
              );
            case "Policy":
              return (
                <MaterialCommunityIcon
                  name={focused ? "shield-check" : "shield-check-outline"}
                  size={size}
                  color={color}
                />
              );
            case "History":
              return (
                <MaterialCommunityIcon
                  name={focused ? "history" : "history"}
                  size={size}
                  color={color}
                />
              );
            case "Profile":
              return (
                <MaterialCommunityIcon
                  name={focused ? "account-circle" : "account-circle-outline"}
                  size={size}
                  color={color}
                />
              );
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Policy" component={PolicyScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
