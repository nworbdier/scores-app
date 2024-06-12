import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

import { useModal } from './modalcontext'; // Import your context

const NavBar = () => {
  const navigation = useNavigation();
  const { toggleModal } = useModal(); // Get the toggle function from context

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('News')}>
        <Ionicons name="newspaper-outline" size={30} color="white" />
        {/* <Text style={styles.text}>News</Text> */}
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconContainer} onPress={() => navigation.navigate('Scores')}>
        <Ionicons name="home-outline" size={30} color="white" />
        {/* <Text style={styles.text}>Home</Text> */}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconContainer}
        onPress={toggleModal} // Use the toggle function to show the modal
      >
        <Ionicons name="trophy-outline" size={30} color="white" />
        {/* <Text style={styles.text}>Sports</Text> */}
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
    paddingTop: 15,
    paddingBottom: 45,
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
