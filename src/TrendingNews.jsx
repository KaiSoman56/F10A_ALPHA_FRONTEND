import { useState, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Spinner from 'react-bootstrap/esm/Spinner';

/* GraphQL API URL */
const gqlAPI = "https://afzpve4n13.execute-api.ap-southeast-2.amazonaws.com/H09A_FOXTROT/graphql";

/* GQL Queries */
const GQL_MOST_RECENT_ARTICLES = `
query mostRecentArticles(
    $with_live_blog: Boolean,
    $num_of_articles: Int,
    $source: String
) {
    mostRecentArticles(
    with_live_blog: $with_live_blog,
    num_of_articles: $num_of_articles,
    source: $source
    ) {
    title
    type
    URL
    date
    section
    source
    }
}
`;

const GQL_DAILY_SUMMARY = `
fragment KeyValuePairFragment on KeyValuePair {
    topic
    count
}

query dailySummary($date: String) {
  dailySummary(date: $date) {
    total_articles
    articles_details {
      ...KeyValuePairFragment
    }
  }
}
`;


export default function TrendingNews() {
    const [recentArticles, setRecentArticles] = useState(null);
    const [dailySummary, setDailySummary] = useState(null);

    useEffect(() => {
        // getRecentArticles();
        // getDailySummary();
    }, []);

    function getRecentArticles() {
        fetch(gqlAPI, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "x-cors-api-key": "temp_2a4ef6b7261776d25a0d5f23aaf2047d"
            },
            body: JSON.stringify({
                query: GQL_MOST_RECENT_ARTICLES,
                variables: {
                    "with_live_blog": true, 
                    "num_of_articles": 5, 
                    "source": ""
                }
            })
        })
        .then((response) => {
            if (response.status >= 400) {
                throw new Error(response.json());
            } else {
                return response.json();
            }
        })
        .then(data => {
            setRecentArticles(data['data']['mostRecentArticles']);
        })
        .catch(err => {
            console.log(err);
            /* Try again */
            getRecentArticles();
        });
    }

    function getDailySummary() {
        fetch(gqlAPI, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                query: GQL_DAILY_SUMMARY,
                variables: {"date": ""}     /* Empty date defaults to yesterday */
            })
        })
        .then((response) => {
            if (response.status >= 400) {
                throw new Error(response.json());
            } else {
                return response.json();
            }
        })
        .then(data => {
            setDailySummary(data['data']['dailySummary']);
        })
        .catch(err => {
            console.log(err);
            /* Try again */
            // getDailySummary(); // Or not, since dailySummary isn't working
        });
    }

    return (
        <div>
            <div className="row">
                <Card className="col m-2">
                    <Card.Body>
                        <Card.Title>Daily Summary</Card.Title>
                        <Card.Text className="text-muted">
                            A summary of the most popular topics since yesterday.
                        </Card.Text>
                            { !!dailySummary ? (
                                dailySummary['articles_details'].map((a) => (
                                    <p key={a.topic}>Topic: {a.topic}, Count: {a.count}</p>
                                ))
                            ) : (
                                <Spinner className="my-2"></Spinner>
                            )}
                    </Card.Body>
                </Card>
                <Card className="col m-2">
                    <Card.Body>
                        <Card.Title>Recent Articles</Card.Title>
                        <Card.Text className="text-muted">
                            A list view of the most recently posted articles from various news sources.
                        </Card.Text>
                        <ListGroup>
                            { !!recentArticles ? (
                                recentArticles.map((a) => (
                                    <ListGroup.Item key={a.title}>
                                        <a href={a['URL']} target="_blank" className="h6">{a['title']}</a>
                                        <p>
                                            {a['type']} | <span className="text-muted">{a['date']}</span><br></br>
                                            <em>{a['source']}</em>
                                        </p>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <Spinner className="my-2"></Spinner>
                            )}
                        </ListGroup>
                    </Card.Body>
                </Card>
            </div>
        </div>
    )
}