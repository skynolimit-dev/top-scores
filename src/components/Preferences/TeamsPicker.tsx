import {
    IonCheckbox,
    IonCol,
    IonRow,
    IonSearchbar
} from '@ionic/react';

import { IonGrid } from '@ionic/react';
import _, { get, update } from 'lodash';
import React, { useEffect, useState } from 'react';

import TeamLogo from '../Matches/TeamLogo';

import './TeamsPicker.css';
import { time } from 'ionicons/icons';

let timeoutUpdateFilteredTeams: any;


interface ContainerProps {
    keyPrefix: string;
    checkedTeams: string[];
    preferences: any;
    initMatches: Function;
    logoCache: string[];
    deviceId: string;
    store: any;
    category: string;
    teams: string[];
    isPreferenceChecked: Function;
    togglePreferenceCheck: Function;
}

const TeamsPicker: React.FC<ContainerProps> = ({ keyPrefix, checkedTeams, preferences, initMatches, logoCache, deviceId, store, category, teams, isPreferenceChecked, togglePreferenceCheck }) => {

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTeams, setfilteredTeams] = useState(_.uniq(teams.concat(checkedTeams).sort()));

    const handleSearchInput = async (ev: Event) => {
        const target = ev.target as HTMLIonSearchbarElement;
        // Filter the teams based on the search query
        if (target.value && target.value.length > 0) {
            setfilteredTeams(teams.filter(team => team.toLowerCase().includes(target.value ? target.value.toLowerCase() : '')));
            setSearchQuery(target.value);
        }
        else
            setfilteredTeams(teams);
    };

    useEffect(() => {

        if ((!filteredTeams || filteredTeams.length === 0) && searchQuery.length === 0) {
            setfilteredTeams(teams);
        }

    }, [checkedTeams, filteredTeams, searchQuery]);

    async function toggleTeam(togglePreferenceCheck: Function, preferences: any, initMatches: Function, deviceId: string, store: any, category: string, team: string, checked: boolean) {
        await togglePreferenceCheck(preferences, initMatches, deviceId, store, category, team);
        
        // Remove the team value from the filtered teams list
        if (!checked) {
            setfilteredTeams(filteredTeams.filter(filteredTeam => filteredTeam !== team).sort());
        }
        // Otherwise, add the team value to the filtered teams list
        else {
            setfilteredTeams(_.uniq(filteredTeams.concat(team)).sort());
        }
    }

    function getKey(team: string) {
        return `${keyPrefix}-${team}`;
    }

    function getTeams() {
        if (searchQuery.length === 0)
            return _.uniq(teams.concat(checkedTeams).sort());
        else
            return filteredTeams;
    }

    return (
        <>
            <IonSearchbar debounce={1000} onIonInput={(ev) => handleSearchInput(ev)}></IonSearchbar>
            <IonGrid>
                {getTeams().map((team: string) => (
                    <IonRow key={getKey(team)}>
                        <IonCol>
                            <IonCheckbox color="tertiary" className='team-check-box' value={team} checked={isPreferenceChecked(preferences, `${category}Teams`, team)} onIonChange={e => toggleTeam(togglePreferenceCheck, preferences, initMatches, deviceId, store, `${category}Teams`, e.detail.value, e.detail.checked)} labelPlacement="end"><span className='ion-text-wrap'>{team}</span></IonCheckbox>
                            <TeamLogo teamNames={{ displayName: team, fullName: team }} className='team-picker-logo' logoCache={logoCache} />
                        </IonCol>
                    </IonRow>
                ))}
            </IonGrid>
        </>
    )

};

export default TeamsPicker;