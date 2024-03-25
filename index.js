const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 4004;

// Load combined data
const combinedData = require('./combined_data_copy.json');

// Function to retrieve team data
const getTeamData = (teamName) => {
    const teamDataFiltered = combinedData.filter(data => data.team === teamName || data.team_opp === teamName);
    if (teamDataFiltered.length === 0) {
        throw new Error(`No data found for team: ${teamName}`);
    }

    const numericColumns = ['goals_scored', 'shots_on_goal', 'save_percentage', 'faceoff_win_percentage', 'power_play_goals', 'power_play_opportunities', 'shots_on_goal_opp', 'penalty_kill_goals', 'player_weight'];

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

    // Prepare features for scaling
    const featuresTeam1 = ['goals_scored', 'shots_on_goal', 'save_percentage', 'faceoff_win_percentage', 'power_play_goals', 'power_play_opportunities', 'shots_on_goal_opp', 'penalty_kill_goals', 'player_weight'].map(col => team1Data[col]);
    const featuresTeam2 = ['goals_scored', 'shots_on_goal', 'save_percentage', 'faceoff_win_percentage', 'power_play_goals', 'power_play_opportunities', 'shots_on_goal_opp', 'penalty_kill_goals', 'player_weight'].map(col => team2Data[col]);

    // Assuming you have a model object for prediction
    const predictionTeam1 = model.predict([featuresTeam1, team1PlayerWeight]);
    const predictionTeam2 = model.predict([featuresTeam2, team2PlayerWeight]);

    // Interpret the prediction
    let winner;
    if (predictionTeam1[0] > 0.5) {
        winner = team1Name;
    } else {
        winner = team2Name;
    }

    return `${winner} is predicted to win`;
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
