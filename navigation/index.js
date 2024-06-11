import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import Scores from '../screens/home';
import MLBDetails from '../screens/mlbdetails';
import MLB from '../screens/mlb';
import NBA from '../screens/nba';
import NHL from '../screens/nhl';
import PGA from '../screens/pga';
import SportSelector from '../components/sportselector'; // Import the MLBDetails screen
import UFC from '../screens/ufc';
import WNBA from '../screens/wnba';

const Stack = createStackNavigator();

export default function RootStack() {
  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Scores">
          <Stack.Screen
            name="SportSelector"
            component={SportSelector}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Scores" component={Scores} options={{ headerShown: false }} />
          <Stack.Screen name="MLB" component={MLB} options={{ headerShown: false }} />
          <Stack.Screen name="MLBDetails" component={MLBDetails} options={{ headerShown: false }} />
          <Stack.Screen name="PGA" component={PGA} options={{ headerShown: false }} />
          <Stack.Screen name="NBA" component={NBA} options={{ headerShown: false }} />
          <Stack.Screen name="WNBA" component={WNBA} options={{ headerShown: false }} />
          <Stack.Screen name="NHL" component={NHL} options={{ headerShown: false }} />
          <Stack.Screen name="UFC" component={UFC} options={{ headerShown: false }} />
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
