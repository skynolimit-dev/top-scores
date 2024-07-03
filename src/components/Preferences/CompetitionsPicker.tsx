import {
    IonCheckbox,
    IonCol,
    IonRow,
    IonSearchbar
} from '@ionic/react';

import { IonGrid } from '@ionic/react';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';

import './CompetitionsPicker.css';


interface ContainerProps {
    keyPrefix: string,
    checkedCompetitions: string[],
    preferences: any,
    initMatches: Function,
    deviceId: string,
    store: any,
    competitions: string[],
    isPreferenceChecked: Function,
    togglePreferenceCheck: Function
}

const CompetitionsPicker: React.FC<ContainerProps> = ({ keyPrefix, checkedCompetitions, preferences, initMatches, deviceId, store, competitions, isPreferenceChecked, togglePreferenceCheck }) => {

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCompetitions, setFilteredCompetitions] = useState(_.uniq(competitions.concat(checkedCompetitions).sort()));

    const handleSearchInput = async (ev: Event) => {
        const target = ev.target as HTMLIonSearchbarElement;
        // Filter the competitions based on the search query
        if (target.value && target.value.length > 0) {
            setFilteredCompetitions(competitions.filter(competition => competition.toLowerCase().includes(target.value ? target.value.toLowerCase() : '')));
            setSearchQuery(target.value);
        }
        else
            setFilteredCompetitions(competitions);
    }

    function getKey(team: string) {
        return `${keyPrefix}-${team}`;
    }

    function getCompetitions() {
        if (searchQuery.length === 0)
            return _.uniq(competitions.concat(checkedCompetitions).sort());
        else
            return filteredCompetitions;
    }

    useEffect(() => {
        // Get and merge any existing competitions from the user preferences that don't exist in the competitions list
        const existingCompetitions = _.get(preferences, 'competitions') || [];
        competitions = _.uniq(competitions.concat(existingCompetitions)).sort();

        if ((!filteredCompetitions || filteredCompetitions.length === 0) && searchQuery.length === 0)
            setFilteredCompetitions(competitions);
    }, [filteredCompetitions, checkedCompetitions, searchQuery]);

    return (
        <>
            <IonSearchbar debounce={1000} onIonInput={(ev) => handleSearchInput(ev)}></IonSearchbar>
            <IonGrid>
                {getCompetitions().map((competition: string) => (
                    <IonRow key={competition}>
                        <IonCol>
                            <IonCheckbox color="tertiary" className='competition-check-box' value={competition} checked={isPreferenceChecked(preferences, 'competitions', competition)} onIonChange={e => togglePreferenceCheck(preferences, initMatches, deviceId, store, 'competitions', e.detail.value)} labelPlacement="end"><span className='ion-text-wrap'>{competition}</span></IonCheckbox>
                        </IonCol>
                    </IonRow>
                ))}
            </IonGrid>
        </>
    )

};

export default CompetitionsPicker;