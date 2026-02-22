import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ChatScreen,
  HistoryScreen,
  PolicyScreen,
  ProfileScreen,
} from "../screens";
import { tabBarOptions } from "../theme/shadcn-theme";

const Tab = createBottomTabNavigator();

export function HomeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        ...tabBarOptions,
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
                  name="history"
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
