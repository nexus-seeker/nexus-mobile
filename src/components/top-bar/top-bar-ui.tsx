import { Account, useAuthorization } from "../../utils/useAuthorization";
import { useMobileWallet } from "../../utils/useMobileWallet";
import { useNavigation } from "@react-navigation/native";
import { ellipsify } from "../../utils/ellipsify";
import { useState } from "react";
import * as Clipboard from "expo-clipboard";
import { Linking, Pressable, StyleSheet, View, Text as RNText } from "react-native";
import { useCluster } from "../cluster/cluster-data-access";
import { Button, Text } from "../ui";
import { colors, spacing } from "../../theme/shadcn-theme";

export function TopBarWalletButton({
  selectedAccount,
  openMenu,
}: {
  selectedAccount: Account | null;
  openMenu: () => void;
}) {
  const { connect } = useMobileWallet();
  return (
    <Button
      style={{ alignSelf: "center" }}
      onPress={selectedAccount ? openMenu : connect}
      size="sm"
    >
      {selectedAccount
        ? ellipsify(selectedAccount.publicKey.toBase58())
        : "Connect"}
    </Button>
  );
}

export function TopBarSettingsButton() {
  const navigation = useNavigation();
  return (
    <Button
      variant="ghost"
      size="sm"
      onPress={() => {
        navigation.navigate("HomeTabs");
      }}
    >
      Settings
    </Button>
  );
}

// Simple Menu Item component
function MenuItem({
  onPress,
  title,
  icon,
}: {
  onPress: () => void;
  title: string;
  icon: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <RNText style={styles.menuIcon}>{icon}</RNText>
      <Text variant="p">{title}</Text>
    </Pressable>
  );
}

export function TopBarWalletMenu() {
  const { selectedAccount } = useAuthorization();
  const { getExplorerUrl } = useCluster();
  const [visible, setVisible] = useState(false);
  const { disconnect } = useMobileWallet();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const copyAddressToClipboard = async () => {
    if (selectedAccount) {
      await Clipboard.setStringAsync(selectedAccount.publicKey.toBase58());
    }
    closeMenu();
  };

  const viewExplorer = () => {
    if (selectedAccount) {
      const explorerUrl = getExplorerUrl(
        `account/${selectedAccount.publicKey.toBase58()}`
      );
      Linking.openURL(explorerUrl);
    }
    closeMenu();
  };

  const handleDisconnect = async () => {
    await disconnect();
    closeMenu();
  };

  return (
    <View>
      <TopBarWalletButton
        selectedAccount={selectedAccount}
        openMenu={openMenu}
      />
      {visible && (
        <View style={styles.menuOverlay}>
          <Pressable style={styles.backdrop} onPress={closeMenu} />
          <View style={styles.menu}>
            <MenuItem
              onPress={copyAddressToClipboard}
              title="Copy address"
              icon="📋"
            />
            <MenuItem
              onPress={viewExplorer}
              title="View Explorer"
              icon="🔗"
            />
            <MenuItem
              onPress={handleDisconnect}
              title="Disconnect"
              icon="🔌"
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    position: 'absolute',
    top: 40,
    right: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
  },
  menu: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  menuIcon: {
    fontSize: 16,
  },
});
