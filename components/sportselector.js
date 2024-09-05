import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';

import { useModal } from './modalcontext'; // Import your context

const sportNames = [
  'UFC',
  'PFL',
  'PGA',
  'LIV',
  'MLB',
  'WNBA',
  'NBA',
  'NHL',
  'TENNIS',
  'NFL',
  'CFB',
  'CBB',
];

const SportSelector = () => {
  const { isModalVisible, toggleModal } = useModal(); // Get the state and toggle function from context
  const navigation = useNavigation(); // Use the useNavigation hook to get the navigation object
  const [selectedSport, setSelectedSport] = useState('MLB'); // State to keep track of the selected sport

  const navigateToSport = (sport) => {
    setSelectedSport(sport); // Set the selected sport
    if (sport === 'UFC' || sport === 'PFL') {
      navigation.navigate('MMA', { sport }); // Navigate to MMA screen with sport type as a parameter
    } else if (sport === 'NBA' || sport === 'WNBA') {
      navigation.navigate('BASKETBALL', { sport }); // Navigate to Basketball screen with sport type as a parameter
    } else if (sport === 'PGA' || sport === 'LIV') {
      navigation.navigate('GOLF', { sport }); // Navigate to Basketball screen with sport type as a parameter
    } else if (sport === 'NFL' || sport === 'COLLEGE-FOOTBALL') {
      navigation.navigate('FOOTBALL', { sport }); // Navigate to Basketball screen with sport type as a parameter
    } else {
      navigation.navigate(sport); // Navigate to the specific sport screen
    }
    toggleModal(); // Close the modal after navigating
  };

  const renderSportItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.sportButton, item === selectedSport]} // Apply selected style conditionally
      onPress={() => navigateToSport(item)}>
      <Text style={[styles.sportText, item === selectedSport && styles.selectedSportText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent
      visible={isModalVisible}
      onRequestClose={toggleModal} // Close the modal on request
    >
      <View style={styles.modalContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={sportNames}
            renderItem={renderSportItem}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.sportList}
            horizontal
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  container: {
    height: '20%',
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: 30,
    marginTop: 30,
  },
  sportList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 50,
  },
  sportButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  sportText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  selectedSportText: {
    color: '#FFDB58', // Highlight color for selected sport text
  },
});

export default SportSelector;
