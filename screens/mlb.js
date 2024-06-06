import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';

const options = {
  method: 'GET',
};

const findClosestDate = (dates) => {
  const today = moment();
  return dates.reduce((closestDate, currentDate) => {
    const currentDiff = Math.abs(today.diff(moment(currentDate), 'days'));
    const closestDiff = Math.abs(today.diff(moment(closestDate), 'days'));
    return currentDiff < closestDiff ? currentDate : closestDate;
  });
};

const UFC = ({ selectedDate, setSelectedDate, refreshing, setRefreshing }) => {
  const [events, setEvents] = useState([]);
  const [eventDetails, setEventDetails] = useState(null);
  const [dates, setDates] = useState([]);

  const fetchDates = async () => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=2024`,
        options
      );
      const result = await response.json();
      const calendarDates = result.leagues[0].calendar.map((item) => item.startDate);
      setDates(calendarDates);
      if (calendarDates.length > 0) {
        const closestDate = findClosestDate(calendarDates);
        setSelectedDate(closestDate);
        fetchEvents(closestDate);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEvents = async (date) => {
    try {
      const formattedDate = moment(date).format('YYYYMMDD');
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${formattedDate}`,
        options
      );
      const result = await response.json();
      setEvents(result.events);
      if (result.events.length > 0) {
        fetchEventDetails(result.events[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      const response = await fetch(
        `https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/fightcenter/${eventId}`,
        options
      );
      const result = await response.json();
      setEventDetails(result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDates();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchEvents(selectedDate);
    }
  }, [selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents(selectedDate);
    setRefreshing(false);
  };

  const renderEventItem = ({ item }) => (
    <View style={styles.eventContainer}>
      <Text style={styles.eventName}>{item.name}</Text>
    </View>
  );

  const renderCompetitionItem = (competition, cardKey) => {
    const statusType = competition.status.type.name;
    const competitor1 = competition.competitors[0];
    const competitor2 = competition.competitors[1];
    const result = competition.status.result;

    const getImageSource = (competitor) => {
      const { headshot, athlete } = competitor.athlete || {};
      return headshot && headshot.href
        ? { uri: headshot.href }
        : athlete && athlete.flag && athlete.flag.href
          ? { uri: athlete.flag.href }
          : null;
    };

    return (
      <View style={styles.competitorsContainer} key={competition.id}>
        <View style={styles.competitorColumn}>
          {getImageSource(competitor1) && (
            <Image source={getImageSource(competitor1)} style={styles.headshotImage} />
          )}
          <Text style={styles.competitorName}>{competitor1.athlete.displayName}</Text>
          <Text
            style={[
              styles.resultText,
              statusType === 'STATUS_SCHEDULED' && styles.scheduledText,
              !competitor1.winner && statusType !== 'STATUS_SCHEDULED' && styles.lossText,
            ]}>
            {statusType === 'STATUS_SCHEDULED'
              ? competitor1.displayRecord
              : competitor1.winner
                ? 'W'
                : 'L'}
          </Text>
        </View>
        <View style={styles.vsColumn}>
          {statusType === 'STATUS_FINAL' ? (
            <View style={styles.resultColumn}>
              <Text style={[styles.resultText, styles.centeredText]}>
                {result.shortDisplayName}
              </Text>
              <Text style={[styles.resultDescription, styles.centeredText]}>
                {result.description}
              </Text>
            </View>
          ) : (
            <Text style={styles.vsText}>vs</Text>
          )}
        </View>
        <View style={styles.competitorColumn}>
          {getImageSource(competitor2) && (
            <Image source={getImageSource(competitor2)} style={styles.headshotImage} />
          )}
          <Text style={styles.competitorName}>{competitor2.athlete.displayName}</Text>
          <Text
            style={[
              styles.resultText,
              statusType === 'STATUS_SCHEDULED' && styles.scheduledText,
              !competitor2.winner && statusType !== 'STATUS_SCHEDULED' && styles.lossText,
            ]}>
            {statusType === 'STATUS_SCHEDULED'
              ? competitor2.displayRecord
              : competitor2.winner
                ? 'W'
                : 'L'}
          </Text>
        </View>
      </View>
    );
  };

  const renderCard = (cardKey) => {
    const card = eventDetails?.cards[cardKey];
    return (
      <View style={styles.cardContainer} key={cardKey}>
        <Text style={styles.cardName}>{card?.displayName}</Text>
        {card?.competitions.map((comp) => renderCompetitionItem(comp, cardKey))}
      </View>
    );
  };

  return {
    events,
    eventDetails,
    dates,
    onRefresh,
    renderEventItem,
    renderCard,
  };
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 20,
    marginHorizontal: 5,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  competitorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  competitorColumn: {
    flex: 3,
    alignItems: 'center',
  },
  vsColumn: {
    flex: 1,
    alignItems: 'center',
  },
  headshotImage: {
    width: 75,
    height: 75,
    borderRadius: 25,
    marginBottom: 10,
  },
  competitorName: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  vsText: {
    fontSize: 18,
    color: 'white',
  },
  resultColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  resultDescription: {
    fontSize: 14,
    color: 'white',
    marginTop: 2.5,
  },
  centeredText: {
    textAlign: 'center',
  },
  scheduledText: {
    color: 'gray',
  },
  lossText: {
    color: 'red',
  },
});

export default UFC;
