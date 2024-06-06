import { useRoute } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

export default function Details() {
  const route = useRoute();

  return <View style={styles.container}></View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});

