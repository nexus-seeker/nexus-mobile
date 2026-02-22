import { ViewStyle, View, StyleSheet, Modal as RNModal } from "react-native";
import { Text, Button } from "./index";
import { colors, radii, spacing } from "../../theme/shadcn-theme";

interface AppModalProps {
  children: React.ReactNode;
  title: string;
  hide: () => void;
  show: boolean;
  submit?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
  contentContainerStyle?: ViewStyle;
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel = "Save",
}: AppModalProps) {
  return (
    <RNModal
      visible={show}
      onRequestClose={hide}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text variant="h3" style={styles.title}>{title}</Text>
          {children}
          <View style={styles.action}>
            <View style={styles.buttonGroup}>
              {submit && (
                <Button
                  onPress={submit}
                  disabled={submitDisabled}
                  style={styles.button}
                >
                  {submitLabel}
                </Button>
              )}
              <Button onPress={hide} variant="outline" style={styles.button}>
                Close
              </Button>
            </View>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    marginLeft: 20,
    marginRight: 20,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundSecondary,
    width: '90%',
  },
  title: {
    marginBottom: 16,
  },
  action: {
    marginTop: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
