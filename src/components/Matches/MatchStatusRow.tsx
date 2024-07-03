import './MatchStatusRow.css';

import React from 'react';
import { IonCol, IonRow, IonChip, IonImg } from '@ionic/react';

import _ from 'lodash';

interface ContainerProps {
    match: {
        homeTeam: {
            names: {
                displayName: string
            },
            rating: number
        },
        awayTeam: {
            names: {
                displayName: string
            },
            rating: number
        },
        id: string,
        statusMessages: string[],
        predictorDetails: {},
        tvInfo: {
            channelInfo: {
                shortName: string,
                fullName: string
            },
            logoUrl: string
        }
    },
    matchFilter: string
}

// Returns an IonChip with the TV channel logo and name
const getTvInfo = (matchId: any, tvInfo: any) => {
    const tvChannelName = _.get(tvInfo, 'channelInfo.fullName');
    if (tvChannelName && tvChannelName.length > 0) {
        return (
            <IonChip key={`match-status-col-${matchId}-tv-logo`} disabled={true} outline={false} className='match-status-col-text'>
                <IonImg className='tv-logo' src={getTvLogoUrl(tvChannelName)} alt={tvChannelName}></IonImg>
                {tvChannelName}
            </IonChip>
        );
    }
}

// Returns the logo URL for the given TV channel name
function getTvLogoUrl(tvChannelName: string) {

    // List of TV logos for which we have images under assets/icons/tv-logos
    const tvLogos = [
        "bbc",
        "channel 4",
        "itv",
        "sky",
        "apple",
        "amazon",
        "tnt"
    ]

    // Return the logo filepath if it exists for the given channel, otherwise _noLogo.png
    const tvLogo = tvLogos.find((tvLogo: string) => tvChannelName.toLowerCase().includes(tvLogo));
    return tvLogo ? `assets/icons/tv-logos/${tvLogo}.png` : 'assets/icons/tv-logos/_noLogo.png';

}

const getStatusMessage = (matchId: string, statusMessage: string, statusMessageindex: number) => {
    // Exclude status messages that reference the match time (e.g. "32'", "HT")
    // as we display them in the MatchCentre component
    if (statusMessage && (!statusMessage.includes("'") && statusMessage !== 'HT')) {
        return (
            <IonChip key={`match-status-col-${matchId}-${statusMessageindex}`} disabled={true} outline={false} className='match-status-col-text'>{statusMessage}</IonChip>
        );
    }
}

function renderNoRatingInfo(match: any, homeTeamRating: number, awayTeamRating: number) {

    // If the home team or away team name includes a '/' or 'Winner' or 'Loser', then we can't predict the match
    // as it's likely a tournament game where we're still waiting for the teams to be decided
    if (
        match.homeTeam.names.displayName === 'TBC' ||
        match.awayTeam.names.displayName === 'TBC' ||
        match.homeTeam.names.displayName.includes('/') ||
        match.awayTeam.names.displayName.includes('/') ||
        match.homeTeam.names.displayName.includes('Winner') ||
        match.awayTeam.names.displayName.includes('Winner') ||
        match.homeTeam.names.displayName.includes('Loser ') ||
        match.awayTeam.names.displayName.includes('Loser ')
    ) {
        return (
            <IonRow key={`match-status-row-${match.id}`} class="match-status">
                <IonCol class="match-status">
                    <IonChip key={`match-${match.id}-no-rating`} disabled={true} outline={false}>
                        Sorry, I can't predict this match yet
                    </IonChip>
                </IonCol>
            </IonRow>
        )
    }

    // Otherwise, if we don't have enough team ratings, then we display an info message
    else {
        let noRatingLabel = '';

        if (homeTeamRating === 0)
            noRatingLabel = match.homeTeam.names.displayName;
        if (awayTeamRating === 0) {
            noRatingLabel += noRatingLabel.length > 0 ? ' and ' : '';
            noRatingLabel += match.awayTeam.names.displayName;
        }

        return (
            <IonRow key={`match-status-row-${match.id}`} class="match-status">
                <IonCol class="match-status">
                    <IonChip key={`match-${match.id}-no-rating`} disabled={true} outline={false}>
                        Sorry, I don't know enough about {noRatingLabel} to make a prediction
                    </IonChip>
                </IonCol>
            </IonRow>
        )
    }
}

const MatchStatusRow: React.FC<ContainerProps> = ({ match, matchFilter }) => {

    let statusMessages: any[] = [];

    // No need to show anything if we're on the predictor, unless there are no team ratings available in which case an info message should be displayed
    if (matchFilter === 'predictor') {
        const homeTeamRating = _.get(match, 'homeTeam.rating', 0);
        const awayTeamRating = _.get(match, 'awayTeam.rating', 0);
        if (match.homeTeam.rating === 0 || match.awayTeam.rating === 0)
            return renderNoRatingInfo(match, homeTeamRating, awayTeamRating);
        else {
            match.tvInfo = { channelInfo: { shortName: '', fullName: '' }, logoUrl: '' };
            statusMessages = match.statusMessages.filter((statusMessage: string) => statusMessage.includes('Predict'));
        }
    }

    // Remove 'FT', 'AET' and 'HT' status messages as they will be displayed in the MatchCentre component for today's matches
    if (matchFilter !== 'results')
        statusMessages = match.statusMessages.filter((statusMessage: string) => statusMessage !== 'HT' && statusMessage !== 'FT' && statusMessage !== 'AET');

    // For the results tab, remove the 'FT' status message but keep 'AET' as it's of interest
    if (matchFilter === 'results')
        statusMessages = match.statusMessages.filter((statusMessage: string) => statusMessage !== 'FT');

    return (
        <IonRow key={`match-status-row-${match.id}`} class="match-status">
            <IonCol class="match-status">
                {/* If there is a TV logo and channel, display it */}
                {getTvInfo(match.id, match.tvInfo)}
                {/* For each status messages in the match.statusMessages array, display an IonChip with the status message text */}
                {statusMessages && statusMessages.length > 0 && statusMessages.map((statusMessage: string, statusMessageindex: number) => (
                    getStatusMessage(match.id, statusMessage, statusMessageindex)
                ))}
            </IonCol>
        </IonRow>
    );
};

export default MatchStatusRow;