import { apiUrlPrefix, requestTimeout } from './globals';

import axios from "axios";
axios.defaults.timeout = requestTimeout;

// Returns the array of competitions from the server
export async function getCompetitions() {
    const url = `${apiUrlPrefix}/competitions`;
    try {
        const result = await axios.get(url);
        return result.data;
    } catch (error) {
        console.error(`Error fetching competitions from ${url}`, error);
    }
}