import { AntDesign, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import MLB from './mlb';
import NBA from './nba';
import PGA from './pga';
import UFC from './ufc';
import WNBA from './wnba';

const sportNames = ['UFC', 'PGA', 'MLB', 'NBA', 'WNBA', 'TENNIS', 'NHL', 'NFL', 'CFB', 'CBB'];

const ITEM_WIDTH = 75; // Define a fixed width for date items

const Scores = () => {
  const ref = useRef();
  const [index, setIndex] = useState(0);
  const [selectedSport, setSelectedSport] = useState('PGA');
  const [selectedDates, setSelectedDates] = useState({
    UFC: moment().format('YYYYMMDD'),
    MLB: moment().format('YYYYMMDD'),
    NBA: moment().format('YYYYMMDD'),
    WNBA: moment().format('YYYYMMDD'),
  });
  const [refreshing, setRefreshing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dateListLoading, setDateListLoading] = useState(false);

  const getSelectedDate = () => selectedDates[selectedSport] || moment().format('YYYYMMDD');

  const setSelectedDate = (date) => {
    setSelectedDates((prevDates) => ({
      ...prevDates,
      [selectedSport]: date,
    }));

    const dates = getDates();
    const selectedIndex = dates.findIndex((d) => d === date);
    console.log(`Selected index for ${selectedSport}:`, selectedIndex);
    setIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const resetSelectedDate = () => {
    const today = moment().format('YYYYMMDD');
    setSelectedDate(today);
  };

  // Inside your onScrollToIndexFailed function
  const onScrollToIndexFailed = useCallback((info) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 5000));
    wait.then(() => {
      const offset = ITEM_WIDTH * info.index;
      try {
        ref.current?.scrollToOffset({ offset, animated: false });
        // Set dateListLoading to false after a delay to wait for the animation to finish
        setTimeout(() => {
          setDateListLoading(false);
        }, 500); // Adjust the delay time as needed
      } catch (e) {
        console.warn('Scroll to index failed:', e);
      }
    });
  }, []);

  useEffect(() => {
    if (!resetting) {
      const newIndex = getDates().findIndex((date) => date === moment().format('YYYYMMDD'));
      setIndex(newIndex >= 0 ? newIndex : 0);
    }
  }, [selectedSport, resetting, selectedDates]);

  useEffect(() => {
    setResetting(true);
    resetSelectedDate();
    const fetchDates = async () => {
      if (selectedSport === 'MLB') await fetchMLBDates();
      else if (selectedSport === 'NBA') await fetchNBADates();
      else if (selectedSport === 'UFC') await fetchUFCDates();
      else if (selectedSport === 'WNBA') await fetchWNBADates();
      setResetting(false);
    };
    fetchDates();
  }, [selectedSport]);

  useEffect(() => {
    const dates = getDates();
    const newIndex = dates.findIndex((date) => date === moment().format('YYYYMMDD'));
    setIndex(newIndex >= 0 ? newIndex : 0);
  }, [selectedSport]);

  useEffect(() => {
    if (ref.current && !resetting) {
      try {
        ref.current.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
        // Set loading to false after a delay to wait for the animation to finish
        setTimeout(() => {
          setLoading(false);
        }, 500); // Adjust the delay time as needed
      } catch (e) {
        console.warn('Scroll to index failed:', e);
      }
    }
  }, [index, resetting]);

  const {
    renderUFCComponent,
    dates: ufcDates,
    fetchDates: fetchUFCDates,
  } = UFC({
    selectedDate: selectedDates.UFC,
    setSelectedDate: (date) => setSelectedDate(date),
    refreshing,
    setRefreshing,
  });

  const {
    renderMLBComponent,
    dates: mlbDates,
    fetchDates: fetchMLBDates,
  } = MLB({
    selectedDate: selectedDates.MLB,
    setSelectedDate: (date) => setSelectedDate(date),
    refreshing,
    setRefreshing,
  });

  const {
    renderNBAComponent,
    dates: nbaDates,
    fetchDates: fetchNBADates,
  } = NBA({
    selectedDate: selectedDates.NBA,
    setSelectedDate: (date) => setSelectedDate(date),
    refreshing,
    setRefreshing,
  });

  const {
    renderWNBAComponent,
    dates: wnbaDates,
    fetchDates: fetchWNBADates,
  } = WNBA({
    selectedDate: selectedDates.WNBA,
    setSelectedDate: (date) => setSelectedDate(date),
    refreshing,
    setRefreshing,
  });

  const renderPGAComponent = () => {
    return <PGA />;
  };

  const renderSportItem = ({ item }) => (
    <TouchableOpacity style={styles.sportButton} onPress={() => setSelectedSport(item)}>
      <Text style={[styles.sportText, selectedSport === item && styles.selectedSportText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  // Inside your renderDateItem function
  const renderDateItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.dateButton, item === getSelectedDate() && styles.selectedDateButton]}
      onPress={() => setSelectedDate(item)}
      activeOpacity={1}>
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
        {selectedSport !== 'PGA' && getDates().length > 0 && (
          <>
            {dateListLoading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <FlatList
                ref={ref}
                data={getDates()} // Pass the dates data for the selected sport
                getItemLayout={(data, index) => ({
                  length: ITEM_WIDTH,
                  offset: ITEM_WIDTH * index,
                  index,
                })}
                initialScrollIndex={index}
                renderItem={renderDateItem}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateList}
                onScrollToIndexFailed={onScrollToIndexFailed}
              />
            )}
          </>
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
    width: ITEM_WIDTH,
    height: '100%',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
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
