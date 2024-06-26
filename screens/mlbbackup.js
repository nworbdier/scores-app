const renderMLBComponent = () => {
    const renderItem = ({ item, index }) => {
      const containerStyle = [
        styles.itemContainer,
        item.Status === 'STATUS_IN_PROGRESS' && { borderColor: 'lightgreen' },
        item.Status === 'STATUS_RAIN_DELAY' && { borderColor: 'yellow' },
      ];

      const maxTotalScore = 200; // Example maximum total score
      const maxScore = 100; // Example maximum individual score

      const excitementScore = (() => {
        const totalScore = item.HomeScore + item.AwayScore;
        const normalizedTotalScore = (totalScore / maxTotalScore) * 10;

        const scoreDifference = Math.abs(item.HomeScore - item.AwayScore);
        const normalizedCloseness = (1 - scoreDifference / maxScore) * 10;

        const rawExcitementScore = (normalizedTotalScore + normalizedCloseness) / 2;
        return Math.min(rawExcitementScore, 10);
      })();

      return (
        <TouchableOpacity
          style={containerStyle}
          onPress={() => navigation.navigate('MLBDetails', { eventId: item.id })}>
          <View style={{ flexDirection: 'column' }}>
            <View style={styles.column}>
              <Image source={{ uri: item.AwayLogo }} style={styles.image} />
              <View style={{ flexDirection: 'column', marginLeft: 10 }}>
                {item.Status === 'STATUS_SCHEDULED' ? (
                  <Text style={styles.score}>{item.AwayTeamRecordSummary}</Text>
                ) : (
                  <Text style={styles.score}>{item.AwayScore}</Text>
                )}
                <Text style={styles.TextStyle1}>{item.AwayTeam}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Image source={{ uri: item.HomeLogo }} style={styles.image} />
              <View style={{ flexDirection: 'column', marginLeft: 10 }}>
                {item.Status === 'STATUS_SCHEDULED' ? (
                  <Text style={styles.score}>{item.HomeTeamRecordSummary}</Text>
                ) : (
                  <Text style={styles.score}>{item.HomeScore}</Text>
                )}
                <Text style={styles.TextStyle1}>{item.HomeTeam}</Text>
              </View>
            </View>
          </View>
          <View style={styles.column2}>
            {item.Status === 'STATUS_SCHEDULED' ? (
              <View style={styles.column2}>
                <Text style={styles.gametime}>{formatGameTime(item.GameTime)}</Text>
              </View>
            ) : item.Status === 'STATUS_FINAL' ? (
              <View style={styles.column2}>
                <View flexDirection="row" justifyContent="center" alignItems="center">
                  <Image source={require('../assets/VsLogo.jpeg')} style={styles.image} />
                  <Text style={styles.TextStyle2}>{excitementScore.toFixed(1)}</Text>
                </View>
                <Text style={styles.gametime}>{item.StatusShortDetail}</Text>
              </View>
            ) : item.Status === 'STATUS_RAIN_DELAY' ? (
              <View style={styles.column2}>
                <Text style={[styles.TextStyle2, { fontWeight: 'bold' }]}>Rain Delay</Text>
              </View>
            ) : item.Status === 'STATUS_POSTPONED' ? (
              <View style={styles.column2}>
                <Text style={[styles.TextStyle2, { fontWeight: 'bold' }]}>Postponed</Text>
              </View>
            ) : (
              <View style={styles.column2}>
                <View flexDirection="row" justifyContent="center" alignItems="center">
                  <Image source={require('../assets/VsLogo.jpeg')} style={styles.image} />
                  <Text style={styles.TextStyle2}>{excitementScore.toFixed(1)}</Text>
                </View>
                <View style={styles.gameTime}>
                  {item.StatusShortDetail.includes('Top') && (
                    <Text style={[styles.inning]}>Top {item.Inning}</Text>
                  )}
                  {item.StatusShortDetail.includes('Mid') && (
                    <Text style={[styles.inning]}>Mid {item.Inning}</Text>
                  )}
                  {item.StatusShortDetail.includes('Bot') && (
                    <Text style={[styles.inning]}>Bot {item.Inning}</Text>
                  )}
                  {item.StatusShortDetail.includes('End') && (
                    <Text style={[styles.inning]}>End {item.Inning}</Text>
                  )}
                </View>
                {renderBasesComponent(item.First, item.Second, item.Third)}

                <View>
                  {item.Outs !== null && <Text style={styles.TextStyle2}>{item.Outs} Outs</Text>}
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    };