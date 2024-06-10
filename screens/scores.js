import { AntDesign, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, StyleSheet } from 'react-native';

import MLB from './mlb';
import NBA from './nba';
import PGA from './pga';
import UFC from './ufc';
import WNBA from './wnba';

const sportNames = ['UFC', 'PGA', 'MLB', 'NBA', 'WNBA', 'TENNIS', 'NHL', 'NFL', 'CFB', 'CBB'];

const Scores = () => {
  const ref = useRef();
  const [index, setIndex] = useState(0);
  const [selectedSport, setSelectedSport] = useState('PGA');
  const [ufcSelectedDate, setUfcSelectedDate] = useState(moment().format('YYYYMMDD'));
  const [mlbSelectedDate, setMlbSelectedDate] = useState(moment().format('YYYYMMDD'));
  const [nbaSelectedDate, setNbaSelectedDate] = useState(moment().format('YYYYMMDD'));
  const [wnbaSelectedDate, setWnbaSelectedDate] = useState(moment().format('YYYYMMDD'));
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const todayIndex = useRef(0);

  const getSelectedDate = () => {
    switch (selectedSport) {
      case 'UFC':
        return ufcSelectedDate;
      case 'MLB':
        return mlbSelectedDate;
      case 'NBA':
        return nbaSelectedDate;
      case 'WNBA':
        return wnbaSelectedDate;
      default:
        return moment().format('YYYYMMDD');
    }
  };

  const setSelectedDate = (date) => {
    switch (selectedSport) {
      case 'UFC':
        setUfcSelectedDate(date);
        break;
      case 'MLB':
        setMlbSelectedDate(date);
        break;
      case 'NBA':
        setNbaSelectedDate(date);
        break;
      case 'WNBA':
        setWnbaSelectedDate(date);
        break;
      default:
        break;
    }

    // Calculate the index of the selected date in the dates array
    const dates = getDates();
    const selectedIndex = dates.findIndex((d) => d === date);

    // Update the index state
    setIndex(selectedIndex >= 0 ? selectedIndex : 0); // Ensure index is not -1
  };

  const resetSelectedDate = () => {
    const today = moment().format('YYYYMMDD');
    setSelectedDate(today);
  };

  const {
    renderUFCComponent,
    dates: ufcDates,
    fetchDates: fetchUFCDates,
  } = UFC({
    selectedDate: ufcSelectedDate,
    setSelectedDate: setUfcSelectedDate,
    refreshing,
    setRefreshing,
  });

  const {
    renderMLBComponent,
    dates: mlbDates,
    fetchDates: fetchMLBDates,
  } = MLB({
    selectedDate: mlbSelectedDate,
    setSelectedDate: setMlbSelectedDate,
    refreshing,
    setRefreshing,
  });

  const {
    renderNBAComponent,
    dates: nbaDates,
    fetchDates: fetchNBADates,
  } = NBA({
    selectedDate: nbaSelectedDate,
    setSelectedDate: setNbaSelectedDate,
    refreshing,
    setRefreshing,
  });

  const {
    renderWNBAComponent,
    dates: wnbaDates,
    fetchDates: fetchWNBADates,
  } = WNBA({
    selectedDate: wnbaSelectedDate,
    setSelectedDate: setWnbaSelectedDate,
    refreshing,
    setRefreshing,
  });

  const renderPGAComponent = () => {
    return <PGA />;
  };

  useEffect(() => {
    setResetting(true);
    resetSelectedDate(); // Reset the selected date to today's date whenever the sport changes
    setTimeout(() => {
      if (selectedSport === 'MLB') {
        fetchMLBDates();
      } else if (selectedSport === 'NBA') {
        fetchNBADates();
      } else if (selectedSport === 'UFC') {
        fetchUFCDates();
      } else if (selectedSport === 'WNBA') {
        fetchWNBADates();
      }
      setResetting(false);
    }, 500); // Delay of 0.5 seconds
  }, [selectedSport]);

  useEffect(() => {
    const dates = getDates();
    let newIndex = dates.findIndex((date) => date === moment().format('YYYYMMDD'));
    if (newIndex < 0) {
      newIndex = 0; // If today's date is not found, default to the first date
    }
    todayIndex.current = newIndex;
  }, [selectedSport]);

  useEffect(() => {
    ref.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }, [index]);

  const renderSportItem = ({ item }) => (
    <TouchableOpacity style={styles.sportButton} onPress={() => setSelectedSport(item)}>
      <Text style={[styles.sportText, selectedSport === item && styles.selectedSportText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateButton, item === getSelectedDate() && styles.selectedDateButton]}
      onPress={() => setSelectedDate(item)}
      activeOpacity={1} // Set activeOpacity to 1 to disable opacity change on press
    >
      <Text style={[styles.dateText, item === getSelectedDate() && styles.selectedDateText]}>
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
      case 'WNBA':
        return wnbaDates;
      default:
        return [];
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
        {selectedSport !== 'PGA' && getDates().length > 0 && todayIndex.current !== undefined && (
          <FlatList
            ref={ref}
            initialScrollIndex={todayIndex.current >= 0 ? todayIndex.current : 0}
            data={getDates()}
            renderItem={renderDateItem}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateList}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise((resolve) => setTimeout(resolve, 500));
              wait.then(() => {
                ref.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
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
        {!resetting && (
          <>
            {selectedSport === 'PGA' && renderPGAComponent()}
            {selectedSport === 'UFC' && renderUFCComponent()}
            {selectedSport === 'MLB' && renderMLBComponent()}
            {selectedSport === 'NBA' && renderNBAComponent()}
            {selectedSport === 'WNBA' && renderWNBAComponent()}
          </>
        )}
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
  selectedDateButton: {},
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
