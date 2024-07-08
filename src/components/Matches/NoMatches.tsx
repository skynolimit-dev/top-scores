import { IonCard, IonTitle, IonCardContent, IonCardHeader, IonButton } from '@ionic/react';

interface ContainerProps {
    matchesCount: number;
}

import './NoMatches.css';
import { useEffect } from 'react';

let timeoutRenderNoMatchesContent: any;
let ready: boolean = false;

function getDelayedNoMatchesContent() {
    if (ready) {
        return (
            <div className='no-matches-container'>
                <IonCard>
                    <IonCardHeader>
                        <IonTitle>Where are the matches?</IonTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <img src='/images/no-matches.jpg' alt='No matches' className='no-matches-image ion-margin-top ion-margin-bottom' />
                        <p className='ion-padding'>Sorry, we couldn't find any matches based on your current settings.</p>
                        <p className='ion-padding'>Would you like to head to the setup screen to update your favourites?</p>
                        <IonButton expand="block" color="tertiary" className='ion-padding-bottom' onClick={() => window.location.href="/setup"}>Yes, let's do this</IonButton>
                    </IonCardContent>
                </IonCard>
            </div>
        );
    }
}


const NoMatches: React.FC<ContainerProps> = ({ matchesCount }) => {

    async function delayLoading() {
        ready = false;
        await new Promise(r => timeoutRenderNoMatchesContent = setTimeout(r, 5000));
        ready = true;
    }

    useEffect(() => {

        delayLoading();

        // Clear the interval when the component is unmounted (otherwise things get crazy!)
        return () => clearTimeout(timeoutRenderNoMatchesContent);

    }, [matchesCount]);

    if (matchesCount === 0) {
        return getDelayedNoMatchesContent();
    }
};

export default NoMatches;
