import { apiUrlPrefix } from './globals';

import _ from 'lodash';

import axios from 'axios';
axios.defaults.timeout = 2000;

let serverHealthy = true;
let serverHealthyTimeout: any;

export function initHealthchecks() {
    console.info('Initialising healthchecks...');
    checkServerHealth();

    if (serverHealthyTimeout)
        clearInterval(serverHealthyTimeout);
    serverHealthyTimeout = setInterval(() => {
        checkServerHealth();
    }, 5 * 1000);

}

export function isServerHealthy() {
    return serverHealthy;
}

async function checkServerHealth() {

    // Check if the server is healthy. We should get a JSON response with {status: 'ok'}.
    // If it is, return true. If not, return false.
    const url = `${apiUrlPrefix}/healthcheck`;

    try {
        const result = await axios.get(url);
        const serverStatus = _.get(result, 'data.status');
        if (serverStatus === 'ok') {
            serverHealthy = true;
            return;
        }
    } catch (error) {
        console.error(`Error fetching healthcheck data from ${url}`, error);
    }

    serverHealthy = false;

}