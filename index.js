const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');


const app = express();
const PORT = 4000

// Load combined data
const combinedData = require('./combined_data_copy.json');

// Function to get team data
const getTeamData = (teamName) => {
    const teamDataFiltered = combinedData.filter(data => data.team === teamName || data.team_opp === teamName);
    if (teamDataFiltered.length === 0) {
        throw new Error(`No data found for team: ${teamName}`);
    }
    const numericColumns = ['HTR', 'Acc', 'Cons', 'FH', 'TRI', 'PC', 'player_weight'];
    const teamDataNumeric = teamDataFiltered.map(data => numericColumns.map(col => data[col]));
    const teamDataMean = numericColumns.reduce((acc, col, index) => {
        acc[col] = teamDataNumeric.reduce((sum, data) => sum + data[index], 0) / teamDataNumeric.length;
        return acc;
    }, {});
    const averagePlayerWeight = combinedData.filter(data => data.Tm === teamName).reduce((sum, data) => sum + data.player_weight, 0) / combinedData.filter(data => data.Tm === teamName).length;
    return { teamDataMean, averagePlayerWeight };
};

// Function to predict game outcome
const predictGameOutcome = (team1Name, team2Name) => {
    const { teamDataMean: team1Data, averagePlayerWeight: team1PlayerWeight } = getTeamData(team1Name);
    const { teamDataMean: team2Data, averagePlayerWeight: team2PlayerWeight } = getTeamData(team2Name);

    const featuresTeam1 = ['HTR', 'Acc', 'Cons', 'FH', 'TRI', 'PC', 'player_weight'].map(col => team1Data[col]).concat([team1PlayerWeight]);
    const featuresTeam2 = ['HTR', 'Acc', 'Cons', 'FH', 'TRI', 'PC', 'player_weight'].map(col => team2Data[col]).concat([team2PlayerWeight]);

    const inputFeatures = tf.tensor2d([featuresTeam1, featuresTeam2]);

    const predictions = model.predict(inputFeatures).arraySync();

    if (predictions[0] > 0.5) {
        return `${team1Name} is predicted to win against ${team2Name}`;
    } else {
        return `${team2Name} is predicted to win against ${team1Name}`;
    }
};

// Route to predict game outcome
app.post('/game_outcome', (req, res) => {
    const { team1_name, team2_name } = req.body;
    try {
        const prediction = predictGameOutcome(team1_name, team2_name);
        res.json({ prediction });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
