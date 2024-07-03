import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { apiUrlPrefix, requestTimeout } from './globals';

import _ from 'lodash';

import axios from 'axios';
axios.defaults.timeout = requestTimeout;

let initUserDataTimeout: any;

// Set a lastInitDate of 5 minutes ago to allow for immediate initialization
let lastInitDate = new Date(new Date().getTime() - 5 * 60 * 1000);


export let userData = {
    id: null,
    device: {
        info: {
            platform: ''
        },
        notifications: {}
    },
    preferences: {},
    lastUpdated: ''
}

const preferencesDefault = {
    notifications: {
        options: {
            score_updates: true,
            full_time: true,
            half_time: true,
            kick_off: true
        },
        speed: "medium"
    },
    predictor: {
        notifications: {
            options: {
                score_updates: false,
                full_time: false,
                half_time: false,
                kick_off: false
            }
        },
        speed: "fast"
    }
}

// Initialize the user data, and save it to local storage + upload it to the server
export async function initUserData(store: any) {

    // If the last init date is within the last 30 seconds, return
    if (new Date().getTime() - lastInitDate.getTime() < 30 * 1000)
        return;
    
    // Otherwise, initialise the user data
    else {
        lastInitDate = new Date();
        console.info('Initializing user data...');

        const userDeviceInfo = await getUserDeviceInfo();
        const preferences = await getPreferences(store);
        _.set(userData, 'userDeviceInfo', userDeviceInfo);
        store.set('userDeviceInfo', userDeviceInfo);
        store.set('preferences', preferences);

        await uploadUserDeviceInfo(store);
        await uploadPreferences(store);
    }

}

// Gets the user device info and ID
// Note that the device ID is unique to the device and is used to identify the user
// Data is stored on the server using device ID as the unique key
async function getUserDeviceInfo() {

    let userDeviceInfo = {};

    try {
        // Make async calls in parallel using Promise.all to Device.getInfo() and Device.getId()
        const [deviceInfo, deviceId] = await Promise.all([
            Device.getInfo(),
            Device.getId()
        ]);
        _.set(userDeviceInfo, 'id', _.get(deviceId, 'identifier'));
        _.set(userDeviceInfo, 'device.info', deviceInfo);
        console.info('Device ID:', deviceId);

    } catch (error) {
        console.error('Error initializing device info:', error);
    }

    // Get the app info if available
    try {
        const appInfo = await App.getInfo();
        _.set(userDeviceInfo, 'app.info', appInfo);
    } catch (error: any) {
        if (!error.message.includes('Not implemented on web'))
            console.warn('Unable to get app info:', error);
    }

    return userDeviceInfo;

};

// Gets the preferences from local storage
export async function getPreferences(store: any) {
    const preferences = await store.get('preferences');
    if (!preferences || Object.keys(preferences).length === 0) {
        console.info('Preferences undefined, returning default preferences');
        return preferencesDefault;
    }
    else
        return preferences;
}

// Gets the given preference from local storage
export async function getPreference(store: any, key: string) {
    const preferences = await getPreferences(store);
    if (preferences && preferences[key])
        return preferences[key];
    else
        return null;
}

// Returns the device ID, calling initDeviceInfo() if the device ID is not available (giving up after 3 retries)
// to ensure it gets populated
export async function getDeviceId(store: any, retryCount = 0) {
    if (retryCount > 3) {
        console.error('Unable to get device ID after 3 retries');
        return null;
    }
    const deviceId = _.get(await store.get('userDeviceInfo'), 'id');
    if (!deviceId) {
        // Sleep for 1 second before trying again, to allow time for the device ID to be set
        await new Promise(r => setTimeout(r, 1000));
        return getDeviceId(retryCount + 1);
    }
    return deviceId;
}

// Function to update the user and device info on the server
export async function uploadUserDeviceInfo(store: any) {

    const userDeviceInfo = await store.get('userDeviceInfo');
    const deviceId = userDeviceInfo.id;

    const url = `${apiUrlPrefix}/user/${deviceId}/userDeviceInfo`;
    _.set(userDeviceInfo, 'lastUpdated', new Date().toISOString());

    try {
        await axios.put(url, userDeviceInfo);
    } catch (error) {
        console.error(`Error uploading user and device info for device ID: ${deviceId} to ${url}`, ' Error: ', error);
    }

}

// Function to update the user preferences on the server
export async function uploadPreferences(store: any) {
    const userDeviceInfo = await store.get('userDeviceInfo');
    const deviceId = userDeviceInfo.id;

    const preferences = await store.get('preferences');
    const url = `${apiUrlPrefix}/user/${deviceId}/preferences`;
    _.set(preferences, 'lastUpdated', new Date().toISOString());

    try {
        await axios.put(url, preferences);
    } catch (error) {
        console.error(`Error uploading user preferences for device ID: ${deviceId}`, ' Error: ', error);
    }
}
