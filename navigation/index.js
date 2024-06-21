import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { ModalProvider } from '../components/modalcontext'; // Adjusted path
import SportSelector from '../components/sportselector'; // Import the SportSelector modal
import Scores from '../screens/home';
import LIV from '../screens/liv';
import MLB from '../screens/mlb';
import MLBDetails from '../screens/mlbdetails';
import NBA from '../screens/nba';
import NHL from '../screens/nhl';
import PFL from '../screens/pfl';
import PGA from '../screens/pga';
import UFC from '../screens/ufc';
import WNBA from '../screens/wnba';

const Stack = createStackNavigator();

export default function RootStack() {
  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} />
      <ModalProvider>
        <NavigationContainer>
          <View style={styles.container}>
            <Stack.Navigator initialRouteName="MLB">
              <Stack.Screen name="Scores" component={Scores} options={{ headerShown: false }} />
              <Stack.Screen name="MLB" component={MLB} options={{ headerShown: false }} />
              <Stack.Screen
                name="MLBDetails"
                component={MLBDetails}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="PGA" component={PGA} options={{ headerShown: false }} />
              <Stack.Screen name="LIV" component={LIV} options={{ headerShown: false }} />
              <Stack.Screen name="NBA" component={NBA} options={{ headerShown: false }} />
              <Stack.Screen name="WNBA" component={WNBA} options={{ headerShown: false }} />
              <Stack.Screen name="NHL" component={NHL} options={{ headerShown: false }} />
              <Stack.Screen name="UFC" component={UFC} options={{ headerShown: false }} />
              <Stack.Screen name="PFL" component={PFL} options={{ headerShown: false }} />
            </Stack.Navigator>
            <SportSelector />
          </View>
        </NavigationContainer>
      </ModalProvider>
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
  container: {
    flex: 1,
  },
});
