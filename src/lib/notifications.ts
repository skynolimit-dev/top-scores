import { PushNotifications } from '@capacitor/push-notifications';
import { isPlatform } from '@ionic/react';
import { uploadUserDeviceInfo } from './user';

import _ from 'lodash';

let timeout: any;


async function addListeners(store: any) {

    try {
        await PushNotifications.addListener('registration', async (token) => {
            await setToken(store, token);
        });
    } catch (error) {
        console.error('Error adding registration listener: ', error);
        await uploadNotificationsRegistrationInfo(store, 'registrationError', error);
    }

}

async function setToken(store: any, token: any) {
    const tokenInfo = {
        value: token.value,
        registerTime: new Date().toISOString()
    }
    await uploadNotificationsRegistrationInfo(store, 'token', tokenInfo);

    // Repeat in case the token changes
    // TODO: Remove?
    if (timeout)
        clearTimeout(timeout);
    timeout = setTimeout(() => {
        setToken(store, token);
    }, 60 * 1000);
}

async function registerNotifications(store: any) {

    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
    }

    await uploadNotificationsRegistrationInfo(store, 'permissionStatus', permStatus);

    const registrationInfo = await PushNotifications.register();
    await uploadNotificationsRegistrationInfo(store, 'notificationsRegister', registrationInfo);

    await uploadNotificationsRegistrationInfo(store, 'registerReady', true);
}

// Save notification info to the server
async function uploadNotificationsRegistrationInfo(store: any, key: string, value: any) {
    const userDeviceInfo = await store.get('userDeviceInfo');
    _.set(userDeviceInfo, `notificationsRegistration.${key}`, value);
    await store.set('userDeviceInfo', userDeviceInfo);
    await uploadUserDeviceInfo(store);
}

export async function initNotifications(store: any) {

    console.info('Initialising notifications...');

    if (isPlatform('ios')) {
        try {
            await registerNotifications(store);
            await addListeners(store);
            await registerNotifications(store);
        } catch (error) {
            if (error && !error.toString().includes('"PushNotifications" plugin is not implemented on web'))
                console.error('Error registering notifications: ', error);
            await uploadNotificationsRegistrationInfo(store, 'initError', error);
        }
    } else {
        console.debug('Skipping notifications setup, as this is not an iOS device');
        const skipInfo = {
            skipped: true,
            skipReason: 'Not an iOS device'
        }
        await uploadNotificationsRegistrationInfo(store, 'registrationSkipped', skipInfo);
    }
}