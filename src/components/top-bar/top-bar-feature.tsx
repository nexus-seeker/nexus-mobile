import { StyleSheet, View } from "react-native";
import { TopBarWalletMenu } from "./top-bar-ui";
import { useNavigation } from "@react-navigation/core";
import { Button } from "../ui";
import { colors, spacing } from "../../theme/shadcn-theme";
import { useAuthorization } from "../../utils/useAuthorization";
import { createNewThreadId } from "../../utils/thread-id";

export function TopBar() {
  const navigation = useNavigation();
  const { selectedAccount } = useAuthorization();
  const pubkey = selectedAccount?.publicKey.toBase58();

  return (
    <View style={styles.topBar}>
      <TopBarWalletMenu />
      <Button
        variant="ghost"
        size="sm"
        onPress={() => {
          navigation.navigate("Chat", { threadId: createNewThreadId(pubkey) });
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
