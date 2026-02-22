import { ClusterNetwork, useCluster } from "./cluster-data-access";
import { ClusterPickerRadioButtonGroupRow } from "./cluster-ui";
import { Text } from "../ui";
import { View, StyleSheet } from "react-native";
import { spacing } from "../../theme/shadcn-theme";

function clusternetworkToIndex(clusterName: string): number {
  switch (clusterName) {
    case ClusterNetwork.Devnet:
      return 0;
    case ClusterNetwork.Testnet:
      return 1;
    default:
      throw Error("Invalid cluster selected");
  }
}

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
