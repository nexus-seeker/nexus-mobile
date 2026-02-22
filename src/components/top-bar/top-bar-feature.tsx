import { StyleSheet, View } from "react-native";
import { TopBarWalletMenu, TopBarSettingsButton } from "./top-bar-ui";
import { useNavigation } from "@react-navigation/core";
import { Button } from "../ui";
import { colors, spacing } from "../../theme/shadcn-theme";

export function TopBar() {
  const navigation = useNavigation();

  return (
    <View style={styles.topBar}>
      <TopBarWalletMenu />
      <Button
        variant="ghost"
        size="sm"
        onPress={() => {
          navigation.navigate("Chat");
        }}
      >
        Settings
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
});
