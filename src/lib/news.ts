import { apiUrlPrefix, newsRefreshInterval, requestTimeout } from './globals';

import _ from 'lodash';

import axios from 'axios';
axios.defaults.timeout = requestTimeout;

const lastFetched = new Date(new Date().getTime() - 5 * 60000);

let timeoutFetchData: any;


let newsIntialised = false;

export let news = [];

// Initialize the news
export async function initNews(deviceId: string) {

    await fetchData(deviceId);
    newsIntialised = true;

}

// Returns true if the news has been initialized
export function newsInitialised() {
    return newsInitialised;
}

// Fetch the news data from the server
async function fetchData(deviceId: string) {

    clearTimeout(timeoutFetchData);

    // If the last fetched date is less than the refresh interval, return
    if (new Date().getTime() - lastFetched.getTime() < newsRefreshInterval) {
        return;
    }

    const url = `${apiUrlPrefix}/user/${deviceId}/news`;
    
    try {
        const result = await axios.get(url);
        if (result && result.data && result.data.length > 0)
            news = result.data;
    } catch (error) {
        console.error(`Error fetching news data from ${url}`, error);
    }

    // Repeat the call after the refresh interval
    timeoutFetchData = setTimeout(() => {
        fetchData(deviceId);
    }, newsRefreshInterval);
}

// Return the news
// TODO (future): Allow per-user customised news feed
export function getNews(deviceId: string) {
    return news;
}