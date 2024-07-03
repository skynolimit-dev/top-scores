import { apiUrlPrefix, requestTimeout } from './globals';

import axios from "axios";
axios.defaults.timeout = requestTimeout;

// Returns the array of competitions from the server
export async function getTeams(category: string) {
    const url = `${apiUrlPrefix}/teams/${category}`;
    try {
        const result = await axios.get(url);
        return result.data;
    } catch (error) {
        console.error(`Error fetching teams from ${url}`, error);
    }
}