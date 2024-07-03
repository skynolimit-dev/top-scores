import React, { Fragment, useEffect } from 'react';

import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonCheckbox, IonCol, IonGrid, IonItem, IonLoading, IonRadio, IonRadioGroup, IonRow } from '@ionic/react';

import { getCompetitions } from '../../lib/competitions';
import { getTeams } from '../../lib/teams';
import { uploadPreferences, getPreferences } from '../../lib/user';

import CompetitionsPicker from '../../components/Preferences/CompetitionsPicker';
import TeamsPicker from '../../components/Preferences/TeamsPicker';

import _ from 'lodash';
import './Preferences.css';

let timeoutUpdateTeams: any;

interface PreferencesProps {
    store: {
        set: (key: string, value: any) => Promise<void>;
        get: (key: string) => Promise<any>;
    };
    deviceId: string;
    initMatches: Function;
    logoCache: string[];
}

const Preferences: React.FC<PreferencesProps> = ({ initMatches, logoCache, store, deviceId }) => {

    const [preferences, setPreferences] = React.useState({});
    const [competitions, setCompetitions] = React.useState([]);
    const [clubTeams, setClubTeams] = React.useState([]);
    const [internationalTeams, setInternationalTeams] = React.useState([]);
    const [checkedCompetitions, setCheckedCompetitions] = React.useState([]);
    const [checkedClubTeams, setCheckedClubTeams] = React.useState([]);
    const [checkedInternationalTeams, setCheckedInternationalTeams] = React.useState([]);
    const [lastUpdated, setLastUpdated] = React.useState(new Date().getTime() - 1000);

    const [competitionsInitialised, setCompetitionsInitialised] = React.useState(false);
    const [clubTeamsInitialised, setClubTeamsInitialised] = React.useState(false);
    const [internationalTeamsInitialised, setInternationalTeamsInitialised] = React.useState(false);

    async function initPreferences(store: any, forceUpdate: boolean = false) {
        // If the last init is very recent and we're not forcing an update (by someone toggling a preference), return
        if (!forceUpdate && lastUpdated && new Date().getTime() - lastUpdated < 500)
            return;

        setLastUpdated(new Date().getTime());
        const preferences = await store.get('preferences');
        setPreferences(preferences);

        setCheckedCompetitions(getPreference(preferences, 'competitions'));
        setCheckedClubTeams(getPreference(preferences, 'clubTeams'));
        setCheckedInternationalTeams(getPreference(preferences, 'internationalTeams'));
    }

    useEffect(() => {

        initPreferences(store);

        if (!competitionsInitialised) {
            getCompetitions().then((data: any) => {
                setCompetitions(data);
                setCompetitionsInitialised(true);
            });
        }

        if (!clubTeamsInitialised) {
            getTeams('club').then((data: any) => {
                setClubTeams(data);
                setClubTeamsInitialised(true);
            });
        }

        if (!internationalTeamsInitialised) {
            getTeams('international').then((data: any) => {
                setInternationalTeams(data);
                setInternationalTeamsInitialised(true);
            });
        }

    }, [preferences, competitions, clubTeams, internationalTeams]);

    if (!preferences) {
        return (
            <IonLoading
                isOpen={true}
                message={'Loading preferences...'}
            />
        )
    } else if (preferences) {
        return (
            <Fragment>
                <div>
                    {renderCurrentlyFollowing(checkedCompetitions, checkedClubTeams, checkedInternationalTeams, preferences, initMatches, logoCache, deviceId, store)}
                </div>
                <div>
                    {renderPreferencesNotificationOptions(preferences, store, deviceId)}
                </div>
                <div>
                    {renderPreferencesNotificationSpeed(preferences, store, deviceId)}
                </div>
                <div>
                    {renderPreferencesPredictor(preferences, store, deviceId)}
                </div>
                <div>
                    {renderCompetitionOptions(checkedCompetitions, preferences, initMatches, deviceId, store, competitions)}
                </div>
                <div>
                    {renderTeamOptions(preferences, initMatches, logoCache, deviceId, store, 'club', clubTeams)}
                </div>
                <div>
                    {renderTeamOptions(preferences, initMatches, logoCache, deviceId, store, 'international', internationalTeams)}
                </div>
            </Fragment>
        )
    } else {
        // Return an error screen if we couldn't get any data
        return (
            <IonCard>
                <IonCardHeader>
                    <IonCardTitle>Error :(</IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                    <div className="ion-padding-bottom">Sorry, there was an error loading your preferences. Please try again later.</div>
                </IonCardContent>
            </IonCard>
        )
    }

    async function updatePreference(preferences: any, store: any, key: string, value: any) {
        _.set(preferences, key, value);
        await updatePreferences(preferences, store);
    }
    
    async function updatePreferences(preferences: any, store: any) {
        await store.set('preferences', preferences);
        await uploadPreferences(store);
        await initPreferences(store, true);
    }
    
    function getPreference(preferences: any, attribute: string) {
        return _.get(preferences, attribute);
    }
    
    // Returns true if the given preference is checked
    // Used for competition and team checkboxes
    function isPreferenceChecked(preferences: any, category: string, attribute: string) {
        // Gets the preference category, e.g. 'teams' or 'competitions', which should be an array of strings
        const preference = getPreference(preferences, category);
        // Returns true if the preference array includes the given attribute (team or competition name)
        return preference && preference.includes(attribute);
    }
    
    // Sets or unsets the given preference
    // Used for competition and team checkboxes
    async function togglePreferenceCheck(preferences: any, initMatches: Function, deviceId: string, store: any, category: string, attribute: string) {

        if (isPreferenceChecked(preferences, category, attribute)) {
            // Remove the attribute from the preference array
            _.set(preferences, category, getPreference(preferences, category).filter((item: string) => item !== attribute));
        } else {
            // Add the attribute to the preference array
            _.set(preferences, category, [...getPreference(preferences, category) || [], attribute]);
        }
        // Update the preferences, then refresh the matches to ensure the new preferences are applied
        await updatePreferences(preferences, store);

        await initMatches(deviceId, store);
        
    }

    function jumpToAnchor(anchor: string) {
        const element = document.getElementById(anchor);
        if (element)
            element.scrollIntoView({ behavior: 'smooth' });
    }
    
    function renderCurrentlyFollowing(checkedCompetitions: string[], checkedClubTeams: string[], checkedInternationalTeams: string[], preferences: any, initMatches: Function, logoCache: string[], deviceId: string, store: any) {
        return (
            <IonCard>
                <IonCardHeader>
                    <IonCardTitle>My Matches</IonCardTitle>
                </IonCardHeader>
    
                <IonCardContent>
                    <p className='ion-margin-bottom'>Customise the matches you see and get notifications for. To apply the defaults, click this button to return to the setup screen...</p>
                    <IonButton expand='block' color='warning' className='ion-margin-top ion-margin-bottom' onClick={() => window.location.href ="/setup"}>Return to Setup</IonButton>
                    <h2 className='ion-padding-top'>Competitions</h2>
                    {renderCompetitionPreferencesCheckboxesChecked(checkedCompetitions, preferences, initMatches, deviceId, store, isPreferenceChecked, togglePreferenceCheck)}
                    <div>
                    <IonButton expand='block' color="tertiary" className='ion-margin-top ion-margin-bottom' onClick={() => jumpToAnchor('competitions')}>Add competitions</IonButton>
                    </div>
                    <h2 className='ion-padding-top'>Club teams</h2>
                    {renderTeamPreferencesCheckboxesChecked(checkedClubTeams, preferences, initMatches, logoCache, deviceId, store, 'club')}
                    <IonButton expand='block' color="tertiary" className='ion-margin-top ion-margin-bottom' onClick={() => jumpToAnchor('club')}>Add club teams</IonButton>
                    <h2 className='ion-padding-top'>International teams</h2>
                    {renderTeamPreferencesCheckboxesChecked(checkedInternationalTeams, preferences, initMatches, logoCache, deviceId, store, 'international')}
                    <IonButton expand='block' color="tertiary" className='ion-margin-top ion-margin-bottom' onClick={() => jumpToAnchor('international')}>Add international teams</IonButton>
                </IonCardContent>
            </IonCard>
        )
    }
    
    // Renders the competition checkboxes for any existing competitions checked
    function renderCompetitionPreferencesCheckboxesChecked(checkedCompetitions: string[], preferences: any, initMatches: Function, deviceId: string, store: any, isPreferenceChecked: Function, togglePreferenceCheck: Function) {
    
        if (checkedCompetitions && checkedCompetitions.length > 0) {
            return (
                <CompetitionsPicker keyPrefix='existingCompetitionsChecked' checkedCompetitions={checkedCompetitions} preferences={preferences} initMatches={initMatches} deviceId={deviceId} store={store} competitions={checkedCompetitions} isPreferenceChecked={isPreferenceChecked} togglePreferenceCheck={togglePreferenceCheck} />
            )
        } else {
            return (
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <div>You're not following any competitions yet.</div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            )
        }
    }
    
    // Renders the team checkboxes for any existing teams checked
    function renderTeamPreferencesCheckboxesChecked(checkedTeams: string[], preferences: any, initMatches: Function, logoCache: string[], deviceId: string, store: any, category: string) {
    
        // Get and merge any existing teams from the user preferences that don't exist in the current teams list
        const existingTeams = getPreference(preferences, `${category}Teams`);
    
        if (existingTeams && existingTeams.length > 0) {
            existingTeams.sort();
            return (
                <TeamsPicker keyPrefix='existingTeamsChecked' checkedTeams={checkedTeams} preferences={preferences} initMatches={initMatches} logoCache={logoCache} deviceId={deviceId} store={store} category={category} teams={existingTeams} isPreferenceChecked={isPreferenceChecked} togglePreferenceCheck={togglePreferenceCheck} />
            )
        } else {
            return (
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <div>You're not following any {category} teams yet.</div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            )
        }
    }
    
    function renderCompetitionOptions(checkedCompetitions: string[], preferences: any, initMatches: Function, deviceId: string, store: any, competitions: string[]) {
        return (
            <IonCard id="competitions">
                <IonCardHeader>
                    <IonCardTitle>Competitions</IonCardTitle>
                </IonCardHeader>
    
                <IonCardContent>
                    <div className="ion-padding-bottom">Choose which competitions you would like to follow.</div>
                    <div className="ion-padding-bottom">For any competitions you select, you'll get scores and notifications for all matches in that competition.</div>
                    <div className="ion-padding-bottom">All competitions...</div>
                    <CompetitionsPicker keyPrefix='allCompetitions' checkedCompetitions={checkedCompetitions} preferences={preferences} initMatches={initMatches} deviceId={deviceId} store={store} competitions={competitions} isPreferenceChecked={isPreferenceChecked} togglePreferenceCheck={togglePreferenceCheck} />
                </IonCardContent>
            </IonCard>
        )
    }
    
    function renderTeamOptions(preferences: any, initMatches: Function, logoCache: string[], deviceId: string, store: any, category: string, teams: string[]) {

        const checkedTeams = category === 'club' ? checkedClubTeams : checkedInternationalTeams;

        // Set the category title (i.e. category in title case)
        const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
        return (
            <IonCard id={category}>
                <IonCardHeader>
                    <IonCardTitle>{categoryTitle} Teams</IonCardTitle>
                </IonCardHeader>
    
                <IonCardContent>
                    <p className="ion-padding-bottom">Choose which {category} teams you would like to follow.</p>
                    <p className="ion-padding-bottom">For any teams you select, you'll see scores and get notifications (where possible) for all matches involving that team.</p>
                    <TeamsPicker keyPrefix='allTeams' checkedTeams={checkedTeams} preferences={preferences} initMatches={initMatches} logoCache={logoCache} deviceId={deviceId} store={store} category={category} teams={teams} isPreferenceChecked={isPreferenceChecked} togglePreferenceCheck={togglePreferenceCheck} />
                </IonCardContent>
            </IonCard>
        )
    }
    
    function renderPreferencesNotificationOptions(preferences: any, store: any, deviceId: string) {
        return (
            <IonCard>
                <IonCardHeader>
                    <IonCardTitle>Notification Options</IonCardTitle>
                </IonCardHeader>
    
                <IonCardContent>
                    <div className="ion-padding-bottom">What would you like to know about...?</div>
                    {renderNotificationPreferencesCheckboxes(preferences, store, 'notifications.options')}
                </IonCardContent>
            </IonCard>
        )
    }
    
    function renderNotificationPreferencesCheckboxes(preferences: any, store: any, preferencePathPrefix: string) {
        return (
            <IonGrid>
                <IonRow>
                    <IonCol>
                        <IonCheckbox color="tertiary" checked={getPreference(preferences, `${preferencePathPrefix}.score_updates`)} onIonChange={e => updatePreference(preferences, store, `${preferencePathPrefix}.score_updates`, e.detail.checked)} labelPlacement="end">Score updates</IonCheckbox>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol>
                        <IonCheckbox color="tertiary" checked={getPreference(preferences, `${preferencePathPrefix}.full_time`)} onIonChange={e => updatePreference(preferences, store, `${preferencePathPrefix}.full_time`, e.detail.checked)} labelPlacement="end">Full time notifications</IonCheckbox>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol>
                        <IonCheckbox color="tertiary" checked={getPreference(preferences, `${preferencePathPrefix}.half_time`)} onIonChange={e => updatePreference(preferences, store, `${preferencePathPrefix}.half_time`, e.detail.checked)} labelPlacement="end">Half time notifications</IonCheckbox>
                    </IonCol>
                </IonRow>
                <IonRow>
                    <IonCol>
                        <IonCheckbox color="tertiary" checked={getPreference(preferences, `${preferencePathPrefix}.kick_off`)} onIonChange={e => updatePreference(preferences, store, `${preferencePathPrefix}.kick_off`, e.detail.checked)} labelPlacement="end">Kick off notifications</IonCheckbox>
                    </IonCol>
                </IonRow>
            </IonGrid>
        )
    }
    
    function renderPreferencesNotificationSpeed(preferences: any, store: any, deviceId: string) {
        return (
            <IonCard>
                <IonCardHeader>
                    <IonCardTitle>Notification Speed</IonCardTitle>
                </IonCardHeader>
    
                <IonCardContent>
                    <div className="ion-padding-bottom">Don't want to ruin the big game? Slow those notifications down...</div>
    
                    <IonRadioGroup className='ion-margin-bottom' onIonChange={e => updatePreference(preferences, store, 'notifications.speed', e.detail.value)} value={getPreference(preferences, 'notifications.speed')}>
                        <IonItem>
                            <IonRadio color="tertiary" value="slow">Slow (5-6 minutes)</IonRadio>
                        </IonItem>
                        <IonItem>
                            <IonRadio color="tertiary" value="medium">Medium (3-4 minutes)</IonRadio>
                        </IonItem>
                        <IonItem>
                            <IonRadio color="tertiary" value="fast">Fast (1-2 minutes)</IonRadio>
                        </IonItem>
                        <IonItem>
                            <IonRadio color="tertiary" value="asap">ASAP (as soon as possible)</IonRadio>
                        </IonItem>
                    </IonRadioGroup>
                </IonCardContent>
            </IonCard>
        )
    }
    
    function renderPreferencesPredictor(preferences: any, store: any, deviceId: string) {
        return (
            <IonCard>
                <IonCardHeader>
                    <IonCardTitle>Predictor</IonCardTitle>
                </IonCardHeader>
    
                <IonCardContent>
                    <div className="ion-padding-bottom">The Predictor makes use of advanced quantum time tunnelling techniques to play out matches from the future. Due to the inherently unstable nature of the spacetime continuum and occasional unforseen wormhole collapses, predictions are subject to change and are not guaranteed be 100% accurate. Maybe don't bet the house on them.</div>
    
                    <h2 className='ion-padding-top'>Match speed</h2>
    
                    <IonRadioGroup onIonChange={e => updatePreference(preferences, store, 'predictor.speed', e.detail.value)} value={getPreference(preferences, 'predictor.speed')}>
                        <IonItem>
                            <IonRadio color="tertiary" value="slow">Slow (around a minute)</IonRadio>
                        </IonItem>
                        <IonItem>
                            <IonRadio color="tertiary" value="medium">Medium (30 seconds or so)</IonRadio>
                        </IonItem>
                        <IonItem>
                            <IonRadio color="tertiary" value="fast">Fast (a few seconds)</IonRadio>
                        </IonItem>
                    </IonRadioGroup>
                </IonCardContent>
            </IonCard>
        )
    }
};

export default Preferences;
