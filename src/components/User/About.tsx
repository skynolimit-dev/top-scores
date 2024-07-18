import { App } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonToast } from '@ionic/react';
import { copyOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { rootDomain } from '../../lib/globals';
import './About.css';

import { apiUrlPrefix } from '../../lib/globals';

interface AboutProps {
    deviceId: string;
}

function renderAboutInfo() {
    return (
        <IonCard>
            <IonCardHeader>
                <IonCardTitle>About this app</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
                <div className='ion-padding-bottom'>
                    <h2>Sky No Limit</h2>
                    <p>This app was developed by <a target='_blank' href='https://skynolimit.dev'>Sky No Limit</a>.</p>
                </div>
                <div className='ion-padding-bottom'>
                    <h2>Developers and key contributors:</h2>
                    <ul>
                        <li>Mike Wagstaff</li>
                        <li>Skyla Wagstaff</li>
                        <li>Nova Wagstaff</li>
                    </ul>
                </div>
                <h2>Acknowledgements and data sources</h2>
                <ul>
                    <li><a target='_blank' href='https://www.bbc.co.uk/sport/football'>BBC Sport</a></li>
                    <li><a target='_blank' href='https://www.fotmob.com'>FotMob</a></li>
                    <li><a target='_blank' href='http://clubelo.com/'>Football Club Elo Ratings</a></li>
                    <li><a target='_blank' href='https://eloratings.net/'>World Football Elo Ratings</a></li>
                    <li><a target='_blank' href='https://www.theguardian.com/football'>The Guardian Football</a></li>
                    <li><a target='_blank' href='https://www.telegraph.co.uk/football/'>The Telegraph Football</a></li>
                    <li><a target='_blank' href='https://www.dailymail.co.uk/sport/football/index.html'>Daily Mail Football</a></li>
                    <li><a target='_blank' href='https://unsplash.com/@focusmitch'>Mitch Rosen ("Welcome" image)</a></li>
                    <li><a target='_blank' href='https://unsplash.com/@baraida'>Peter Glaser ("No matches" image)</a></li>
                </ul>

            </IonCardContent>
        </IonCard>
    )
}


function renderWidgetInfo(deviceId: string) {
    // TODO: Use this URL for the widget download link going forward
    // const widgetUri = `${apiUrlPrefix}/user/${deviceId}/widget/:widgetCategory/:tvOnly`;
    const widgetUri = 'https://github.com/mwagstaff/scriptable/tree/main/football-scores';
    return (
        <IonCard>
            <IonCardHeader>
                <IonCardTitle>Widget</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <div className='ion-padding-bottom'>
                    <p className='ion-text-justify'>A <a href='https://itunes.apple.com/us/app/scriptable/id1405459188?mt=12'>Scriptable</a> based home screen widget is available.</p>
                    <IonButton className='ion-padding-top ion-padding-bottom' expand='block' href={widgetUri} target='_blank'>Download &amp; setup instructions</IonButton>
                    <img className='widget-image' src='https://github.com/mwagstaff/scriptable/raw/main/football-scores/screenshot.jpg' />
                </div>
            </IonCardContent>
        </IonCard>
    )
}


function renderVersionInfo(versionInfo: string) {
    return (
        <IonCard>
            <IonCardHeader>
                <IonCardTitle>Version</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>{versionInfo}</IonCardContent>
        </IonCard>
    )
}

function renderAdvancedInfo() {
    return (
        <IonCard>
            <IonCardHeader>
                <IonCardTitle>Advanced</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <div className='ion-padding-bottom'>

                </div>
            </IonCardContent>
        </IonCard>
    )
}

const About: React.FC<AboutProps> = ({ deviceId }) => {

    const [isToastOpen, setIsToastOpen] = useState(false);
    const [versionInfo, setVersionInfo] = useState('');

    async function populateVersionInfo() {
        const appInfo = await App.getInfo();
        if (appInfo && appInfo.version) {
            setVersionInfo(appInfo.version);
        }
    }

    function copyDeviceId(deviceId: string) {
        Clipboard.write({
            string: deviceId
        });
        setIsToastOpen(true);
    }

    function renderApiServer() {
        if (rootDomain.includes('local')) {
            return (
                <div className='dark-gray ion-padding-bottom'>
                    <span>API server: {rootDomain}</span>
                </div>
            )
        }
    }

    useEffect(() => {
        populateVersionInfo();
    }, [versionInfo]);

    return (
        <Fragment>
            {renderAboutInfo()}
            {renderWidgetInfo(deviceId)}
            {renderVersionInfo(versionInfo)}

            {/* Troubleshooting info */}
            <div className='dark-gray' onClick={() => copyDeviceId(deviceId)}>
                <span>
                    Device ID: {deviceId}
                </span>
                <span>
                    <IonIcon className='copy-icon' icon={copyOutline}></IonIcon>
                </span>
                <IonToast
                    isOpen={isToastOpen}
                    message="Device ID copied to clipboard"
                    onDidDismiss={() => setIsToastOpen(false)}
                    duration={5000}
                ></IonToast>
            </div>
            {renderApiServer()}

        </Fragment>
    );
};

export default About;