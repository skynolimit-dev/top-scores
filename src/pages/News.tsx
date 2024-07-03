import { IonButton, IonContent, IonPage } from '@ionic/react';
import NewsContainer from '../components/News/NewsContainer';

type NewsProps = {
    title: string;
    getNews: Function;
    deviceId: string;
};

const News: React.FC<NewsProps> = ({ title, getNews, deviceId }) => {

    return (
        <IonPage>
            <IonContent>
                <NewsContainer getNews={getNews} deviceId={deviceId} />
            </IonContent>
        </IonPage>
    );
};

export default News;
