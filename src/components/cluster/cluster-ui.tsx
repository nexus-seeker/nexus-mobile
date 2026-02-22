import { View, StyleSheet, Pressable } from "react-native";
import { Text } from "../ui";
import { Cluster } from "./cluster-data-access";
import { colors, spacing } from "../../theme/shadcn-theme";

interface ClusterPickerRadioButtonGroupRowProps {
  cluster: Cluster;
  selected: boolean;
  onSelect: () => void;
}

export function ClusterPickerRadioButtonGroupRow({
  cluster,
  selected,
  onSelect,
}: ClusterPickerRadioButtonGroupRowProps) {
  return (
    <Pressable onPress={onSelect} style={styles.listItem}>
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text variant="p" style={styles.title}>{cluster.name}</Text>
          <Text variant="small" style={styles.description}>{cluster.endpoint}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '500',
  },
  description: {
    color: colors.foregroundMuted,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});
