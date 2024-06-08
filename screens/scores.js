import { AntDesign, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';

import MLB from './mlb';
import NBA from './nba';
import PGA from './pga';
import UFC from './ufc';

const sportNames = ['UFC', 'PGA', 'MLB', 'NBA', 'WNBA', 'TENNIS', 'NHL', 'NFL', 'CFB', 'CBB'];

const Scores = () => {
  const [selectedSport, setSelectedSport] = useState('PGA');
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYYMMDD'));
  const [refreshing, setRefreshing] = useState(false);

  const {
    renderUFCComponent,
    dates: ufcDates,
    onRefresh: onUFCRefresh,
    fetchDates: fetchUFCDates,
  } = UFC({
    selectedDate,
    setSelectedDate,
    refreshing,
    setRefreshing,
  });

  const {
    renderMLBComponent,
    dates: mlbDates,
    onRefresh: onMLBRefresh,
    fetchDates: fetchMLBDates,
  } = MLB({
    selectedDate,
    setSelectedDate,
    refreshing,
    setRefreshing,
  });

  const {
    renderNBAComponent,
    dates: nbaDates,
    onRefresh: onNBARefresh,
    fetchDates: fetchNBADates,
  } = NBA({
    selectedDate,
    setSelectedDate,
    refreshing,
    setRefreshing,
  });

  useEffect(() => {
    if (selectedSport === 'MLB') {
      fetchMLBDates();
    } else if (selectedSport === 'NBA') {
      fetchNBADates();
    } else if (selectedSport === 'UFC') {
      fetchUFCDates();
    }
  }, [selectedSport]);

  const renderSportItem = ({ item }) => (
    <TouchableOpacity style={styles.sportButton} onPress={() => setSelectedSport(item)}>
      <Text style={[styles.sportText, selectedSport === item && styles.selectedSportText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateButton, item === selectedDate && styles.selectedDateButton]}
      onPress={() => setSelectedDate(item)}>
      <Text style={[styles.dateText, item === selectedDate && styles.selectedDateText]}>
        {moment(item).format('MMM D')}
      </Text>
    </TouchableOpacity>
  );

  const getDates = () => {
    switch (selectedSport) {
      case 'UFC':
        return ufcDates;
      case 'MLB':
        return mlbDates;
      case 'NBA':
        return nbaDates;
      default:
        return [];
    }
  };

  const getOnRefresh = () => {
    switch (selectedSport) {
      case 'UFC':
        return onUFCRefresh;
      case 'MLB':
        return onMLBRefresh;
      case 'NBA':
        return onNBARefresh;
      // Add other cases for other sports if needed
      default:
        return () => {};
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Scores</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={25} color="white" marginRight={10} />
          </TouchableOpacity>
          <TouchableOpacity>
            <AntDesign name="search1" size={25} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerContainer}>
        <FlatList
          data={sportNames}
          renderItem={renderSportItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sportList}
        />
        {selectedSport !== 'PGA' && getDates().length > 0 && (
          <FlatList
            data={getDates()}
            renderItem={renderDateItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}
          />
        )}
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: 'black',
          paddingHorizontal: 10,
          paddingBottom: 10,
        }}>
        {selectedSport === 'PGA' && <PGA />}
        {selectedSport === 'UFC' && renderUFCComponent()}
        {selectedSport === 'MLB' && renderMLBComponent(selectedDate)}
        {selectedSport === 'NBA' && renderNBAComponent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  headerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
    marginLeft: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginRight: 10,
  },
  headerContainer: {
    height: 70,
  },
  sportList: {
    justifyContent: 'center',
  },
  sportButton: {
    height: '100%',
    marginHorizontal: 7,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedSportText: {
    color: '#FFDB58',
  },
  dateList: {
    justifyContent: 'center',
  },
  dateButton: {
    width: 75, // 10% of screen width
    height: '100%',
    marginHorizontal: 5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDateButton: {
    position: 'absolute',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  selectedDateText: {
    fontWeight: 'bold',
    color: '#FFDB58',
  },
});

export default Scores;
