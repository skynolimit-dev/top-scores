import CompetitionRow from '../components/Matches/CompetitionRow';
import DateRow from '../components/Matches/DateRow';
import MatchInfoRow from '../components/Matches/MatchInfoRow';
import MatchStatusRow from '../components/Matches/MatchStatusRow';

import { IonContent, IonGrid, IonHeader, IonPage, IonRefresher, IonRefresherContent, IonSearchbar, IonTitle, IonToolbar, RefresherEventDetail } from '@ionic/react';
import _ from 'lodash';
import moment from 'moment';
import React, { Fragment, useEffect, useState } from 'react';

import NoMatches from '../components/Matches/NoMatches';

import './Matches.css';

let timeoutUpdateMatchFilter: any;
let timeoutRefreshMatchData: any;

interface ContainerProps {
    title: string;
    getMatchFilter: Function;
    checkForMatchUpdates: Function;
    controlPredictorMatch: Function;
    updatePredictorMatches: Function;
    deviceId: string;
    logoCache: string[];
    store: any;
    matches: any;
}

function getMatchSearchResults(searchQuery: string, matches: any) {
    searchQuery = searchQuery.trim().toLowerCase();
    return matches.filter((match: any) => {
        const competitionFullName = match.competition.name + ' ' + match.competition.subHeading;
        const competitionFriendlyDate = moment(match.date).format('dddd, MMMM Do');
        const tvChannelName = _.get(match, 'tvInfo.channelInfo.fullName', '').toString();
        return match.homeTeam.names.displayName.toLowerCase().includes(searchQuery) ||
            match.awayTeam.names.displayName.toLowerCase().includes(searchQuery) ||
            match.competition.name.toLowerCase().includes(searchQuery) ||
            match.competition.subHeading.toLowerCase().includes(searchQuery) ||
            competitionFullName.toLowerCase().includes(searchQuery) ||
            competitionFriendlyDate.toLowerCase().includes(searchQuery) ||
            tvChannelName.toLowerCase().includes(searchQuery) ||
            searchQuery === 'today' && moment(match.date).isSame(moment(), 'day') ||
            searchQuery === 'tomorrow' && moment(match.date).isSame(moment().add(1, 'day'), 'day')
    });
}

// Return the matches for the given match filter
export function getMatchesForFilter(matchFilter: string, matches: any) {
    return _.get(matches, matchFilter);
}

async function getPredictorMatches(store: any) {
    let predictorMatches = [];
    const predictorMatchIds = await store.get('predictorMatchIds') || [];
    for (const predictorMatchId of predictorMatchIds) {
        const predictorMatch = await store.get(`predictorMatch-${predictorMatchId}`);
        if (predictorMatch)
            predictorMatches.push(predictorMatch);
    }
    return predictorMatches;
}

const Matches: React.FC<ContainerProps> = ({ title, matches, getMatchFilter, checkForMatchUpdates, controlPredictorMatch, updatePredictorMatches, store, logoCache, deviceId }) => {

    const [matchFilter, setMatchFilter] = useState(getMatchFilter());
    const [filteredMatches, setFilteredMatches] = useState([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [predictorMatches, setPredictorMatches] = useState<any[]>([]);
    const [predictorMatchUpdatesStarted, setPredictorMatchUpdatesStarted] = useState(false);

    const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
        await (setLatestMatchData(true, searchQuery));
        event.detail.complete();
        location.reload();
    };

    // Set the latest match data in the state
    async function setLatestMatchData(forceUpdate: boolean = false, searchQueryForce: string = '') {

        setMatchFilter(getMatchFilter());

        // Load and set the predictor matches
        if (matchFilter === 'predictor') {
            const predictorMatches = await getPredictorMatches(store);
            setPredictorMatches(predictorMatches);
        }

        // Only update the data if we haven't done so recently...
        if (forceUpdate || !lastUpdated || (new Date().getTime() - lastUpdated.getTime()) >= 500) {
            let filteredMatches = await getMatchesForFilter(matchFilter, matches);

            // Wait for the filteredMatches array to populate, before setting the state
            let retryCount = 0;
            while ((!filteredMatches || filteredMatches.length === 0) && retryCount < 10) {
                await new Promise(r => setTimeout(r, 100));
                filteredMatches = await getMatchesForFilter(matchFilter, matches);
                retryCount++;
            }

            // Special rules apply for the Predictor tab...
            if (matchFilter === 'predictor') {
                // Start the predictor match updates if we haven't already
                if (!predictorMatchUpdatesStarted) {
                    setPredictorMatchUpdatesStarted(true);
                    updatePredictorMatches(store);
                }
                
                // TODO: Restore, only for non-predictor matches!
                // Remove any matches that have a status message of "FT" or "AET"
                // or don't have a predictorMatchStatus attribute
                filteredMatches = filteredMatches.filter((match: any) => {
                    return match.predictorMatchStatus || !['FT', 'AET'].includes(match.timeLabel);
                });
                // Apply any predictor matches
                filteredMatches = filteredMatches.map((match: any) => {
                    const predictorMatch = _.find(predictorMatches, { id: match.id });
                    if (predictorMatch)
                        match = predictorMatch;
                    return match;
                });
            }

            // Apply search query to filter matches
            if (searchQueryForce && searchQueryForce.length > 0)
                filteredMatches = getMatchSearchResults(searchQueryForce, filteredMatches);
            if (searchQuery && searchQuery.length > 0)
                filteredMatches = getMatchSearchResults(searchQuery, filteredMatches);

            setFilteredMatches(filteredMatches || []);
            setLastUpdated(new Date());
        }

        // Repeat call every second
        if (timeoutRefreshMatchData)
            clearTimeout(timeoutRefreshMatchData);
        timeoutRefreshMatchData = setTimeout(setLatestMatchData, 500); // TODO: Review this interval
    }

    const handleSearchInput = async (ev: Event) => {
        const target = ev.target as HTMLIonSearchbarElement;
        setLatestMatchData(true, target.value || '');
        setSearchQuery(target.value || '');
    };

    async function updateMatchFilter() {
        setMatchFilter(getMatchFilter());
        // Repeat the call every second
        if (timeoutUpdateMatchFilter)
            clearTimeout(timeoutUpdateMatchFilter);
        timeoutUpdateMatchFilter = setTimeout(updateMatchFilter, 100);
    }

    useEffect(() => {
        // Update the match filter (e.g. "fixtures", "onTv", "results", "predictor"), and set the latest match data
        updateMatchFilter();
        setLatestMatchData();

        // Clear the interval when the component is unmounted (otherwise things get crazy!)
        return () => clearInterval(timeoutRefreshMatchData);

    }, [filteredMatches, matchFilter, searchQuery]);

    // Display a header row with the date for each new date we encounter
    // e.g. "Sunday, July 6th"
    const renderDateRow = (data: any[], index: any) => {
        const previousDate = _.get(data, `[${index - 1}].date`, '');
        const matchDate = _.get(data, `[${index}].date`, '');
        const matchId = _.get(data, `[${index}].id`, 0);
        if (previousDate !== matchDate) {
            return (
                <DateRow key={`date-row-container-${matchId}`} matchId={matchId} date={matchDate} />
            )
        }
    }

    // Display a header row with the competition name for each new competition/subheading we encounter
    // Also display the competition row if we encounter a new date
    // e.g. "English Premier League"
    const renderCompetitionRow = (data: any[], index: any) => {
        const previousCompetitionName = _.get(data, `[${index - 1}].competition.name`, '');
        const previousCompetitionSubHeading = _.get(data, `[${index - 1}].competition.subHeading`, '');
        const competition = _.get(data, `[${index}].competition`);

        if (competition && competition['name']) {
            const previousDate = _.get(data, `[${index - 1}].date`, '');
            const matchDate = _.get(data, `[${index}].date`, '');
            if (previousCompetitionName !== competition['name'] || previousDate !== matchDate) {
                return (
                    <CompetitionRow key={`competition-row-container-${competition['name']}`} competition={competition} displayHeading={true} />
                )
            } else if (previousCompetitionSubHeading !== competition['subHeading']) {
                return (
                    <CompetitionRow key={`competition-row-container-${competition['subHeading']}`} competition={competition} displayHeading={false} />
                )
            }
        }
    }

    // Display the footer row with the last updated time
    const renderFooter = () => {
        if (lastUpdated) {
            return (
                <div className='last-updated'>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )
        }
    }

    function renderMatchesGrid(checkForMatchUpdates: Function, store: any, deviceId: string) {

        return (
            <IonGrid key="matches-grid">
                {/* Display a grid of rows showing all the matches, separated by header rows for dates/competitions */}
                {filteredMatches.map((match: any, index: number) => (
                    { ...renderMatchRow(match, index, matchFilter, checkForMatchUpdates, logoCache, deviceId, store) }
                ))}
            </IonGrid>
        );
    }

    function renderMatchRow(match: any, index: any, matchFilter: string, checkForMatchUpdates: Function, logoCache: string[], deviceId: string, store: any) {
        return (
            <Fragment key={`match-fragment-${match.id}`}>
                {renderDateRow(filteredMatches, index)}
                {renderCompetitionRow(filteredMatches, index)}
                <MatchInfoRow key={`match-info-row-container-${match.id}`} index={index} match={match} matchFilter={matchFilter} checkForMatchUpdates={checkForMatchUpdates} controlPredictorMatch={controlPredictorMatch} logoCache={logoCache} store={store} deviceId={deviceId} />
                <MatchStatusRow key={`match-status-row-container-${match.id}`} match={match} matchFilter={matchFilter} />
            </Fragment>
        );
    }

    function renderSearchBar(matchCount: number) {
        if (matchCount > 0) {
            return (
                <IonSearchbar debounce={1000} onIonInput={(ev) => handleSearchInput(ev)}></IonSearchbar>
            )
        }
    }

    return (
        <IonPage>
            <IonContent>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle>{title}</IonTitle>
                    </IonToolbar>
                    {renderSearchBar(filteredMatches.length)}
                </IonHeader>
                <div>
                    <IonRefresher key="refresher" slot="fixed" pullFactor={0.5} pullMin={100} pullMax={200} onIonRefresh={handleRefresh}>
                        <IonRefresherContent key="refresherContent"></IonRefresherContent>
                    </IonRefresher>

                    <NoMatches matchesCount={filteredMatches.length} />

                    {renderMatchesGrid(checkForMatchUpdates, store, deviceId)}

                    {renderFooter()}

                </div>
            </IonContent>
        </IonPage>


    );

};

export default Matches;