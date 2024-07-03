import React from 'react';
import { IonCol, IonRow } from '@ionic/react';

import moment from 'moment';

import './DateRow.css';

interface ContainerProps {
    matchId: number,
    date: string
  }

const getFriendlyDate = (date: string) => {
    // If date is today, return "Today"
    if (moment(date).isSame(moment(), 'day'))
        return 'Today';
    // If date is tomorrow, return "Tomorrow"
    else if (moment(date).isSame(moment().add(1, 'day'), 'day'))
        return 'Tomorrow';
    // If date is yesterday, return "Yesterday"
    else if (moment(date).isSame(moment().subtract(1, 'day'), 'day'))
        return 'Yesterday';
    else
        return moment(date).format('dddd, MMMM Do');
}

const DateRow: React.FC<ContainerProps> = ({ matchId, date }) => {

    return (
        <IonRow key={`date-row-${matchId}`} className="date-row ion-justify-content-center">
            <IonCol size="auto" class="date-label">{getFriendlyDate(date)}</IonCol>
        </IonRow>
    );
};

export default DateRow;