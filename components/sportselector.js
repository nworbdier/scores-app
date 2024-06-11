import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';

import { useModal } from './modalcontext'; // Import your context

const sportNames = [
  'UFC',
  'PGA',
  'MLB',
  'NBA',
  'WNBA',
  'NHL',
  'PFL',
  'TENNIS',
  'NFL',
  'CFB',
  'CBB',
];

const SportSelector = () => {
  const { isModalVisible, toggleModal } = useModal(); // Get the state and toggle function from context
  const navigation = useNavigation(); // Use the useNavigation hook to get the navigation object

  const navigateToSport = (sport) => {
    console.log('Navigating to:', sport);
    navigation.navigate(sport);
    toggleModal(); // Close the modal after navigating
  };

  const renderSportItem = ({ item }) => (
    <TouchableOpacity style={styles.sportButton} onPress={() => navigateToSport(item)}>
      <Text style={styles.sportText}>{item}</Text>
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
              <Ionicons name="close" size={24} color="white" />
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
    width: '100%',
    height: '20%',
    backgroundColor: 'black',

    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
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
});

export default SportSelector;
