import { StyleSheet, View } from "react-native";
import { Text } from "../components/ui";
export default function BlankScreen() {
  return (
    <>
      <View style={styles.screenContainer}>
        <Text variant="h3">This is a blank tab!</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    height: "100%",
    padding: 16,
  },
});
