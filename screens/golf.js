import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';

import NavBar from '../components/navbar'; // Import the NavBar component

const ITEM_WIDTH = 75;

const findClosestDate = (dates) => {
  if (dates.length === 0) return null;
  const today = moment();
  return dates.reduce((closestDate, currentDate) => {
    const currentDiff = Math.abs(today.diff(moment(currentDate), 'days'));
    const closestDiff = Math.abs(today.diff(moment(closestDate), 'days'));
    return currentDiff < closestDiff ? currentDate : closestDate;
  }, dates[0]);
};

const GOLF = ({ route }) => {
  const { sport } = route.params; // Get the sport type from the route parameters
  const [playersData, setPlayersData] = useState([]);
  const [tournamentName, setTournamentName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const currentDate = moment().format('YYYYMMDD');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const [loading, setLoading] = useState(false);

  const [availableTournaments, setAvailableTournaments] = useState([]);
  const [tournamentModalVisible, setTournamentModalVisible] = useState(false);

  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const [closestDateIndex, setClosestDateIndex] = useState(0); // Initialize with 0
  const [selectedTournament, setSelectedTournament] = useState(null); // Variable for the selected tournament

  const flatListRef = useRef();
  const intervalIdRef = useRef(null); // Ref to store the interval ID
  const selectedTournamentRef = useRef(selectedTournament); // Ref to store the latest selectedTournament

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

  const fetchTournamentCalendar = async () => {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/golf/${sport.toLowerCase()}/scoreboard`
      );
      const data = await response.json();
      const calendar = data.leagues[0].calendar;
      setAvailableTournaments(calendar);
      setCurrentData(data); // Set current data

      const dates = calendar.map((item) => formatToYYYYMMDD(item.date));
      setDates(dates);

      const closestDate = findClosestDate(dates);
      setSelectedDate(closestDate);

      // Always use the first event for the current date
      const firstEvent = data.events[0];
      if (firstEvent) {
        return firstEvent.id;
      } else {
        console.error('No events found for the current date.');
      }
    } catch (error) {
      console.error('Error fetching golf tournament calendar:', error);
    }
  };

  const fetchData = async (eventId) => {
    try {
      const response = await fetch(
        `https://site.web.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=${sport.toLowerCase()}&event=${eventId}`
      );

      const data = await response.json();
      setCurrentData(data); // Set current data

      const eventDetails = data.events[0];
      setTournamentName(eventDetails.tournament.displayName); // Set tournament name

      let players = [];

      if (
        data.events.length > 0 &&
        data.events[0].competitions.length > 0 &&
        data.events[0].competitions[0].competitors
      ) {
        players = data.events[0].competitions[0].competitors
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((competitor) => {
            const period = competitor.status.period;
            let today = '-';
            let thru = competitor.status.thru;
            let position = competitor.status.position.displayName;

            if (competitor.status.displayValue === 'CUT') {
              position = 'MC';
              today = '-';
              thru = 'CUT';
            } else {
              if (competitor.status.type.name === 'STATUS_SCHEDULED') {
                thru =
                  competitor.status.startHole === 10
                    ? `${moment(competitor.status.teeTime).format('h:mm A')}*`
                    : moment(competitor.status.teeTime).format('h:mm A');
              } else {
                if (competitor.linescores && competitor.linescores.length > 0) {
                  const lineScoreIndex = period - 1;
                  if (lineScoreIndex >= 0 && lineScoreIndex < competitor.linescores.length) {
                    today = competitor.linescores[lineScoreIndex].displayValue || '-';
                  }
                }

                if (thru && thru !== '-') {
                  // Check if startHole is 10 and add asterisk
                  if (competitor.status.startHole === 10) {
                    thru += '*';
                  }
                }
              }
            }

            // Find the total score from statistics
            let totalScore = '-';
            if (competitor.statistics && competitor.statistics[0]) {
              totalScore = competitor.statistics[0].displayValue || '-';
            }

            // Add (A) if the player is an amateur
            const playerName = competitor.amateur
              ? `${competitor.athlete.displayName} (A)`
              : competitor.athlete.displayName;

            return {
              id: competitor.athlete.id, // Assuming competitor has an id field
              pl: position,
              name: playerName,
              today,
              thru,
              tot: totalScore,
            };
          });
      } else {
        console.log('No player data available. Check back later.');
        // Optionally, you can set a state or perform an action to handle this case
      }

      setPlayersData(players);
    } catch (error) {
      console.error('Error fetching golf data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchInitialData = async () => {
        setLoading(true);

        const eventId = await fetchTournamentCalendar();
        setCurrentEventId(eventId);
        setSelectedTournament(eventId);
        selectedTournamentRef.current = eventId; // Update ref
        if (eventId) {
          await fetchData(eventId);
        }
        setLoading(false);
      };

      fetchInitialData();

      intervalIdRef.current = setInterval(() => {
        if (selectedTournamentRef.current) {
          fetchData(selectedTournamentRef.current);
        }
      }, 10000); // Refresh every 10 seconds

      return () => {
        clearInterval(intervalIdRef.current); // Cleanup interval on blur
      };
    }, [sport])
  );

  useEffect(() => {
    fetchTournamentCalendar();
  }, [sport]);

  useEffect(() => {
    if (selectedTournament) {
      fetchData(selectedTournament);
    }
  }, [selectedTournament]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(selectedTournament);
    setRefreshing(false);
  };

  const handleTournamentChange = async (itemValue) => {
    const selectedTournament = availableTournaments.find(
      (tournament) => tournament.id === itemValue
    );
    if (selectedTournament) {
      setCurrentEventId(selectedTournament.id);
      setSelectedTournament(selectedTournament.id);
      selectedTournamentRef.current = selectedTournament.id; // Update ref
      setTournamentName(selectedTournament.label);
      await fetchData(selectedTournament.id);
      setTournamentModalVisible(false); // Close the modal after selection
    }
  };

  useEffect(() => {
    const index = dates.indexOf(selectedDate);
    setClosestDateIndex(index);
  }, [dates, selectedDate]);

  const onScrollToIndexFailed = useCallback((info) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 500));
    wait.then(() => {
      const offset = ITEM_WIDTH * info.index;
      try {
        flatListRef.current?.scrollToOffset({ offset, animated: true });
      } catch (error) {
        console.log('Error scrolling to index:', error);
      }
    });
  }, []);

  const renderPlayer = ({ item }) => (
    <TouchableOpacity
      style={styles.playerRow}
      onPress={() => {
        setSelectedPlayer(item);
        setModalVisible(true);
      }}>
      <View style={styles.leftContainer}>
        <Text style={styles.playerPosition}>{item.pl}</Text>
        <Text style={styles.playerName}>{item.name}</Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.playerToday}>{item.today}</Text>
        <Text style={styles.playerThru}>{item.thru}</Text>
        <Text style={styles.playerTotal}>{item.tot}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => {
    const competition = currentData ? currentData.events[0].competitions[0] : null;
    let roundNumber = competition ? competition.status.period : '';
    const statusType = competition ? competition.status.type.name : '';

    if (statusType === 'STATUS_PLAY_COMPLETE') {
      roundNumber += 1;
    }

    const headerText = roundNumber ? `R${roundNumber}` : 'Today';

    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => setTournamentModalVisible(true)}>
          <View style={styles.tournamentDropdown}>
            <Text style={styles.tournamentName}>{tournamentName}</Text>
            <Ionicons name="caret-down" size={15} color="white" marginLeft={5} />
          </View>
        </TouchableOpacity>
        <View style={styles.playerRow2}>
          <View style={styles.leftContainer}>
            <Text style={styles.headerPlayerPosition}>POS</Text>
            <Text style={styles.headerPlayerName}>PLAYER</Text>
          </View>
          <View style={styles.rightContainer}>
            <Text style={styles.headerPlayerToday}>{headerText}</Text>
            <Text style={styles.headerPlayerThru}>THRU</Text>
            <Text style={styles.headerPlayerTotal}>TOT</Text>
          </View>
        </View>
        <TournamentModal
          visible={tournamentModalVisible}
          tournaments={availableTournaments}
          selectedTournament={currentEventId}
          onClose={() => setTournamentModalVisible(false)}
          onSelect={handleTournamentChange}
          initialScrollIndex={closestDateIndex}
          flatListRef={flatListRef} // Pass the reference to the FlatList
        />
      </View>
    );
  };

  const TournamentModal = ({
    visible,
    tournaments,
    selectedTournament,
    onClose,
    onSelect,
    initialScrollIndex,
    flatListRef,
  }) => {
    return (
      <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
        <View style={styles.modalOverlay2}>
          <View style={styles.modalContent2}>
            <FlatList
              ref={flatListRef}
              data={tournaments}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.tournamentItem,
                    selectedTournament === item.id && styles.selectedTournamentItem,
                  ]}
                  onPress={() => onSelect(item.id)}>
                  <Text style={styles.tournamentItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.tournamentList}
              showsVerticalScrollIndicator={false}
              initialScrollIndex={initialScrollIndex}
              onScrollToIndexFailed={onScrollToIndexFailed}
            />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const PlayerModal = ({ visible, player, onClose, statusPeriod }) => {
    const [selectedRound, setSelectedRound] = useState(`R${statusPeriod || 1}`);
    const [lineScores, setLineScores] = useState({});
    const [playerData, setPlayerData] = useState(null);
    const [totScore, setTotScore] = useState(null);

    useEffect(() => {
      const fetchPlayerData = async () => {
        if (!player) return;

        const eventId = currentEventId; // Assuming currentEventId is available in the scope
        const playerId = player.id;

        try {
          const response = await fetch(
            `https://site.web.api.espn.com/apis/site/v2/sports/golf/${sport.toLowerCase()}/leaderboard/${eventId}/competitorsummary/${playerId}`
          );
          const data = await response.json();
          setPlayerData(data);

          if (data.rounds) {
            const totalScore = data.rounds.reduce((total, round) => {
              const roundScore = parseInt(round.displayValue, 10);
              return total + (isNaN(roundScore) ? 0 : roundScore);
            }, 0);

            // Format the totalScore to display "E" if 0, "+" if positive, or just the number if negative
            let formattedScore;
            if (totalScore > 0) {
              formattedScore = `+${totalScore}`;
            } else if (totalScore === 0) {
              formattedScore = 'E';
            } else {
              formattedScore = totalScore.toString();
            }

            setTotScore(formattedScore);
          }
        } catch (error) {
          console.error('Error fetching golf player data:', error);
        }
      };

      fetchPlayerData();
    }, [player]);

    useEffect(() => {
      const updateScoresForSelectedRound = () => {
        if (!playerData || !playerData.rounds) return;

        const roundIndex = parseInt(selectedRound.slice(1), 10) - 1;
        if (playerData.rounds[roundIndex] && playerData.rounds[roundIndex].linescores) {
          const roundLineScores = playerData.rounds[roundIndex].linescores.map((ls) => ({
            period: ls.period,
            score: ls.displayValue,
            par: ls.par,
          }));
          const outScore = playerData.rounds[roundIndex].outScore;
          const inScore = playerData.rounds[roundIndex].inScore;

          // Calculate the sum of the par scores for the "In" holes
          const inParScore = roundLineScores.slice(9).reduce((sum, ls) => sum + (ls.par || 0), 0);
          const outParScore = roundLineScores
            .slice(0, 9)
            .reduce((sum, ls) => sum + (ls.par || 0), 0);

          setLineScores({
            [selectedRound]: roundLineScores,
            outScore,
            inScore,
            inParScore,
            outParScore,
          });
        }
      };

      updateScoresForSelectedRound();
    }, [selectedRound, playerData]);

    if (!playerData) {
      // You can show a loading indicator here
      return null;
    }

    return (
      <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
            <View style={styles.modalPlayerInfo}>
              <Image
                source={{ uri: playerData?.competitor?.headshot }}
                style={styles.playerHeadshot}
              />
              <Text style={styles.modalPlayerName}>
                {player?.name} ({totScore})
              </Text>
            </View>
            <View style={styles.roundButtonsContainer}>
              {['R1', 'R2', 'R3', 'R4'].map((round) => (
                <TouchableOpacity
                  key={round}
                  style={[
                    styles.roundButton,
                    selectedRound === round && styles.selectedRoundButton,
                  ]}
                  onPress={() => setSelectedRound(round)}>
                  <Text style={styles.roundButtonText}>{round}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.scoresContainer}>
              <View style={styles.holeRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i} style={styles.headerHoleCell}>
                    {lineScores[selectedRound] ? lineScores[selectedRound][i]?.period : ''}
                  </Text>
                ))}
                <Text style={[styles.scoreCell, styles.headerCell]}>Out</Text>
              </View>
              <View style={styles.scoreRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i} style={styles.scoreCell}>
                    {lineScores[selectedRound] ? lineScores[selectedRound][i]?.par : ''}
                  </Text>
                ))}
                <Text style={styles.scoreCell}>{lineScores.outParScore}</Text>
              </View>
              <View style={styles.scoreRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i} style={styles.scoreCell}>
                    {lineScores[selectedRound] ? lineScores[selectedRound][i]?.score : ''}
                  </Text>
                ))}
                <Text style={styles.scoreCell}>{lineScores.outScore}</Text>
              </View>

              <View style={styles.holeRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i + 9} style={styles.headerHoleCell}>
                    {lineScores[selectedRound] ? lineScores[selectedRound][i + 9]?.period : ''}
                  </Text>
                ))}
                <Text style={[styles.scoreCell, styles.headerCell]}>In</Text>
              </View>
              <View style={styles.scoreRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i + 9} style={styles.scoreCell}>
                    {lineScores[selectedRound] ? lineScores[selectedRound][i + 9]?.par : ''}
                  </Text>
                ))}
                <Text style={styles.scoreCell}>{lineScores.inParScore}</Text>
              </View>
              <View style={styles.scoreRow}>
                {[...Array(9).keys()].map((i) => (
                  <Text key={i + 9} style={styles.scoreCell}>
                    {lineScores[selectedRound] ? lineScores[selectedRound][i + 9]?.score : ''}
                  </Text>
                ))}
                <Text style={styles.scoreCell}>{lineScores.inScore}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="lightgrey" />
    </View>
  ) : (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer} />
      <View style={styles.header}>
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.headerText}>{sport}</Text>
          <MaterialIcons name="sports-golf" size={24} color="white" marginLeft={5} />
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={25} color="white" marginRight={10} />
          </TouchableOpacity>
          <TouchableOpacity>
            <AntDesign name="search1" size={25} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ flex: 1, backgroundColor: 'black', paddingHorizontal: 10, paddingBottom: 10 }}>
        <FlatList
          data={playersData}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#888" />
          }
          ListHeaderComponent={renderHeader}
        />
        <PlayerModal
          visible={modalVisible}
          player={selectedPlayer}
          onClose={() => setModalVisible(false)}
          statusPeriod={selectedPlayer?.statusPeriod}
        />
      </View>
      <NavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    height: 50,
  },
  tournamentDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  tournamentName: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.25,
    borderBottomColor: '#ddd',
  },
  playerRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7.5,
    borderBottomWidth: 0.25,
    borderBottomColor: '#ddd',
  },
  leftContainer: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'center',
  },
  headerPlayerPosition: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerName: {
    color: 'white',
    flex: 4,
    textAlign: 'left',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  headerPlayerToday: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerThru: {
    flex: 1.5,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  headerPlayerTotal: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  playerPosition: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  playerName: {
    color: 'white',
    flex: 4,
    textAlign: 'left',
  },
  playerToday: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  playerThru: {
    flex: 1.5,
    textAlign: 'center',
    color: 'white',
  },
  playerTotal: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
  },
  listContent: {
    paddingHorizontal: 5,
  },
  headshot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    height: '75%',
    padding: 10,
    backgroundColor: 'lightgrey',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalOverlay2: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent2: {
    width: '100%',
    height: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalPlayerInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  playerHeadshot: {
    width: 80,
    height: 80,
    borderRadius: 40, // For a circular image
    marginBottom: 10, // Add some spacing between the image and name
  },
  modalPlayerName: {
    fontSize: 18,
  },
  roundButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  roundButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'gray',
  },
  selectedRoundButton: {
    backgroundColor: 'blue',
  },
  roundButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scoresContainer: {
    alignItems: 'center',
  },
  holeRow: {
    flexDirection: 'row',
    marginVertical: 10,
    backgroundColor: 'lightgrey',
  },
  headerHoleCell: {
    width: 30,
    textAlign: 'center',
    color: 'black',
    fontWeight: 'bold',
  },
  scoreRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  scoreCell: {
    width: 30,
    textAlign: 'center',
    color: 'black',
  },
  headerCell: {
    fontWeight: 'bold',
  },
  tournamentList: {
    alignItems: 'center',
  },
  tournamentItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
    alignItems: 'flex-start',
  },
  selectedTournamentItem: {
    backgroundColor: '#ddd',
  },
  tournamentItemText: {
    fontSize: 16,
    textAlign: 'left',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default GOLF;
