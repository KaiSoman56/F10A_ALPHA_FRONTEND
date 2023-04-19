import { React, useState, useEffect, useRef } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/* GraphQL API URL */
const gqlAPI = "https://afzpve4n13.execute-api.ap-southeast-2.amazonaws.com/H09A_FOXTROT/graphql";
const GQL_HOWS_IT_TRENDING = `
    query howsItTrending(
        $keyword: String!,
        $startDate: String,
        $endDate: String,
        $comparisonStartDate: String,
        $comparisonEndDate: String
    ) {
        howsItTrending(
        keyword: $keyword,
        startDate: $startDate,
        endDate: $endDate,
        comparisonStartDate: $comparisonStartDate,
        comparisonEndDate: $comparisonEndDate
        ) {
        keyword
        trending_index
        articles_for_target_period
        average_article_count_per_period
        target_period_start_date
        }
    }
`;

const tickerNameMap = {
    "BHP.AX" : "bhp",
    "CBA.AX" : "commonwealth bank",
    "QAN.AX" : "qantas",
    "RIO.AX" : "rio tinto",
    "WOW.AX" : "woolworths",
    "^AORD" : "all ordinaries",
    "^IXIC" : "nasdaq",
    "^DJI" : "dow jones",
    "CL=F" : "crude oil",
    "GC=F" : "gold",
    "SI=F" : "silver",
    "NG=F" : "natural gas",
    "RB=F" : "rbob gasoline",
    "KC=F" : "coffee",
    "AAPL" : "apple",
    "MSFT" : "microsoft",
    "AMZN" : "amazon",
    "META" : 'meta',
    "INTC" : 'intel',
    "TSLA" : 'tesla',
    "GOOG" : 'google',
    "JPM" : 'jpmorgan',
    "KO" : 'coca-cola',
    "PFE" : "pfizer",
    "^N100" : "euronext",
    "^CMC200" : "crypto 200",
    "^AMZI" : 'new york stock exchange'
}

function TData (props) {
    const json = props;
    const rows = [];

    /* Create table rows from JSON file */
    for (let i in json){
        rows.push(
            <tr key={json[i]['Date']}>
                <td>{json[i]['Open']}</td>
                <td>{json[i]['High']}</td>
                <td>{json[i]['Low']}</td>
                <td>{json[i]['Close']}</td>
                <td>{json[i]['Adj Close']}</td>
                <td>{json[i]['Volume']}</td>
                <td>{json[i]['Date']}</td>
            </tr>
        )
    } 
    
    return (<tbody>{rows}</tbody>);
}

function ShowTable (props) {
    const json = props;

    /* Configure table head and send JSON for data fields */
    return (
        <Table striped bordered responsive>
            <thead>
                <tr>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                    <th>Adj Close</th>
                    <th>Volume</th>
                    <th>Date</th>
                </tr>
            </thead>
            <TData {...json} />
        </Table>
    );
}

function ShowGraph (props) {
    const json = props;
    
    /* New array for graph data */
    const data = [];

    /* Configure graph layout */
    for (let i in json){
        data.push( 
            {
                Date: json[i]['Date'],
                Open: json[i]['Open'],
                High: json[i]['High'],
                Low: json[i]['Low'],
                Close: json[i]['Close'],
                AltClose: json[i]['Alt Close'],
                Volume: json[i]['Volume']
            }
        )
    };

    /* Create graphs for OHLC and Volume data */
    return(
        <div margin-left="auto" margin-right="auto" text-align="center">
            <h5>OHLC</h5>
            <ResponsiveContainer width="99%" height={500}>
                <LineChart width={600} height={200} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <XAxis dataKey="Date"/>
                    <YAxis />
                    <Tooltip />
                    <Legend/>
                    <Line type="monotone" dataKey="Open" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="High" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="Low" stroke="#d88884" />
                    <Line type="monotone" dataKey="Close" stroke="#84d888" />
                    <Line type="monotone" dataKey="AltClose" stroke="#b284d8" />
                </LineChart>
            </ResponsiveContainer>

            <h5>Volume</h5>
            <ResponsiveContainer width="99%" height={500}>
                <LineChart width={600} height={300} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <XAxis dataKey="Date"/>
                    <YAxis />
                    <Tooltip />
                    <Legend/>
                    <Line type="monotone" dataKey="Volume" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

function KeywordTrend (props) {
    const triggered = useRef(false);
    const keyword = tickerNameMap[props.keyword];
    const [data, setData] = useState([]);

    const daysAgo = (n) => {
        let date = new Date(Date.now() - n * 24 * 60 * 60 * 1000);
        let date_str = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
        return date_str;
    }

    function getKeywordTrendScore(keyword, startDate, endDate) {
        fetch(gqlAPI, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "origin": "grida.co"
            },
            body: JSON.stringify({
                query: GQL_HOWS_IT_TRENDING,
                variables: {
                    "keyword": keyword,
                    "startDate": startDate,
                    "endDate": endDate
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
        .then((res) => {
            setData(data => [...data, res['data']['howsItTrending']]);
        })
        .catch(err => {
            console.log('Error fetching: ', err);
        });
    }

    useEffect(() => {
        if (!triggered.current) {
            for (let i = 1; i <= 7; i++) {
                getKeywordTrendScore(keyword, daysAgo(i), daysAgo(i-1));
            }
            triggered.current = true;
        }
    });

    return (
        <div margin-left="auto" margin-right="auto" text-align="center">
            <h5>Trendiness in Media</h5>
            <ResponsiveContainer width="99%" height={500}>
                <LineChart width={600} height={300} 
                data={data.sort(function(a,b){return Date.parse(a.target_period_start_date) - Date.parse(b.target_period_start_date)})} 
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                    <XAxis dataKey="target_period_start_date"/>
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="trending_index" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="articles_for_target_period" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="average_article_count_per_period" stroke="#d88884" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
 
export default function Ticker(props) {
    const name = props.name;
    const json = props.data;

    return(
        <div >
            <div className="container dashboard-main pt-4 pb-4">
                <Card className="text-center mb-3">
                    <Card.Header>7-day OHLC Retrospective</Card.Header>
                    <Card.Body>
                        <Card.Title>{...json[0]['Ticker']}</Card.Title>
                        <ShowTable {...json}/>
                    </Card.Body>
                </Card>

                <Card className="text-center mb-3">
                    <Card.Header>Graphs</Card.Header>
                    <Card.Body>
                        <ShowGraph {...json} />
                    </Card.Body>
                </Card>

                <Card className="mb-3">
                    <Card.Header className="text-center">Keyword Trends</Card.Header>
                    <Card.Body>
                        <Card.Text className="text-muted">
                            Trendiness of the word "{tickerNameMap[name]}" in media, measured as an index by 
                            comparing the number of occurences of "{tickerNameMap[name]}" in published news 
                            articles over a period of time, compared to the overall average number of occurences.
                        </Card.Text>
                        <KeywordTrend keyword={name} />
                    </Card.Body>
                </Card>
            </div>
        </div>        
    )
}
