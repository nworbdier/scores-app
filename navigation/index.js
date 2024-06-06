import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { BackButton } from '../components/BackButton';
import Details from '../screens/details';
import Scores from '../screens/scores';

const Stack = createStackNavigator();

export default function RootStack() {
  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: 'black',
  },
});
