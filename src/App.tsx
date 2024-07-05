import {
  IonApp,
  IonBadge,
  IonIcon,
  IonItem,
  IonLabel,
  IonLoading,
  IonRouterOutlet,
  IonSpinner,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { App } from '@capacitor/app';
import { IonReactRouter } from '@ionic/react-router';
import { arrowUndoCircleOutline, footballOutline, homeOutline, newspaperOutline, personCircleOutline, tvOutline, alertCircleOutline } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { initNotifications } from './lib/notifications';
import Matches from './pages/Matches';
import News from './pages/News';
import User from './pages/User';
import Setup from './pages/Setup';

import _ from 'lodash';

import { Storage } from '@ionic/storage';
import { initHealthchecks, isServerHealthy } from './lib/healthcheck';
import { initUserData, getPreference } from './lib/user';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';

/* Theme variables */
import './theme/variables.css';

import { logoCache } from './lib/logos';
import { areMatchesInitialized, checkForMatchUpdates, controlPredictorMatch, getMatchCounts, getMatchFilter, initMatches, matches, updatePredictorMatches } from './lib/matches';
import { getNews, initNews } from './lib/news';

const store = new Storage();

let deviceId: string;

// Set a last init date to ensure we don't keep reinitialising the app + data - default to 5 minutes ago for immediate initialisation
let lastAppInitDate = new Date(new Date().getTime() - 5 * 60 * 1000);
let lastDataInitDate = new Date(new Date().getTime() - 5 * 60 * 1000);

// Set a last check date to ensure we don't keep rechecking the user preferences
let lastCheckUserPreferencesDate = new Date(new Date().getTime() - 5 * 60 * 1000);

let timeoutCheckUserPreferences: any;

setupIonicReact();

// Global variable to store the timeout for getting the latest match counts
let timeoutMatchCounts: any;

const matchCountsDefaults = {
  now: 0,
  today: 0,
  todayOnTv: 0,
  nowOnTv: 0
};


const TopScoresApp: React.FC = () => {

  const [matchCountNow, setMatchCountNow] = useState(matchCountsDefaults.now);
  const [matchCountToday, setMatchCountToday] = useState(matchCountsDefaults.today);
  const [matchCountTodayOnTv, setMatchCountTodayOnTv] = useState(matchCountsDefaults.todayOnTv);
  const [matchCountNowOnTv, setMatchCountNowOnTv] = useState(matchCountsDefaults.nowOnTv);
  // Use state to enure quick loading #react #darkarts
  const [matchesInitializedState, setMatchesInitializedState] = useState(false);
  const [serverHealthyState, setServerHealthyState] = useState(false);
  const [serverHealthyPreviousState, setServerHealthyPreviousState] = useState(false);
  const [appInitializedState, setAppInitializedState] = useState(false);
  const [showSetupScreen, setShowSetupScreen] = useState(false);

  let timeoutInitData: any;

  // Initialise the app data when the app is opened
  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      initData();
    }
  });

  // Start the server healthchecks, and create the store, then call out to create the data
  async function initApp() {

    // If the last init is within the past 30 seconds, return
    if (new Date().getTime() - lastAppInitDate.getTime() < 30 * 1000)
      return;

    // Otherwise, initialise the app
    else {
      lastAppInitDate = new Date();
      console.info('Initializing app');
      initHealthchecks();
      await store.create();
      await initData();
      checkUserPreferences(store);
    }
  }

  // Check user preferences regularly to ensure that the user has chosen at least one competition
  // and/or team to follow and if not, show the setup screen
  async function checkUserPreferences(store: any) {

    // If the last check date is within the last 30 seconds, return
    if (new Date().getTime() - lastCheckUserPreferencesDate.getTime() < 5 * 1000)
      return;
    else {

      lastCheckUserPreferencesDate = new Date();

      const preferences = await store.get('preferences');

      if ((!preferences.competitions || preferences.competitions.length === 0) &&
        (!preferences.clubTeams || preferences.clubTeams.length === 0) &&
        (!preferences.internationalTeams || preferences.internationalTeams.length === 0)) {
        setShowSetupScreen(true);
      } else {
        setShowSetupScreen(false);
      }

    }

    if (timeoutCheckUserPreferences)
      clearTimeout(timeoutCheckUserPreferences);
    timeoutCheckUserPreferences = setTimeout(() => {
      checkUserPreferences(store);
    }, 5000);
  }

  // Create the user and match data
  async function initData() {

    // Repeat every 60 seconds
    if (timeoutInitData)
      clearTimeout(timeoutInitData);
    timeoutInitData = setTimeout(() => {
      initData();
    }, 20 * 1000);

    // If the last init is within the past 30 seconds, return
    if (new Date().getTime() - lastDataInitDate.getTime() < 10 * 1000) {
      return;
    }

    // Otherwise, initialise the app data
    else {
      console.info('Initialising app data...');
      lastDataInitDate = new Date();
      await initUserData(store);
      deviceId = _.get(await store.get('userDeviceInfo'), 'id');
      if (deviceId && deviceId.length > 0) {
        initMatches(deviceId, store);
        initNews(deviceId);
        initNotifications(store);
      } else {
        console.error('Device ID not set');
      }
      setAppInitializedState(true);
    }
  }

  function setLatestMatchCounts() {
    if (timeoutMatchCounts)
      clearTimeout(timeoutMatchCounts);

    const matchCountsGot = getMatchCounts();

    setMatchCountNow(matchCountsGot.now);
    setMatchCountToday(matchCountsGot.today);
    setMatchCountTodayOnTv(matchCountsGot.todayOnTv);
    setMatchCountNowOnTv(matchCountsGot.nowOnTv);

    timeoutMatchCounts = setTimeout(setLatestMatchCounts, 5000);
  }

  function setMatchesInitialized() {
    if (areMatchesInitialized()) {
      setMatchesInitializedState(true);
    }
  }

  function updateServerHealth() {
    if (isServerHealthy()) {
      setServerHealthyState(true);
      if (!serverHealthyPreviousState) {
        console.info('Server wasn\'t healthy, but it is now!');
        initData();
        setServerHealthyPreviousState(true);
      }
    } else {
      console.warn('Server is unhealthy');
      setServerHealthyState(false);
      setServerHealthyPreviousState(false);
    }
  }

  useEffect(() => {
    
    if (!areMatchesInitialized || !appInitializedState)
      initApp();

    setLatestMatchCounts();
    updateServerHealth();

    // Update the match initialisation state and server health state every second
    const timeoutId = setInterval(() => {
      setMatchesInitialized();
      setServerHealthyState(isServerHealthy());
    }, 500);

    // Clear the interval when the component is unmounted (otherwise things get crazy!)
    return () => clearInterval(timeoutId);

  }, [matchCountNow, matchCountToday, matchCountTodayOnTv, matchCountNowOnTv, matchesInitializedState, serverHealthyState, deviceId, appInitializedState, showSetupScreen]);


  function renderBadgeMatchesToday() {
    if (matchCountToday > 0) {
      let color = matchCountNow > 0 ? "danger" : "primary";
      return (
        <IonBadge color={color}>{matchCountToday}</IonBadge>
      );
    }
  }

  function renderBadgeMatchesOnTvToday() {
    if (matchCountTodayOnTv > 0) {
      let color = matchCountNowOnTv> 0 ? "danger" : "primary";
      return (
        <IonBadge color={color}>{matchCountTodayOnTv}</IonBadge>
      );
    }
  }

  function renderLoadingSpinner() {
    if (!areMatchesInitialized())
      return (
        <IonLoading
          isOpen={true}
          message={'Loading match data...'}
        />
      )
  }

  function renderServerUnhealthyMessage() {
    if (!serverHealthyState)
      return (
        <IonItem color='medium'>
          <IonIcon icon={alertCircleOutline} slot="start" />
          <IonLabel class='ion-padding-end'>Connecting to the server...</IonLabel>
          <IonSpinner></IonSpinner>
        </IonItem>
      )
  }

  // If we have a device ID, show the app content
  if (appInitializedState) {

    // If the user hasn't set up their preferences yet and isn't on the user page, show the setup screen
    if (window.location.pathname !== '/user' && showSetupScreen) {
      return (
        <IonApp>
          <IonReactRouter>
            <Setup store={store} deviceId={deviceId} />
          </IonReactRouter>
        </IonApp>
      );
    }

    // Otherwise, show the app
    else {
      return (
        <IonApp>
          <IonReactRouter>
            {renderServerUnhealthyMessage()}
            {renderLoadingSpinner()}
            <IonTabs>
              <IonRouterOutlet>
                <Redirect exact path="/" to="/fixtures" />
                <Route path="/fixtures" render={() => <Matches title="Fixtures" matches={matches} getMatchFilter={getMatchFilter} checkForMatchUpdates={checkForMatchUpdates} controlPredictorMatch={controlPredictorMatch} updatePredictorMatches={updatePredictorMatches} logoCache={logoCache} store={store} deviceId={deviceId} />} exact={true} />
                <Route path="/matchesOnTv" render={() => <Matches title="Matches on TV" matches={matches} getMatchFilter={getMatchFilter} checkForMatchUpdates={checkForMatchUpdates} controlPredictorMatch={controlPredictorMatch} updatePredictorMatches={updatePredictorMatches} logoCache={logoCache} store={store} deviceId={deviceId} />} exact={true} />
                <Route path="/results" render={() => <Matches title="Results" matches={matches} getMatchFilter={getMatchFilter} checkForMatchUpdates={checkForMatchUpdates} controlPredictorMatch={controlPredictorMatch} updatePredictorMatches={updatePredictorMatches} logoCache={logoCache} store={store} deviceId={deviceId} />} exact={true} />
                <Route path="/matchesPredictor" render={() => <Matches title="Predictor" matches={matches} getMatchFilter={getMatchFilter} checkForMatchUpdates={checkForMatchUpdates} controlPredictorMatch={controlPredictorMatch} updatePredictorMatches={updatePredictorMatches} logoCache={logoCache} store={store} deviceId={deviceId} />} exact={true} />
                <Route path="/news" render={() => <News title="News" getNews={getNews} deviceId={deviceId} />} exact={true} />
                <Route path="/user" render={() => <User initMatches={initMatches} logoCache={logoCache} store={store} deviceId={deviceId} />} exact={true} />
                <Route path="/setup" render={() => <Setup store={store} deviceId={deviceId} />} exact={true} />
              </IonRouterOutlet>
              <IonTabBar slot="bottom">
                <IonTabButton tab="fixtures" href="/fixtures">
                  <IonIcon aria-hidden="true" icon={homeOutline} />
                  {renderBadgeMatchesToday()}
                  <IonLabel>Fixtures</IonLabel>
                </IonTabButton>
                <IonTabButton tab="matchesOnTv" href="/matchesOnTv">
                  <IonIcon aria-hidden="true" icon={tvOutline} />
                  {renderBadgeMatchesOnTvToday()}
                  <IonLabel>On TV</IonLabel>
                </IonTabButton>
                <IonTabButton tab="results" href="/results">
                  <IonIcon aria-hidden="true" icon={arrowUndoCircleOutline} />
                  <IonLabel>Results</IonLabel>
                </IonTabButton>
                <IonTabButton tab="matchesPredictor" href="/matchesPredictor">
                  <IonIcon aria-hidden="true" icon={footballOutline} />
                  <IonLabel>Predictor</IonLabel>
                </IonTabButton>
                <IonTabButton tab="news" href="/news">
                  <IonIcon aria-hidden="true" icon={newspaperOutline} />
                  <IonLabel>News</IonLabel>
                </IonTabButton>
                <IonTabButton tab="user" href="/user">
                  <IonIcon aria-hidden="true" icon={personCircleOutline} />
                  <IonLabel>Settings</IonLabel>
                </IonTabButton>
              </IonTabBar>
            </IonTabs>
          </IonReactRouter>
        </IonApp>
      );
    }
  }

  // Otherwise, if the device ID is not set yet, show a loading spinner
  else {
    return (
      <IonApp>
        <IonLoading
          isOpen={true}
          message={'Loading...'}
          duration={500}
        />
      </IonApp>
    );
  }

}

export default TopScoresApp;