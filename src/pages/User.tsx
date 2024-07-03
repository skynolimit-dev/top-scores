import { IonContent, IonPage } from '@ionic/react';
import About from '../components/User/About';
import Preferences from '../components/User/Preferences';

let appInfo: string = '';

interface UserProps {
  store: { 
    set: (key: string, value: any) => Promise<void>; 
    get: (key: string) => Promise<any>; 
  };
  deviceId: string;
  initMatches: Function;
  logoCache: string[];
}

const User: React.FC<UserProps> = ({ initMatches, logoCache, store, deviceId }) => {
  return (
    <IonPage>
      <IonContent>
        <Preferences initMatches={initMatches} logoCache={logoCache} store={store} deviceId={deviceId} />
        <About deviceId={deviceId} />
      </IonContent>
    </IonPage>
  );
};

export default User;
