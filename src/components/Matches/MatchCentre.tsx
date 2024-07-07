import './MatchCentre.css';

import { IonButton, IonIcon } from '@ionic/react';
import { documentTextOutline, playOutline, refreshOutline } from 'ionicons/icons';
import React, { useEffect } from 'react';

import { requestTimeout } from '../../lib/globals';

import axios from 'axios';
axios.defaults.timeout = requestTimeout;


import _ from 'lodash';


interface ContainerProps {
    match: {
        homeTeam: {
            names: {
                displayName: string
            },
            rating: number
        },
        awayTeam: {
            names: {
                displayName: string
            },
            rating: number
        },
        tvInfo: {
            logoUrl: string
        },
        kickOffTime: string,
        url: string,
        timeLabel: string;
        finished: boolean;
    };
    checkForMatchUpdates: Function;
    controlPredictorMatch: Function;
    matchFilter: string;
    store: any;
    deviceId: string;
}


function renderPredictorControls(match: any, controlPredictorMatch: Function, deviceId: string) {

    if (match.homeTeam.names.displayName === 'TBC' || match.awayTeam.names.displayName === 'TBC')
        return;

    // Only allow the user to start the match if there is a rating available for both teams
    else if(!match.homeTeam.rating || match.homeTeam.rating === 0 || !match.awayTeam.rating || match.awayTeam.rating === 0)
        return (
            <span>
                {renderNoRatingInfo()}
            </span>
        )
        
    else return (
        <span>
            {renderPredictorPlayButton(match, controlPredictorMatch, deviceId)}
            {renderPredictorRestartButton(match, controlPredictorMatch, deviceId)}
        </span>
    );
}

function renderNoRatingInfo() {
    return (
        <IonButton fill="clear" disabled={true}>
            <IonIcon slot="icon-only" icon={playOutline}></IonIcon>
        </IonButton>
    )
}

function renderPredictorPlayButton(match: any, controlPredictorMatch: Function, store: any) {
    if (!isPredictorActiveForMatch(match)) {
        return (
            <IonButton fill="clear" onClick={() => controlPredictorMatch(match.id, store)}>
                <IonIcon slot="icon-only" icon={playOutline}></IonIcon>
            </IonButton>
        )
    }
}

function renderPredictorRestartButton(match: any, controlPredictorMatch: Function, store: any) {
    if (isPredictorActiveForMatch(match) && isMatchOver(match)) {
        return (
            <IonButton fill="clear" onClick={() => controlPredictorMatch(match.id, store)}>
                <IonIcon slot="icon-only" icon={refreshOutline}></IonIcon>
            </IonButton>
        )
    }
}

function isPredictorActiveForMatch(match: any) {
    return _.get(match, 'predictorMatchStatus') || false;
}

function isMatchInPlay(match: any) {
    const predictorStatus = _.get(match, 'predictorMatchStatus');
    return predictorStatus === 'inPlay';
}

function isMatchOver(match: any) {
    const predictorStatus = _.get(match, 'predictorMatchStatus');
    return predictorStatus === 'finished';
}

const MatchCentreLabel: React.FC<ContainerProps> = ({ match, matchFilter, checkForMatchUpdates, controlPredictorMatch, store, deviceId }) => {

    useEffect(() => {

    }, [match, matchFilter]);

    if (matchFilter === 'predictor' && !isMatchInPlay(match)) {
        return renderPredictorControls(match, controlPredictorMatch, store);
    } else {
        if (matchFilter !== 'results' && match.timeLabel && match.timeLabel === 'HT') {
            return (
                <span className='match-time-label half-time ion-text-nowrap'>{match.timeLabel}</span>
            );
        }
        else if (match.timeLabel && match.finished) {
            return (
                <span className='match-time-label ion-text-nowrap'>{match.timeLabel}</span>
            );
        }
        else if (matchFilter !== 'results' && match.timeLabel) {
            return (
                <span className='match-time-label in-play ion-text-nowrap'>{match.timeLabel}</span>
            );
        }
        else if (matchFilter !== 'results' && match.kickOffTime) {
            return (
                <span className='kick-off-time ion-text-nowrap'>{match.kickOffTime}</span>
            );
        }
        else {
            return '-';
        }
    }
};

export default MatchCentreLabel;