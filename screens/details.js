import { useRoute } from '@react-navigation/native';
import { ScreenContent } from 'components/ScreenContent';
import { StyleSheet, View } from 'react-native';

export default function Details() {
  const route = useRoute();

  return (
    <View style={styles.container}>
      <ScreenContent
        path="screens/details.jsx"
        title={`Showing details for user ${route.params.name}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
