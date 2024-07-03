import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonButton } from '@ionic/react';

import { uploadPreferences } from '../lib/user';

import _ from 'lodash';

import './Setup.css';

interface SetupProps {
    deviceId: string;
    store: any;
}

const Setup: React.FC<SetupProps> = ({ store, deviceId }) => {

    function getCompetitions() {
        return [
            "Champions League: Top teams",
            "Community Shield",
            "EFL Cup: Top teams",
            "EURO",
            "Europa Conference League: Top teams",
            "Europa League: Top teams",
            "FA Cup: Top teams",
            "FIFA Club World Cup",
            "Premier League",
            "World Cup",
            "World Cup Qualification UEFA"
        ]
    }

    function getClubTeams() {
        return [];
    }

    function getInternationalTeams() {
        return ['England'];
    }

    // Apply the default preferences
    async function applyDefaultPreferences(store: any) {

        const preferences = await store.get('preferences') || {};

        _.set(preferences, 'competitions', getCompetitions());
        _.set(preferences, 'clubTeams', getClubTeams());
        _.set(preferences, 'internationalTeams', getInternationalTeams());

        console.info('Applying default preferences:', preferences);

        await store.set('preferences', preferences);
        await uploadPreferences(store);
        window.location.href = '/fixtures';
    }

    // Redirect to the user page
    function redirectToUserScreen() {
        window.location.href = '/user';
    }

    return (
        <IonPage>
            <IonContent>
                <IonHeader collapse="condense">
                    <IonToolbar>
                        <IonTitle>Welcome to Top Scores</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonCard>
                    <IonCardHeader>
                        <IonTitle>Hello, and welcome</IonTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <img className='ion-margin-top ion-margin-bottom welcome-image' src='/images/welcome.jpg' alt='Welcome' />
                        <p className='ion-padding'>Would you like to start with the default settings?</p>
                        <p className='ion-padding'>If you're into the English Premier League and top European football, tap the "Yes" button below.</p>
                        <p className='ion-padding'>You can still pick and choose competitions and favourite teams afterwards in the <strong>Settings</strong> screen.</p>
                        <IonButton expand="block" color="tertiary" className='ion-padding-bottom' onClick={() => applyDefaultPreferences(store)}>Yes, let's kick things off</IonButton>
                    </IonCardContent>
                </IonCard>
                <IonCard>
                    <IonCardContent>
                        <p className='ion-padding'>If you would prefer a completely blank slate and to choose your own favourites, hit the button below.</p>
                        <IonButton expand="block" className='ion-padding-bottom' onClick={() => redirectToUserScreen()}>Let me choose my own</IonButton>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default Setup;
