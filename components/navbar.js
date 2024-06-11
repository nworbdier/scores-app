import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const NavBar = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('News')}>
        <Ionicons name="newspaper-outline" size={24} color="white" />
        <Text style={styles.text}>News</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('Scores')}>
        <Ionicons name="home-outline" size={24} color="white" />
        <Text style={styles.text}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconContainer}
        onPress={() => navigation.navigate('SportSelector')}>
        <Ionicons name="trophy-outline" size={24} color="white" />
        <Text style={styles.text}>Sports</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#141414',
    paddingTop: 10,
    paddingBottom: 25,
  },
  iconContainer: {
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    marginTop: 4,
    color: 'white',
  },
});

export default NavBar;
