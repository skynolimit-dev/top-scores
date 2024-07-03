import React, { Fragment } from 'react';
import { IonCol, IonRow, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonImg, IonItem, IonThumbnail, IonLabel } from '@ionic/react';

import './NewsStoryRow.css';

interface ContainerProps {
    story: any
}

function renderTitleRow(story: any) {
    const key = `${story.title}-title`;
    return (
        <IonRow key={key}>
            <IonCol size="auto">
                <span className="feed-title">{story.title}</span>
            </IonCol>
        </IonRow>
    );
}

function renderDescriptionRow(story: any) {
    const key = `${story.title}-description`;
    return (
        <IonRow key={key}>
            <IonCol size="auto">
                <span>{story.description}</span>
            </IonCol>
        </IonRow>
    );
}

function loadStory(url: string) {
    window.open(url, '_blank');
}

function renderStoryImage(story: any) {
    if (story.imageUrl && story.imageUrl.length > 0) {
        return (
            <IonThumbnail className='' slot="end">
                <img alt={story.title} src={story.imageUrl} />
            </IonThumbnail>
        );
    }
}

function renderStoryContent(story: any) {

    let storyDescription = story.description;

    // If the description is too long, truncate it for readability
    if (storyDescription && storyDescription.length > 150) {
        storyDescription = storyDescription.substring(0, 150) + '...';
    }

    return (
        <IonLabel>
            <h4>{story.title}</h4>
            <p className='story-description ion-text-left'>{storyDescription}</p>
        </IonLabel>
    );

}

const NewsStoryRow: React.FC<ContainerProps> = ({ story }) => {

    return (
        <IonItem button onClick={() => loadStory(story.link)}>
            {renderStoryImage(story)}
            {renderStoryContent(story)}
        </IonItem>
    );
};

export default NewsStoryRow;