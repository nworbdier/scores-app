import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

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
].reverse();

const SportSelector = ({ navigation }) => {
  const navigateToSport = (sport) => {
    console.log('Navigating to:', sport);
    navigation.navigate(sport);
  };

  const renderSportItem = ({ item }) => (
    <TouchableOpacity style={styles.sportButton} onPress={() => navigateToSport(item)}>
      <Text style={styles.sportText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Select a Sport</Text>
      <FlatList
        data={sportNames}
        renderItem={renderSportItem}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.sportList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
    padding: 20,
    justifyContent: 'flex-end',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
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
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  sportText: {
    fontSize: 18,
    color: 'white',
  },
});

export default SportSelector;
