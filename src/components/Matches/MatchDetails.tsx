import './MatchDetails.css';

import { IonRow, IonCol, IonIcon, IonItem, IonLabel, IonGrid, IonSpinner } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import { caretUp, caretDown, square, book, tv, people } from 'ionicons/icons';

import { requestTimeout, apiUrlPrefix } from '../../lib/globals';

import axios from 'axios';
axios.defaults.timeout = requestTimeout;

let timeoutFetchData: any;


import _ from 'lodash';


interface ContainerProps {
    matchId: string;
}

const MatchDetails: React.FC<ContainerProps> = ({ matchId }) => {

    const [isInitialised, setIsInitialised] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date(new Date().getTime() - 5 * 60000));
    const [matchEvents, setMatchEvents] = useState<any[]>([]);
    const [matchPenalties, setMatchPenalties] = useState<any[]>([]);
    const [matchReportUrl, setMatchReportUrl] = useState<string>('');
    const [highlightsUrl, setHighlightsUrl] = useState<string>('');
    const [stadiumName, setStadiumName] = useState<string>('');
    const [attendance, setAttendance] = useState<number>(-1);

    async function setMatchDetails(matchId: string) {

        clearTimeout(timeoutFetchData);

        try {
            // Only carry on if the lastUpdate date is at least 10 seconds ago
            if (new Date().getTime() - lastUpdated.getTime() > 10000) {
                const url = `${apiUrlPrefix}/match_details/match/${matchId}`;
                const response = await axios.get(url);
                setIsLoading(false);
                // Filter on events of type 'Goal', 'Card' and 'Substitution'
                const events = _.filter(response.data.events, (event) => {
                    return event.type === 'Goal' || event.type === 'Card' || event.type === 'Substitution' || event.type === 'MissedPenalty';
                });
                setMatchEvents(events);
                setMatchPenalties(_.get(response, 'data.penalties', []));
                setMatchReportUrl(_.get(response, 'data.matchReportUrl', ''));
                setHighlightsUrl(_.get(response, 'data.highlightsUrl', ''));
                setStadiumName(_.get(response, 'data.stadiumName', ''));
                setAttendance(_.get(response, 'data.attendance', -1));
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error(error);
        } finally {
            // Repeat every 30 seconds
            timeoutFetchData = setTimeout(() => {
                setMatchDetails(matchId);
            }, 10000);
        }
    }

    function renderMatchEvent(event: any, index: any) {
        if (event.type === 'Substitution') {
            return renderSubstitution(event, index);
        }
        else if (event.type === 'Card') {
            return renderCard(event, index);
        }
        else if (event.type === 'Goal') {
            return renderGoal(event, index);
        }
        else if (event.type === 'MissedPenalty') {
            return renderMissedPenalty(event, index);
        }
        return (
            <IonRow key={`match-details-item-${index}`}>
                <IonCol className='match-details-time-label'>{event.time}</IonCol>
                <IonCol>{event.type}</IonCol>
            </IonRow>
        );
    }

    function renderGoal(event: any, index: any) {
        if (event.isHome) {
            return (
                <IonRow key={`match-details-item-${index}`} className='match-details-goal-row'>
                    <IonCol size="4" className='match-details-time-label'>{event.time}</IonCol>
                    <IonCol size="4" className='ion-text-center'>⚽️</IonCol>
                    <IonCol size="23" class='ion-text-start goal-player-name'>{event.playerName}</IonCol>
                </IonRow>
            );
        }
        else {
            return (
                <IonRow key={`match-details-item-${index}`} className='match-details-goal-row'>
                    <IonCol size="4" className='match-details-time-label'>{event.time}</IonCol>
                    <IonCol size="23" class='ion-text-end goal-player-name'>{event.playerName}</IonCol>
                    <IonCol size="4" className='ion-text-center'>⚽️</IonCol>
                </IonRow>
            );
        }
    }

    function renderCard(event: any, index: any) {
        const cardClassName = `card-${event.card.toLowerCase()}`;
        if (event.isHome) {
            return (
                <IonRow key={`match-details-item-${index}`}>
                    <IonCol size="4" className='match-details-time-label'>{event.time}</IonCol>
                    <IonCol size="4" className='ion-text-center'><IonIcon aria-hidden="true" icon={square} className={cardClassName} /></IonCol>
                    <IonCol size="23" class='ion-text-start'>{event.playerName}</IonCol>
                </IonRow>
            );
        }
        else {
            return (
                <IonRow key={`match-details-item-${index}`}>
                    <IonCol size="4" className='match-details-time-label'>{event.time}</IonCol>
                    <IonCol size="23" class='ion-text-end'>{event.playerName}</IonCol>
                    <IonCol size="4" className='ion-text-center'><IonIcon aria-hidden="true" icon={square} className={cardClassName} /></IonCol>
                </IonRow>
            );
        }
    }

    function renderSubstitution(event: any, index: any) {
        if (event.isHome) {
            return (
                <IonRow key={`match-details-item-${index}`}>
                    <IonCol size="4" className='match-details-time-label'>{event.time}</IonCol>
                    <IonCol size="4" className='ion-text-center'>
                        <div><IonIcon aria-hidden="true" icon={caretUp} className='player-on player-on-icon' /></div>
                        <div><IonIcon aria-hidden="true" icon={caretDown} className='player-off player-off-icon' /></div>
                    </IonCol>
                    <IonCol size="23" class='ion-text-start'>
                        <div className='player-on'>{event.playerOn}</div>
                        <div className='player-off'>{event.playerOff}</div>
                    </IonCol>
                </IonRow>
            );
        }
        else {
            return (
                <IonRow key={`match-details-item-${index}`}>
                    <IonCol size="4" className='match-details-time-label'>{event.time}</IonCol>
                    <IonCol size="23" className='ion-text-end'>
                        <div className='player-on'>{event.playerOn}</div>
                        <div className='player-off'>{event.playerOff}</div>
                    </IonCol>
                    <IonCol size="4" className='ion-text-center'>
                        <div><IonIcon aria-hidden="true" icon={caretUp} className='player-on player-on-icon' /></div>
                        <div><IonIcon aria-hidden="true" icon={caretDown} className='player-off player-off-icon' /></div>
                    </IonCol>
                </IonRow>
            );
        }
    }

    function renderMatchPenaltiesTitle() {
        if (matchPenalties.length > 0) {
            return (
                <IonRow key='match-details-penalties-title' className='penalties-title'>
                    <IonCol size="31">Penalty shoot-out</IonCol>
                </IonRow>
            );
        }
    }

    function renderMissedPenalty(event: any, index: any) {
        let classesPlayerName = 'penalty-missed-player-name';

        if (event.isHome) {
            classesPlayerName += 'ion-text-start';
            return (

                <IonRow key={`match-details-item-${index}`} className='match-details-missed-penalty-row'>
                    <IonCol size="4" className='match-details-time-label'>{event.time}</IonCol>
                    <IonCol size="4" className='ion-text-center'>❌</IonCol>
                    <IonCol size="23" class={classesPlayerName}>Penalty miss: {event.playerName}</IonCol>
                </IonRow>
            );
        }
        else {
            classesPlayerName += 'ion-text-end';
            return (
                <IonRow key={`match-details-item-${index}`} className='match-details-missed-penalty-row'>
                    <IonCol size="4" className='match-details-time-label'>{event.time}</IonCol>
                    <IonCol size="23" class={classesPlayerName}>Penalty miss: {event.playerName}</IonCol>
                    <IonCol size="4" className='ion-text-center'>❌</IonCol>
                </IonRow>
            );
        }
    }

    function renderMatchPenalty(event: any, index: any) {
        const symbol = event.type === 'Goal' ? '⚽️' : '❌';
        let classesPlayerName = event.type === 'Goal' ? 'goal-player-name ' : 'penalty-missed-player-name ';
        const classRow = event.type === 'Goal' ? 'match-details-goal-row' : 'match-details-missed-penalty-row';

        if (event.isHome) {
            classesPlayerName += 'ion-text-start';
            return (

                <IonRow key={`match-details-item-${index}`} className={classRow}>
                    <IonCol size="4" className='match-details-time-label'>Pen</IonCol>
                    <IonCol size="4" className='ion-text-center'><span className='goal-football'>{symbol}</span></IonCol>
                    <IonCol size="23" class={classesPlayerName}>{event.player}</IonCol>
                </IonRow>
            );
        }
        else {
            classesPlayerName += 'ion-text-end';
            return (
                <IonRow key={`match-details-item-${index}`} className={classRow}>
                    <IonCol size="4" className='match-details-time-label'>Pen</IonCol>
                    <IonCol size="23" class={classesPlayerName}>{event.player}</IonCol>
                    <IonCol size="4" className='ion-text-center'><span className='goal-football'>{symbol}</span></IonCol>
                </IonRow>
            );
        }
    }

    function renderMatchDetailsLoading() {
        if (!isLoading) {
            return null;
        }
        return (
            <IonRow key='match-details-loading' class='match-details-loading'>
                <IonCol>
                    <IonItem lines="none" className='loading-container'>
                        <IonLabel>Loading match details...</IonLabel>
                        <IonSpinner></IonSpinner>
                    </IonItem>
                </IonCol>
            </IonRow>
        );

    }

    function renderMatchReportLink() {
        if (matchReportUrl && matchReportUrl.length > 0) {
            return (
                <IonRow key='match-details-url' class='match-details-url'>
                    <IonCol>
                        <IonItem lines="none" className='match-url-container'>
                            <IonIcon aria-hidden="true" icon={book} slot="end"></IonIcon>
                            <IonLabel className='ion-text-center'><a href={matchReportUrl} target='_blank'>Read the match report</a></IonLabel>
                        </IonItem>
                    </IonCol>
                </IonRow>
            );
        }
    }

    function renderHighlightsLink() {
        if (highlightsUrl && highlightsUrl.length > 0) {
            return (
                <IonRow key='match-highlights-url' class='match-details-url'>
                    <IonCol>
                        <IonItem lines="none" className='match-url-container'>
                            <IonIcon aria-hidden="true" icon={tv} slot="end"></IonIcon>
                            <IonLabel className='ion-text-center'><a href={highlightsUrl} target='_blank'>View match highlights</a></IonLabel>
                        </IonItem>
                    </IonCol>
                </IonRow>
            );
        }
    }

    function renderAttendanceInfo() {
        if (stadiumName && stadiumName.length > 0 && attendance > 0) {
            return (
                <IonRow key='match-attendance-info' class='match-details-url'>
                    <IonCol>
                        <IonItem lines="none" className='match-url-container'>
                            <IonIcon aria-hidden="true" icon={people} slot="end"></IonIcon>
                            <IonLabel className='ion-text-center'>Attendance: {attendance} ({stadiumName})</IonLabel>
                        </IonItem>
                    </IonCol>
                </IonRow>
            );
        }
    }

    useEffect(() => {
        if (!isInitialised) {
            setMatchDetails(matchId);
            setIsInitialised(true);
        }
    }, [matchId, lastUpdated, isLoading]);

    return (
        <IonRow key={`match-events-row-${matchId}`} class="ion-align-items-center match-selected match-details">
            <IonCol key={`match-events-container-col-${matchId}`} size="31">
                <IonGrid>
                    {renderMatchDetailsLoading()}
                    {matchEvents.map((event: any, index: number) => (
                        { ...renderMatchEvent(event, index) }
                    ))}
                    {renderMatchPenaltiesTitle()}
                    {matchPenalties.map((event: any, index: number) => (
                        { ...renderMatchPenalty(event, index) }
                    ))}
                    {renderMatchReportLink()}
                    {renderHighlightsLink()}
                    {renderAttendanceInfo()}
                </IonGrid>
            </IonCol>
        </IonRow>
    )
};

export default MatchDetails;