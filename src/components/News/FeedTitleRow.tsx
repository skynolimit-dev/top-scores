import React from 'react';
import { IonCol, IonRow } from '@ionic/react';

import './FeedTitleRow.css';

interface ContainerProps {
    feed: {
        title: string,
        url: string
    }
}

const CompetitionRow: React.FC<ContainerProps> = ({ feed }) => {

    return (
        <IonRow key={feed.title} className="feed-title-row ion-justify-content-center">
            <IonCol size="auto">
                <span className="feed-title">{feed.title}</span>
            </IonCol>
        </IonRow>
    );
};

export default CompetitionRow;