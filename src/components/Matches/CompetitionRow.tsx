import React from 'react';
import { IonCol, IonRow } from '@ionic/react';

import './CompetitionRow.css';

interface ContainerProps {
    competition: {
        name: string,
        subHeading: string
    },
    displayHeading: boolean
  }

function renderCompetitionLabel(competitionName: string) {
    return (
        <div className="competition-heading">{competitionName}</div>
    );
}

function renderCompetitionSubHeading(subHeading: string) {
    if (subHeading && subHeading.length > 0) {
        return (
            <div className="competition-sub-heading">{subHeading}</div>
        );
    }
}

const CompetitionRow: React.FC<ContainerProps> = ({ competition, displayHeading }) => {


    return (
        <IonRow key={competition.name} className="competition-row ion-justify-content-center">
            <IonCol size="auto">
                {displayHeading ? renderCompetitionLabel(competition.name) : ''}
                {renderCompetitionSubHeading(competition.subHeading)}
            </IonCol>
        </IonRow>
    );
};

export default CompetitionRow;