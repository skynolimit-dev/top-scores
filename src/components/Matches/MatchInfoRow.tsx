import './MatchInfoRow.css';

import { IonCol, IonRow, IonIcon } from '@ionic/react';
import { chevronDownOutline, chevronBackOutline } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import MatchCentre from './MatchCentre';
import MatchDetails from './MatchDetails';
import TeamLogo from './TeamLogo';

interface ContainerProps {
    index: number,
    match: {
        competition: {
            name: string,
            weight: number
        },
        homeTeam: {
            names: {
                abbr: string,
                fullName: string,
                displayName: string
            },
            rating: number,
            logoUrl: string,
            score: number
        },
        awayTeam: {
            names: {
                abbr: string,
                fullName: string,
                displayName: string
            },
            rating: number,
            logoUrl: string,
            score: number
        },
        url: string,
        tvInfo: {
            channelInfo: {
                shortName: string,
                fullName: string
            },
            logoUrl: string
        },
        status: string,
        date: string,
        kickOffTime: string,
        id: string,
        timeLabel: string,
        time: number,
        started: boolean,
        finished: boolean,
        predictorMatchStatus: string
    };
    checkForMatchUpdates: Function;
    controlPredictorMatch: Function;
    matchFilter: string;
    deviceId: string;
    store: any;
    logoCache: string[];
}

const MatchInfoRow: React.FC<ContainerProps> = ({ index, match, matchFilter, checkForMatchUpdates, controlPredictorMatch, logoCache, store, deviceId }) => {

    const [matchSelected, setMatchSelected] = useState(false);

    function selectMatch(match: any, selectionState: boolean) {
        console.log(`Match ${match.id} selected: ${selectionState}`);
        // Only select matches that have either started or finished, i.e. not upcoming fixtures
        if (match.finished || match.started) {
            setMatchSelected(selectionState);
        }
    }

    function renderMatchSelectorArrow(match: any) {
        if (match.started || match.finished) {
            return <IonIcon icon={matchSelected ? chevronBackOutline : chevronDownOutline} />;
        }
    }

    function renderMatchDetails(matchId: string, matchSelected: boolean) {
        if (matchSelected) {
            return <MatchDetails matchId={match.id} />;
        }
    }

    useEffect(() => {

    }, [match, matchSelected]);

    if (matchFilter !== 'predictor') {

        let matchSelectedClasses = 'ion-align-items-center'
        if (matchSelected) {
            matchSelectedClasses += ' match-selected';
        }

        return (
            <>
                <IonRow key={`match-info-row-${match.id}`} class={matchSelectedClasses} onClick={() => selectMatch(match, !matchSelected)}>
                    <IonCol key={`home-team-name-${match.id}`} size="10" class="home-team-name ion-text-right ion-text-wrap">{match.homeTeam.names.displayName.replace('/', ' / ')}</IonCol>
                    <IonCol key={`home-team-logo-${match.id}`} size="2" class="ion-text-right"><TeamLogo teamNames={match.homeTeam.names} className='team-logo' logoCache={logoCache} /></IonCol>
                    <IonCol key={`home-team-score-${match.id}`} size="2" class="ion-text-right ion-text-nowrap">{match.started || match.finished || match.predictorMatchStatus ? match.homeTeam.score.toString() : ''}</IonCol>
                    <IonCol key={`match-centre-${match.id}`} size="3" class="ion-text-center ion-text-nowrap"><MatchCentre match={match} matchFilter={matchFilter} checkForMatchUpdates={checkForMatchUpdates} controlPredictorMatch={controlPredictorMatch} store={store} deviceId={deviceId} /></IonCol>
                    <IonCol key={`away-team-score-${match.id}`} size="2" class="ion-text-left ion-text-nowrap">{match.started || match.finished || match.predictorMatchStatus ? match.awayTeam.score.toString() : ''}</IonCol>
                    <IonCol key={`away-team-logo-${match.id}`} size="2" class="ion-text-left"><TeamLogo teamNames={match.awayTeam.names} className='team-logo' logoCache={logoCache} /></IonCol>
                    <IonCol key={`away-team-name-${match.id}`} size="8" class="away-team-name ion-text-left ion-text-wrap">{match.awayTeam.names.displayName.replace('/', ' / ')}</IonCol>
                    <IonCol key={`match-selected-indicator-${match.id}`} size="2" class="match-selector-arrow">{renderMatchSelectorArrow(match)}</IonCol>
                </IonRow>
                {renderMatchDetails(match.id, matchSelected)}
            </>
        );
    }

    // Otherwise, render the match info row for the predictor match
    else {
        return (
            <IonRow key={`match-info-row-${match.id}`} class="ion-align-items-center">
                <IonCol key={`home-team-name-${match.id}`} size="10" class="home-team-name ion-text-right ion-text-wrap">{match.homeTeam.names.displayName.replace('/', ' / ')}</IonCol>
                <IonCol key={`home-team-logo-${match.id}`} size="2" class="ion-text-right"><TeamLogo teamNames={match.homeTeam.names} className='team-logo' logoCache={logoCache} /></IonCol>
                <IonCol key={`home-team-score-${match.id}`} size="2" class="ion-text-right ion-text-nowrap">{match.started || match.finished || match.predictorMatchStatus ? match.homeTeam.score.toString() : ''}</IonCol>
                <IonCol key={`match-centre-${match.id}`} size="3" class="ion-text-center ion-text-nowrap"><MatchCentre match={match} matchFilter={matchFilter} checkForMatchUpdates={checkForMatchUpdates} controlPredictorMatch={controlPredictorMatch} store={store} deviceId={deviceId} /></IonCol>
                <IonCol key={`away-team-score-${match.id}`} size="2" class="ion-text-left ion-text-nowrap">{match.started || match.finished || match.predictorMatchStatus ? match.awayTeam.score.toString() : ''}</IonCol>
                <IonCol key={`away-team-logo-${match.id}`} size="2" class="ion-text-left"><TeamLogo teamNames={match.awayTeam.names} className='team-logo' logoCache={logoCache} /></IonCol>
                <IonCol key={`away-team-name-${match.id}`} size="10" class="away-team-name ion-text-left ion-text-wrap">{match.awayTeam.names.displayName.replace('/', ' / ')}</IonCol>
            </IonRow>
        );
    }
};

export default MatchInfoRow;