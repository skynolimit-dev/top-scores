export const matchFilters = [
    "fixtures",
    "results",
    "onTv",
    "predictor"
];

export const matchRefreshIntervals = {
    fixtures: 5 * 1000,
    results: 120 * 1000,
    onTv: 5 * 1000,
    predictor: 1 * 1000
};

export const predictorSettings = {
    goalChancePerMinute: 0.015,
    teamRatingDifferential: 3,
    refreshIntervalMilliseconds: {
        slow: 500,
        medium: 200,
        fast: 10
    }
}

export const healthcheckRefreshInterval = 10 * 1000;
export const newsRefreshInterval = 60 * 1000;
export const environment = process.env.NODE_ENV;

// Log the value of the NODE_ENV environment variable
console.info('NODE_ENV: ', environment);

// Server API URL
export const rootDomain = environment === 'production' ? 'https://football-scores-api.fly.dev' : 'http://Mikes-MacBook-Air.local';
// export const rootDomain = 'http://Mikes-MacBook-Air.local'; 
console.info('Server API URL: ', rootDomain);
export const apiUrlPrefix = `${rootDomain}/api/v1`;

// Server request timeout - default to 10 seconds
export const requestTimeout = 5 * 1000;