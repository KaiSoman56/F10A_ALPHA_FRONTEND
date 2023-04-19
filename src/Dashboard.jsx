import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import Cookies from 'js-cookie';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal'
import TrendingNews from './TrendingNews';
import Ticker from './Ticker';

/* Available stocks stored in S3 */
const stock_map = {
    "BHP.AX" : ["BHP"],
    "CBA.AX" : ["Commonwealth Bank"],
    "QAN.AX" : ["Qantas"],
    "RIO.AX" : ["Rio Tinto"],
    "WOW.AX" : ["Woolworths"],
    "^AORD" : ["All ordinaries","All ords"],
    "^IXIC" : ["Nasdaq"],
    "^DJI" : ["Dow Jones"],
    "CL=F" : ["Crude Oil"],
    "GC=F" : ["Gold"],
    "SI=F" : ["Silver"],
    "NG=F" : ["Natural Gas"],
    "RB=F" : ["RBOB Gasoline"],
    "KC=F" : ["Coffee"],
    "AAPL" : ["Apple"],
    "MSFT" : ["Microsoft"],
    "AMZN" : ["Amazon"],
    "META" : ['Meta'],
    "INTC" : ['Intel'],
    "TSLA" : ['Tesla'],
    "GOOG" : ['Google'],
    "JPM" : ['JPMorgan'],
    "KO" : ['Coca-Cola'],
    "PFE" : ["Pfizer"],
    "^N100" : ["Euronext"],
    "^CMC200" : ["Crypto 200"],
    "^AMZI" : ['New York Stock Exchange']
}

export default function Dashboard() {
    const navigate = useNavigate();

    /* Session data, stored as cookies */
    const token = Cookies.get('SESSION_TOKEN');
    const loggedIn = !!token;
    const username = Cookies.get('SESSION_USERNAME');
    const group_name = Cookies.get('SESSION_GROUP');

    /* UI animation states */
    const [isLoading, setLoading] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);

    /* Data states */
    const [stockData, setStockData] = useState(null);
    const [stockName, setStockName] = useState(null);
    const [showStock, setShowStock] = useState(false);

    function handleLogout() {
        Cookies.remove('SESSION_TOKEN');
        Cookies.remove('SESSION_USERNAME');
        Cookies.remove('SESSION_GROUP');
        navigate('/login');
    }

    /* Remove stock info modal */
    function handleClose() {
        setShowStock(false);
    }

    function handleStockSearch(e) {
        /* Prevent browser from reloading the page */
        e.preventDefault();

        /* Read form data */
        const form = e.target;
        const formData = new FormData(form);
        const formJson = Object.fromEntries(formData.entries());

        /* Trigger loading animation */
        setLoading(true);

        fetch('https://proxy.cors.sh/https://afzpve4n13.execute-api.ap-southeast-2.amazonaws.com/lake_api/s3_get', {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization' : token,
                // remove me!
                'x-cors-api-key': 'temp_f6444eeea1da87688a96b18b8b787e46'
            },
            body: JSON.stringify({
                "term" : "23t1",
                "topic" : "economic",
                "sub_folder" : "F10A_ALPHA",
                "key" : formJson['stock']
            }),
        })
        .then(response => {
            /* Validate response */
            if (response.ok) {
                return response.json();
            }
            
            /* Access denied :( */
            if (response.status == 403) {
                handleLogout();
            }

            /* No such ticker in database */
            if (response.status == 400) {
                setAlertMsg('Ticker not found. Note that only a small subset of tickers is currently available.');
                return;
            }

            /* Something wrong with authentication gateway. */
            setAlertMsg('There seems to be an issue with the lookup service. Try again later.');
            throw response;
        }).then(response =>{
            /* Parse out data into stockData state */
            let sD = [];
            for (let i = 0; i < response.length; i++) {
                if (response[i]['attribute']['Ticker'].toLowerCase() === formJson['stock'].toLowerCase()) {
                    sD.push(response[i]['attribute']);
                } 
            }

            setStockData(sD);
            setStockName(stock_map[formJson['stock']]);
            setLoading(false);

            setShowStock(true);
        })
        .catch(err => {
            console.log(err);
            setLoading(false);
        });
    }

    if (!loggedIn) {
        return <Navigate to="/login" replace={true} />
    } else {
        return (
            <div style={{minWidth: 900}}>
                <Navbar bg="light" variant="light" expand="lg" className="px-5" style={{minWidth: 900}}>
                    <Container fluid>
                        <Navbar.Brand href="/dashboard" className="me-4" >
                            <img
                                src="/img/logo.jpeg"
                                width="40"
                                height="40"
                                alt=""
                                className="me-3"
                            />
                            Finance Guardian
                        </Navbar.Brand>
                        <Form className="d-flex ms-auto" noValidate onSubmit={handleStockSearch} method="POST">
                            <Form.Control
                            name="stock"
                            type="search"
                            placeholder="Enter stock ticker"
                            className="me-2"
                            aria-label="Search"
                            />
                            <Button type="submit" variant="light" disabled={isLoading} className="p-2">
                                {
                                    isLoading ? (
                                        <Spinner animation="border" variant="dark" size="sm">
                                            <span className="visually-hidden">Loading...</span>
                                        </Spinner>
                                    ) : (
                                        <img
                                            src="/img/search-icon.svg"
                                            width="20"
                                            height="25"
                                            alt="Search"
                                        />
                                    )
                                }
                            </Button>
                        </Form>
                        <NavDropdown title={ username } id="collasible-nav-dropdown" align="end" className="ms-3">
                            <NavDropdown.ItemText>Username: { username }</NavDropdown.ItemText>
                            <NavDropdown.ItemText>Group: { group_name }</NavDropdown.ItemText>
                            <NavDropdown.Divider />
                            <NavDropdown.ItemText>
                                <Button onClick={handleLogout} variant="dark">Log out</Button>
                            </NavDropdown.ItemText>
                        </NavDropdown>
                    </Container>
                </Navbar>

                <div className="container dashboard-main pt-4 pb-4" style={{minWidth: 800}}>
                    {
                        !! alertMsg ? (
                            <Alert key="danger" variant="danger" dismissible>
                                { alertMsg }
                            </Alert>
                        ) : null
                    }
                    
                    <TrendingNews />

                    <Modal size="xl" show={showStock} onHide={handleClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>{stockName}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Ticker name={stockName} data={stockData}/>
                        </Modal.Body>
                    </Modal>

                </div>
            </div>
        )
    }
}