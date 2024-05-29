import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ScreenContent } from 'components/ScreenContent';
import { StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';
import { RootStackParamList } from '../navigation';

type ScoresScreenNavigationProps = StackNavigationProp<RootStackParamList, 'Scores'>;

export default function Scores() {
  const navigation = useNavigation<ScoresScreenNavigationProps>();

  return (
    <View style={styles.container}>
      <ScreenContent path="screens/scores.tsx" title="Scores" />
      <Button
        onPress={() =>
          navigation.navigate('Details', {
            name: 'Dan',
          })
        }
        title="Show Details"
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});
