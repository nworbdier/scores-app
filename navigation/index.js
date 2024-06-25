import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

import { ModalProvider } from '../components/modalcontext'; // Adjusted path
import SportSelector from '../components/sportselector'; // Import the SportSelector modal
import BASKETBALL from '../screens/basketball';
import GOLF from '../screens/golf';
import Scores from '../screens/home';
import MLB from '../screens/mlb';
import MLBDetails from '../screens/mlbdetails';
import MMA from '../screens/mma';
import NHL from '../screens/nhl';

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
              <Stack.Screen name="GOLF" component={GOLF} options={{ headerShown: false }} />
              <Stack.Screen
                name="BASKETBALL"
                component={BASKETBALL}
                options={{ headerShown: false }}
              />
              <Stack.Screen name="NHL" component={NHL} options={{ headerShown: false }} />
              <Stack.Screen name="MMA" component={MMA} options={{ headerShown: false }} />
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
