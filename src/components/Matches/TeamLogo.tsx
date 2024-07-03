import './TeamLogo.css';

import React, { useEffect } from 'react';
import { IonImg } from '@ionic/react';

import _ from 'lodash';

interface ContainerProps {
  teamNames: {
    displayName: string,
    fullName: string
  };
  logoCache: string[];
  className: string;
}

// Returns the URL path for the team logo
// Logos are stored under the public folder in "assets/icons/team-logos"
function getLogoPath(teamNames: { displayName: string, fullName: string }, logoCache: string[]) {

  for (let teamName of Object.values(teamNames)) {

    // If the team name is one we need to check...
    if (teamName !== 'TBC') {

      // Strip out any accented characters from teamName as these are not supported for some
      //reason (and I can't be bothered to figure out why right now!)
      teamName = teamName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // Replace "ø" with "o" as the file path doesn't support the former (sorry, Bodo/Glimt fans!)
      teamName = teamName.replace('ø', 'o');
      // Replace forward slashes with hyphens as they are not supported in file paths (looking at you again, Bodo/Glimt fans!)
      teamName = teamName.replace('/', '-');

      // If the logo is in the cache, return the filename
      if (logoCache.includes(teamName))
        return `assets/icons/team-logos/${teamName}.png`;
    }
  }
}


const TeamLogo: React.FC<ContainerProps> = ({ teamNames, logoCache, className }) => {

  const [logoFilePath, setLogoFilePath] = React.useState<string>('');

  // Set the logo path for the team
  // Use _noLogo.png if we can't find a logo
  async function setLogoPath() {
    const logoPath = getLogoPath(teamNames, logoCache);
    if (logoPath && logoPath.length > 0)
      setLogoFilePath(logoPath);
    else
      setLogoFilePath('assets/icons/team-logos/_noLogo.png');
  }

  useEffect(() => {
    setLogoPath();
  }, [logoFilePath]);

  return (
    <IonImg
      className={className}
      src={logoFilePath || 'assets/icons/team-logos/_noLogo.png'}
      alt="Team logo">
    </IonImg>
  );
};

export default TeamLogo;