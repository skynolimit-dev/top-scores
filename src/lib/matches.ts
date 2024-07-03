import { apiUrlPrefix, matchFilters, requestTimeout } from './globals';

import { getPreference, getPreferences } from '../lib/user';
import { predictorSettings } from './globals';

import _ from 'lodash';

import axios from 'axios';
axios.defaults.timeout = requestTimeout;
axios.defaults.headers.common['Cache-Control'] = 'no-cache';
axios.defaults.headers.common['Pragma'] = 'no-cache';
axios.defaults.headers.common['Expires'] = '0';

let matchesInitialized = false;
let previousFetchTime: any = {};
let previousFetchResultTimes = {
    good: new Date().getTime(),
    bad: 0
}
let refreshBackOffTime = 0;

export let matches = {
    fixtures: [],
    results: [],
    onTv: [],
    predictor: [],
    error: {
        fixtures: false,
        results: false,
        onTv: false
    }
};

export let counts = {
    now: 0,
    today: 0,
    nowOnTv: 0,
    todayOnTv: 0
};

let timeoutsFetchData: any = {};
let timeoutsCheckForMatchUpdates: any = {};
let timeoutUpdatePredictorMatches: any;

// Update the match counts regularly (to ensure the badges are up to date)
setInterval(() => {
    setMatchCountNow();
    setMatchCountToday();
    setMatchCountNowOnTv();
    setMatchCountTodayOnTv();
}, 500);

// Gets the match filter based on the window location
export function getMatchFilter() {
    const path = window.location.pathname;
    if (path === '/' || path.includes('fixtures'))
        return 'fixtures';
    else if (path.includes('matchesOnTv'))
        return 'onTv';
    else if (path.includes('results'))
        return 'results';
    else if (path.includes('matchesPredictor'))
        return 'predictor';
    return '';
}

// Initialize the matches
export async function initMatches(deviceId: string, store: any, retryIntervalMilliseconds = 0) {

    const preferences = await getPreferences(store);
    const competitions = _.get(preferences, 'competitions', []);
    const clubTeams = _.get(preferences, 'clubTeams', []);
    const internationalTeams = _.get(preferences, 'internationalTeams', []);

    console.info('Initialising matches...');

    if (competitions.length === 0 && clubTeams.length === 0 && internationalTeams.length === 0) {
        console.info('No competitions or teams of interest!');
        matchesInitialized = true;
        return;
    }

    // Fetch the match data for each filter in parallel
    let promises = [];
    for (const matchFilter of matchFilters) {
        promises.push(fetchData(matchFilter, deviceId, true));
    }

    await Promise.all(promises);
    matchesInitialized = true;

    // Check we actually have some data
    if (_.get(matches, 'fixtures') && _.get(matches, 'fixtures').length > 0) {
        console.info('Matches initialized');
        setMatchCountNow();
        setMatchCountToday();
        setMatchCountNowOnTv();
        setMatchCountTodayOnTv();
    } else {
        // Add a backoff (up to a maximum of 1 hour) and retry
        if (retryIntervalMilliseconds < 60 * 60 * 1000)
            retryIntervalMilliseconds += 5000;
        console.info('No match data found, will retry in', retryIntervalMilliseconds, 'milliseconds...');
        await new Promise(r => setTimeout(r, retryIntervalMilliseconds));
        initMatches(deviceId, store, retryIntervalMilliseconds);
    }

}

export function areMatchesInitialized() {
    return matchesInitialized;
}

// Fetch the match data from the server
async function fetchData(matchFilter: string, deviceId: string, forceUpdate = false) {

    // If we've fetched data for this filter in the last 5 seconds, then we don't fetch it again
    if (!matchFilter || matchFilter.length === 0 || (!forceUpdate && previousFetchTime[matchFilter] && new Date().getTime() - previousFetchTime[matchFilter] < 5000))
        return;

    // Otherwise, fetch the data
    else {
        previousFetchTime[matchFilter] = new Date().getTime();
        const url = `${apiUrlPrefix}/user/${deviceId}/matches/${matchFilter}`;

        try {
            const result = await axios(url);
            if (result && result.data) {
                _.set(previousFetchResultTimes, 'good', new Date().getTime());
                if (result.data.length > 0)
                    _.set(matches, matchFilter, result.data);
            } else {
                _.set(previousFetchResultTimes, 'bad', new Date().getTime());
            }
        } catch (error) {
            _.set(previousFetchResultTimes, 'bad', new Date().getTime());
            console.error(`Error fetching match data from ${url}`, error);
            _.set(matches, `error.${matchFilter}`, true);
        } finally {
            if (timeoutsFetchData[matchFilter])
                clearTimeout(timeoutsFetchData[matchFilter]);
            checkForMatchUpdates(deviceId);
        }
    }
}

// Checks if we need to call fetchData to get match updates, based on the match filter and kick off dates/times
// When a predictor match is started, this is called to force an immediate update
export async function checkForMatchUpdates(deviceId: string, forceUpdate = false) {

    const matchFilter = getMatchFilter();

    if (timeoutsCheckForMatchUpdates[matchFilter])
        clearTimeout(timeoutsCheckForMatchUpdates[matchFilter]);

    // If we want to force an update (e.g. a predictor game kicks off), then we fetch data immediately
    if (forceUpdate) {
        await fetchData(matchFilter, deviceId, forceUpdate);
        checkForMatchUpdates(deviceId);
    } else {
        // Otherwise, we check the refresh interval and fetch data after that time
        const refreshInterval = getRefreshInterval();
        timeoutsFetchData[matchFilter] = setTimeout(() => {
            fetchData(matchFilter, deviceId);
        }, refreshInterval);
    }

    // Repeat the check every second
    if (timeoutsCheckForMatchUpdates[matchFilter])
        clearTimeout(timeoutsCheckForMatchUpdates[matchFilter]);
    timeoutsCheckForMatchUpdates[matchFilter] = setTimeout(() => {
        checkForMatchUpdates(deviceId);
    }, 1 * 1000);

}

// Returns the refresh interval for the given matches, based on the following logic:
// 1. If any matches are currently being played, refresh every 5 seconds
// 2. Otherwise, return a refresh interval 
function getRefreshInterval() {

    const matchFilter = getMatchFilter();
    const filteredMatches = _.get(matches, matchFilter);

    // Otherwise, if we didn't get any matches, or there was an error, then we fetch data after a backoff
    if (!filteredMatches || _.get(matches, `error.${matchFilter}`)) {
        if (refreshBackOffTime < 60 * 5 * 1000)
            refreshBackOffTime += 5000;
        return refreshBackOffTime;
    }

    else if (matchFilter === 'results')
        return getRefreshIntervalForResults();

    // Otherwise, check for matches in play or the next kick off date/time
    else {
        let fixtures = [];
        if (filteredMatches && filteredMatches.length > 0) {

            // If any matches are in play (i.e. have a "timeLabel" attribute), then we fetch data every 5 seconds
            if (_.find(filteredMatches, (match: any) => match.timeLabel && match.timeLabel !== 'FT' && match.timeLabel !== 'AET')) {
                if (matchFilter === 'predictor') {
                    return 1 * 1000;
                }
                else {
                    return 5 * 1000;
                }
            }

            // If we're looking at the predictor matches, then we fetch data every 5 seconds by default
            // This is to cater for the case where a user changes the speed of a match in the preferences
            // screen, the match then finishes, but the user won't see the result until the next fetch
            else if (matchFilter === 'predictor') {
                return 1 * 5000;
            }

            // Otherwise, we find the next match to kick off (by iterating through the matches array and checking the "dateTimeUtc" attribute),
            // and fetch data at that time
            else {
                // Only check matches where the date is today
                fixtures = filteredMatches.filter((match: any) => new Date(match.dateTimeUtc).getTime() >= new Date().getTime());
                // Filter out any messages that include a status message of "FT" or "AET"
                fixtures = fixtures.filter((match: any) => !match.timeLabel || (match.timeLabel && match.timeLabel !== 'FT' && match.timeLabel !== 'AET'));
                // Then grab the date/time of the next match to kick off
                const nextMatch = _.minBy(filteredMatches, (match: any) => match.dateTimeUtc);
                if (nextMatch) {
                    // Calculate the time to the next match
                    const timeToNextMatch = new Date(nextMatch.dateTimeUtc).getTime() - new Date().getTime();
                    if (timeToNextMatch > 0) {
                        // If the next match kicks off in more than 60 seconds, then we fetch data after that time
                        return timeToNextMatch - 60 * 1000 ? timeToNextMatch : 60 * 1000;
                    } else {
                        return 5 * 1000;
                    }
                } else {
                    // If we can't find a match to kick off, then we fetch data after 60 seconds
                    return 60 * 1000;
                }
            }
        }

        return 60 * 1000;

    }
}

// Returns the refresh interval for results
function getRefreshIntervalForResults() {

    const results = _.get(matches, 'results');
    const fixtures = _.get(matches, 'fixtures');

    // If any matches from today are still in play, i.e. started and not yet finished, then we return 5 seconds
    if (fixtures && fixtures.length > 0) {
        const resultsIds = results.map((match: any) => match.id);
        const matchesToCheck = fixtures.filter((match: any) => match.started && !match.finished);
        if (matchesToCheck && matchesToCheck.length > 0) {
            return 5000;
        }
    }

    // Otherwise, return 1 hour
    return 60 * 60 * 1000;

}

// Return the matches for the given match filter
export function getMatches() {
    const matchFilter = getMatchFilter();
    return _.get(matches, matchFilter);
}

// Sets the count of matches being played currently,
// i.e. those that have a "timeLabel" attribute
function setMatchCountNow() {
    const matchesToFilter = _.get(matches, 'fixtures');
    if (matchesToFilter && matchesToFilter.length > 0)
        _.set(counts, 'now', _.filter(matchesToFilter, (match: any) => match.timeLabel && match.timeLabel !== 'FT' && match.timeLabel !== 'AET').length);
}

// Sets the count of the matches being played today
// Used to display a badge on the Now & Next icon
function setMatchCountToday() {
    // Filter on matches with today's date (e.g. "2024-04-25")
    const today = new Date().toISOString().split('T')[0];
    const matchesToFilter = _.get(matches, 'fixtures');
    if (matchesToFilter && matchesToFilter.length > 0)
        _.set(counts, 'today', matchesToFilter.filter((match: any) => match.date === today && ((match.timeLabel && match.timeLabel !== 'FT' && match.timeLabel !== 'AET') || match.kickOffTime)).length);
}

// Sets the count of matches on TV playing now
// Used to display a badge on the TV icon
function setMatchCountNowOnTv() {
    const matchesToFilter = _.get(matches, 'fixtures');
    if (matchesToFilter && matchesToFilter.length > 0)
        _.set(counts, 'nowOnTv', matchesToFilter.filter((match: any) => match.timeLabel && match.timeLabel !== 'FT' && match.timeLabel !== 'AET' && match.tvInfo && match.tvInfo.channelInfo && match.tvInfo.channelInfo.shortName).length);
}

// Sets the count of matches on TV for today
// Used to display a badge on the TV icon
function setMatchCountTodayOnTv() {
    // Filter on matches with today's date (e.g. "2024-04-25")
    const today = new Date().toISOString().split('T')[0];
    const matchesToFilter = _.get(matches, 'fixtures');
    if (matchesToFilter && matchesToFilter.length > 0) {
        // First, find matches on now
        let filteredMatches = matchesToFilter.filter((match: any) => match.date === today && ((match.timeLabel && match.timeLabel !== 'FT' && match.timeLabel !== 'AET') || match.kickOffTime));
        // Then, filter on matches with TV info
        _.set(counts, 'todayOnTv', filteredMatches.filter((match: any) => match.tvInfo && match.tvInfo.channelInfo && match.tvInfo.channelInfo.shortName).length);
    }
}

// Control (kick off) the given predictor match
export async function controlPredictorMatch(matchId: string, store: any) {
    let predictorMatchIds = await store.get('predictorMatchIds');
    let predictorMatch: any;
    if (predictorMatchIds && predictorMatchIds.includes(matchId)) {
        const existingMatch = await store.get(`predictorMatch-${matchId}`);
        predictorMatch = existingMatch;
    } else {
        const match = _.get(matches, 'fixtures').find((match: any) => match.id === matchId);
        // Copy the match object using JSON stringify/parse, add it to the predictor matches array, and kick off the match
        predictorMatch = JSON.parse(JSON.stringify(match));

        // TODO: Limit number of predictor matches to 200

        // Add the predictor match ID to the predictor match IDs array in local storage
        if (!predictorMatchIds)
            predictorMatchIds = [matchId];
        else
            predictorMatchIds.push(matchId);
        await store.set('predictorMatchIds', predictorMatchIds);
    }

    // Kick the match off
    kickOffPredictorMatch(predictorMatch, store);

}

// Kicks off a predictor match
async function kickOffPredictorMatch(match: any, store: any) {
    console.info('Kicking off Predictor match:', match.homeTeam.names.displayName, 'vs', match.awayTeam.names.displayName);
    _.set(match, 'predictorMatchStatus', 'inPlay');
    _.set(match, 'homeTeam.score', 0);
    _.set(match, 'awayTeam.score', 0);
    _.set(match, 'time', 1);
    _.set(match, 'timeLabel', "1'");
    _.set(match, 'statusMessages', []);

    store.set(`predictorMatch-${match.id}`, match);
}

// Updates all predictor matches in play
export async function updatePredictorMatches(store: any) {
    const predictorMatchIds = await store.get('predictorMatchIds');
    if (predictorMatchIds && predictorMatchIds.length > 0) {
        for (const matchId of predictorMatchIds) {
            updatePredictorMatch(matchId, store);
        }
    }

    // Repeat the updates as per the refresh interval
    const refreshInterval = await getPredictorRefreshInterval(store);
    if (timeoutUpdatePredictorMatches)
        clearTimeout(timeoutUpdatePredictorMatches);
    timeoutUpdatePredictorMatches = setTimeout(() => {
        updatePredictorMatches(store);
    }, Number(refreshInterval));
}

async function getPredictorRefreshInterval(store: any) {

    // If there are no matches in play, return 1 second
    const matchesInPlayCount = await getPredictorMatchesInPlayCount(store);
    if (matchesInPlayCount === 0)
        return 1000;

    // Get the default value from the config, or use fast by default
    let refreshInterval = _.get(predictorSettings, 'refreshIntervalMilliseconds') || 100;

    const predictorPreferences = await getPreference(store, 'predictor');
    const predictorSpeedPreference = _.get(predictorPreferences, 'speed');

    if (predictorSpeedPreference)
        refreshInterval = _.get(predictorSettings, `refreshIntervalMilliseconds[${predictorSpeedPreference}]`) || refreshInterval;

    // Return the final refresh interval
    return refreshInterval;
}

async function getPredictorMatchesInPlayCount(store: any) {
    const predictorMatchIds = await store.get('predictorMatchIds');
    let count = 0;
    if (predictorMatchIds && predictorMatchIds.length > 0) {
        for (const matchId of predictorMatchIds) {
            const match = await store.get(`predictorMatch-${matchId}`);
            if (match && match.predictorMatchStatus === 'inPlay')
                count++;
        }
    }
    return count;
}

// Updates a predictor match
async function updatePredictorMatch(matchId: string, store: any) {
    let match = await store.get(`predictorMatch-${matchId}`);

    const status = _.get(match, 'predictorMatchStatus');

    if (status !== 'finished') {

        const time = _.get(match, 'time');

        if (time < 90) {
            updateMatchScore(match);
            _.set(match, 'time', time + 1);
            _.set(match, 'timeLabel', `${time + 1}'`);
        } else {
            console.info('Predictor match finished:', match.homeTeam.names.displayName, match.homeTeam.score, '-', match.awayTeam.score, match.awayTeam.names.displayName);
            _.set(match, 'time', 90);

            _.set(match, 'timeLabel', 'FT');
            _.set(match, 'statusMessages', ['FT']);
            _.set(match, 'predictorMatchStatus', 'finished');

            // If the scores are level and the competition subheading is 'Final', add extra time
            // TODO: Add extra time
            if (match.homeTeam.score === match.awayTeam.score && match.competition.subHeading === 'Final') {
                console.info('Scores are level, so going to penalties...');
                match.statusMessages.push(getPenaltyWinnerLabel(match));
            }
        }

        // Update the predictor match in local storage
        await store.set(`predictorMatch-${matchId}`, match);

    }

}

// Returns the label for the penalty winner, which is decided at random
function getPenaltyWinnerLabel(match: any) {
    const winner = Math.random() < 0.5 ? match.homeTeam.names.displayName : match.awayTeam.names.displayName;
    return `Predicted penalty shoot-out winner: ${winner}`;
}

// Update the match score
function updateMatchScore(match: any) {
    match.homeTeam.score += updateScoreForTeam(match.homeTeam, match.awayTeam);
    match.awayTeam.score += updateScoreForTeam(match.awayTeam, match.homeTeam);
}

// Updates the score for the given team
// Based on the teams respective ratings, calculate the chances of a goal being scored for the team
// The higher the difference between the ratings, the more chance of a goal being scored
// This function will be called approximately once every match minute, i.e. 90 times per match
// Generally, teams tend to score a maximum of 2 or 3 goals per match, although this can vary
// depending on the teams' ratings and the match circumstances
function updateScoreForTeam(team1: any, team2: any) {
    const ratingPercentDifference = (100 - ((team2.rating / team1.rating) * 100)) * predictorSettings.teamRatingDifferential;
    // console.debug('Rating percent difference for', team1.names.displayName, ':', ratingPercentDifference);
    const goalChance = predictorSettings.goalChancePerMinute + ((ratingPercentDifference / 100) * predictorSettings.goalChancePerMinute);   // Add on the percentage difference
    // console.debug('Goal chance for', team1.names.displayName, '(', team1.rating, '):', goalChance);
    const scoreIncrement = Math.random() < goalChance ? 1 : 0;
    return scoreIncrement;
}



// Returns the match counts object
export function getMatchCounts() {
    return counts;
}