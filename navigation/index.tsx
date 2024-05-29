import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView, StyleSheet } from 'react-native';

import { BackButton } from '../components/BackButton';
import Details from '../screens/details';
import Scores from '../screens/scores';

export type RootStackParamList = {
  Scores: undefined;
  Details: { name: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Scores">
          <Stack.Screen name="Scores" component={Scores} options={{ headerShown: false }} />
          <Stack.Screen
            name="Details"
            component={Details}
            options={({ navigation }) => ({
              headerLeft: () => <BackButton onPress={navigation.goBack} />,
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
