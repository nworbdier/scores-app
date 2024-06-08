import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';

const windowWidth = Dimensions.get('window').width;

const NBA = ({ selectedDate, setSelectedDate, refreshing, setRefreshing }) => {
  const [gameData, setGameData] = useState([]);
  const [dates, setDates] = useState([]);

  const formatToYYYYMMDD = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if (month < 10) {
      month = `0${month}`;
    }
    if (day < 10) {
      day = `0${day}`;
    }

    return `${year}${month}${day}`;
  };

  const fetchDates = async () => {
    try {
      const response = await fetch(
        `https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba/calendar/whitelist`
      );
      const data = await response.json();
      const dates = data.eventDate.dates.map((date) => formatToYYYYMMDD(date));

      setDates(dates);

      // Initialize with today's date
      const today = new Date();
      const formattedToday = formatToYYYYMMDD(today);
      setSelectedDate(formattedToday);
    } catch (error) {
      console.error('Error in fetchNBADates:', error);
    }
  };

  const fetchGameData = async (date = selectedDate) => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date}`
      );

      console.log('Fetch NBA Game Data URL:', response.url); // Logging the URL

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const gameData = data.events.map((event) => {
        return {
          id: event.id,
          HomeTeam: event.competitions[0].competitors[0].team.abbreviation,
          HomeLogo: event.competitions[0].competitors[0].team.logo,
          HomeScore: event.competitions[0].competitors[0].score,
          AwayTeam: event.competitions[0].competitors[1].team.abbreviation,
          AwayLogo: event.competitions[0].competitors[1].team.logo,
          AwayScore: event.competitions[0].competitors[1].score,
          GameTime: event.competitions[0].date,
          Status: event.competitions[0].status.type.name,
          StatusShortDetail: event.competitions[0].status.type.shortDetail,
          DisplayClock: event.status.displayClock,
          Quarter: event.status.period,
        };
      });

      setGameData(gameData);
    } catch (error) {
      console.error('Error in fetchNBAGameData:', error);
    }
  };

  useEffect(() => {
    fetchDates();
    fetchGameData(); // Fetch NBA data on component mount
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchGameData();
    }
  }, [selectedDate]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGameData();
    setRefreshing(false);
  };

  const getNumberWithSuffix = (number) => {
    const lastDigit = number % 10;
    const suffix =
      lastDigit === 1 && number !== 11
        ? 'st'
        : lastDigit === 2 && number !== 12
          ? 'nd'
          : lastDigit === 3 && number !== 13
            ? 'rd'
            : 'th';

    return `${number}${suffix}`;
  };

  const formatGameTime = (isoDate) => {
    const date = new Date(isoDate);
    const options = { hour: 'numeric', minute: 'numeric', hour12: true };
    // eslint-disable-next-line no-undef
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const renderNBAComponent = () => {
    return (
      <>
        <FlatList
          data={gameData}
          renderItem={({ item, index }) => (
            <View key={index} style={styles.itemContainer}>
              <View style={styles.column}>
                <Image source={{ uri: item.AwayLogo }} style={styles.image} />
                <Text style={styles.TextStyle1}>{item.AwayTeam}</Text>
                {item.Status !== 'STATUS_SCHEDULED' && (
                  <Text style={styles.TextStyle1}>{item.AwayScore}</Text>
                )}
              </View>
              <View style={styles.column2}>
                {item.Status === 'STATUS_SCHEDULED' ? (
                  <Text style={styles.TextStyle2}>{formatGameTime(item.GameTime)}</Text>
                ) : item.Status === 'STATUS_FINAL' ? (
                  <Text style={styles.TextStyle2}>{item.StatusShortDetail}</Text>
                ) : (
                  <View style={styles.gameTime}>
                    <Text style={styles.TextStyle2}>{getNumberWithSuffix(item.Quarter)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.column}>
                <Image source={{ uri: item.HomeLogo }} style={styles.image} />
                <Text style={styles.TextStyle1}>{item.HomeTeam}</Text>
                {item.Status !== 'STATUS_SCHEDULED' && (
                  <Text style={styles.TextStyle1}>{item.HomeScore}</Text>
                )}
              </View>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          numColumns={2}
        />
      </>
    );
  };

  return {
    renderNBAComponent,
    dates,
    onRefresh: handleRefresh,
    fetchDates,
  };
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scoreboard: {
    flex: 1,
    alignItems: 'space-evenly',
  },
  listContainer: {
    alignSelf: 'center',
    padding: 10,
    width: windowWidth,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 5,
    borderWidth: 0.25,
    borderColor: 'white',
    borderRadius: 10,
    backgroundColor: '#141414',
    width: '49%',
    height: '95%',
    marginHorizontal: '.5%',
  },
  TextStyle1: {
    fontSize: 14,
    fontWeight: 'normal',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  TextStyle2: {
    fontSize: 15,
    fontWeight: 'normal',
    color: 'white',
    textAlign: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    marginBottom: 5,
  },
  gameTime: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  column2: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  image: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  scrollViewContent: {
    flexDirection: 'row',
  },
  selectedDate: {
    backgroundColor: '#FFF',
  },
  sectionHeader: {
    backgroundColor: 'transparent',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionHeaderText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default NBA;
