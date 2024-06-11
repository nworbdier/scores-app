import { AntDesign, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import NavBar from '../components/navbar';

const sportNames = ['TENNIS', 'NFL', 'CFB', 'CBB'];

const ITEM_WIDTH = 75;

const Scores = () => {
  const ref = useRef();
  const [index, setIndex] = useState(0);
  const [selectedSport, setSelectedSport] = useState('TENNIS');
  const [selectedDates, setSelectedDates] = useState({});
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
    setIndex(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const resetSelectedDate = () => {
    const today = moment().format('YYYYMMDD');
    setSelectedDate(today);
  };

  const onScrollToIndexFailed = async (info) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 5000));
    await wait;
    const offset = ITEM_WIDTH * info.index;
    try {
      ref.current?.scrollToOffset({ offset, animated: true });
      setTimeout(() => {
        setDateListLoading(false);
      }, 500);
    } catch (e) {
      console.warn('Scroll to index failed:', e);
    }
  };

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
        ref.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        setTimeout(() => {
          setLoading(false);
        }, 5000);
      } catch (e) {
        console.warn('Scroll to index failed:', e);
      }
    }
  }, [index, resetting]);

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
      activeOpacity={1}>
      <Text style={[styles.dateText, item === getSelectedDate() && styles.selectedDateText]}>
        {moment(item).format('MMM D')}
      </Text>
    </TouchableOpacity>
  );

  const getDates = () => {
    switch (selectedSport) {
      default:
        return [];
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer} />
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
        {getDates().length > 0 && (
          <>
            {dateListLoading ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <FlatList
                ref={ref}
                data={getDates()}
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
        }}
      />
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  safeAreaContainer: {
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
