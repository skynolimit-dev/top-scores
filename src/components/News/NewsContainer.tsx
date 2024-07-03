import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonThumbnail,
} from '@ionic/react';

import _ from 'lodash';
import React, { Fragment, useEffect, useState } from 'react';
import { IonGrid, IonRefresher, IonRefresherContent, RefresherEventDetail } from '@ionic/react';

import './NewsContainer.css';

import FeedTitleRow from './FeedTitleRow';
import NewsStoryRow from './NewsStoryRow';


interface ContainerProps {
    getNews: Function,
    deviceId: string
}

const MatchesContainer: React.FC<ContainerProps> = ({ getNews, deviceId }) => {

    const [news, setNews] = useState([]);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
        await (setLatestNews());
        event.detail.complete();
    };

    // Set the latest news data in the state
    async function setLatestNews() {
        let newsToApply = await getNews(deviceId);

        // Wait for the filteredMatches array to populate, before setting the state
        while (!newsToApply || newsToApply.length === 0) {
            await new Promise(r => setTimeout(r, 500));
            newsToApply = await getNews(deviceId);
        }

        setNews(newsToApply);
        setLastUpdated(new Date());

    }

    useEffect(() => {

        if (!news || news.length === 0) {
            setLatestNews();
        }

        // Automatically refresh data every minute
        const timeoutId = setInterval(setLatestNews, 60 * 1000);

        // Clear the interval when the component is unmounted (otherwise things get crazy!)
        return () => clearInterval(timeoutId);

    }, [news]);

    // Display a header row with the date for each new feed title we encounter
    // e.g. "BBC Sport - Football"
    const renderFeedTitleRow = (articles: any[], index: any) => {
        const previousTitle = _.get(articles, `[${index - 1}].feed.title`, '');
        const currentTitle = _.get(articles, `[${index}].feed.title`, '');
        const emptyArticle: any = {};
        const article = _.get(articles, `[${index}]`, emptyArticle);
        if (previousTitle !== currentTitle && article.feed) {
            return (
                <FeedTitleRow key={`feed-row-container-${currentTitle}`} feed={article.feed} />
            )
        }
    }

    // Display the footer row with the last updated time
    const renderFooter = () => {
        if (lastUpdated) {
            return (
                <div className='last-updated'>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
            )
        }
    }

    function renderStoriesGrid() {
        return (
            <IonGrid key="stories-grid">
                {/* Display a grid of rows showing all the news stories, separated by header rows for new feed titles */}
                {news.map((article: any, index: number) => (
                    { ...renderArticleRow(article, index) }
                ))}
            </IonGrid>
        );
    }

    function renderArticleRow(article: any, index: any) {
        return (
            <Fragment key={`news-fragment-${article.story.title}`}>
                {renderFeedTitleRow(news, index)}
                <NewsStoryRow key={`news-story-row-container-${article.story.title}`} story={article.story} />
            </Fragment>
        );
    }

    //   return (
    //     <div>
    //       <IonRefresher key="refresher" slot="fixed" pullFactor={0.5} pullMin={100} pullMax={200} onIonRefresh={handleRefresh}>
    //         <IonRefresherContent key="refresherContent"></IonRefresherContent>
    //       </IonRefresher>

    //       {renderStoriesGrid()}

    //       {renderFooter()}

    //     </div>
    //   );





    return (
        <Fragment>
            <IonRefresher key="refresher" slot="fixed" pullFactor={0.5} pullMin={100} pullMax={200} onIonRefresh={handleRefresh}>
                <IonRefresherContent key="refresherContent"></IonRefresherContent>
            </IonRefresher>
            <IonContent>
                <IonList>
                    {renderStoriesGrid()}
                </IonList>
            </IonContent>
        </Fragment>
    );



};

export default MatchesContainer;