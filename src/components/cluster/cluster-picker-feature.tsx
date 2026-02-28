import { useCluster } from "./cluster-data-access";
import { ClusterPickerRadioButtonGroupRow } from "./cluster-ui";
import { Text } from "../ui";
import { View, StyleSheet } from "react-native";
import { spacing } from "../../theme/shadcn-theme";

export default function ClusterPickerFeature() {
  const { selectedCluster, clusters, setSelectedCluster } = useCluster();
  const [devNetCluster, testNetCluster] = clusters;

  return (
    <View style={styles.container}>
      <Text variant="h3">Cluster:</Text>
      <ClusterPickerRadioButtonGroupRow
        cluster={devNetCluster}
        selected={selectedCluster.name === devNetCluster.name}
        onSelect={() => setSelectedCluster(devNetCluster)}
      />
      <ClusterPickerRadioButtonGroupRow
        cluster={testNetCluster}
        selected={selectedCluster.name === testNetCluster.name}
        onSelect={() => setSelectedCluster(testNetCluster)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
});
