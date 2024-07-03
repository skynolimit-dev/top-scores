# This script will extract a list of team names from the files in ./public/assets/icons/team-logos
# It will then write the team names to a JSON array at ./src/cache/teamLogos.json

import os
import json

# Get the list of team names from the team-logos directory
teamLogos = os.listdir('./public/assets/icons/team-logos')

# Write the team names to a JSON file as an array sorted alphabetically
# Remove the '.png' file extension from each team name
teamLogos = list(map(lambda team: team.split('.png')[0], teamLogos))
teamLogos.sort()

# Remove "_noLogo" and any entries of zero length
teamLogos = list(filter(lambda team: team != "_noLogo" and len(team) > 0, teamLogos))

with open('./src/cache/teamLogos.json', 'w') as f:
    json.dump(teamLogos, f)