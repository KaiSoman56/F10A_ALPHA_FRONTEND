import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Cookies from 'js-cookie';
import './Login.css';

export default function Login() {
    const navigate = useNavigate();
    const loggedIn = !!Cookies.get('SESSION_TOKEN');
    const [validated, setValidated] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);
    const [isLoading, setLoading] = useState(false);

    function handleSubmit(e) {        
        /* Prevent browser from reloading the page */
        e.preventDefault();
        setAlertMsg(null);

        /* Read form data */
        const form = e.target;
        const formData = new FormData(form);
        const formJson = Object.fromEntries(formData.entries());

        /* Validate form fields */ 
        if (form.checkValidity() === false) {
            e.preventDefault();
            e.stopPropagation();
            setValidated(true);
            return;
        }

        /* Update button loading transition */
        if (!isLoading) {
            setLoading(true);
        }
        
        /* Send login request */
        // REMOVE ME FROM PROD!
        // gotta bypass cors in dev, and im too lazy to setup a proxy server soooooo
        // fetch('https://afzpve4n13.execute-api.ap-southeast-2.amazonaws.com/login', {
        fetch('https://afzpve4n13.execute-api.ap-southeast-2.amazonaws.com/login', {
            method: form.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formJson),
        })
        .then(response => {
            /* Validate response */
            if (response.ok) {
                return response.json();
            }
            
            /* Access denied :( */
            if (response.status == 400) {
                setAlertMsg('Invalid username, groupname and password combination.');
                throw response.json();
            }

            /* Something wrong with authentication gateway. */
            setAlertMsg('There seems to be an issue with the authentication servers. Try again later.');
            throw response;
        })
        .then(response => {
            /* Store token as cookie */
            const inFifteenMinutes = new Date(new Date().getTime() + 15 * 60 * 1000);
            Cookies.set('SESSION_TOKEN', response['token'], { expires:  inFifteenMinutes });
            Cookies.set('SESSION_USERNAME', formJson['username'], { expires:  inFifteenMinutes });
            Cookies.set('SESSION_GROUP', formJson['group'], { expires:  inFifteenMinutes });

            /* Redirect to dashboard */
            navigate('/dashboard');
        })
        .catch(err => {
            /* Clean-up */
            Cookies.remove('SESSION_TOKEN');
            Cookies.remove('SESSION_TOKEN');
            Cookies.remove('SESSION_TOKEN');

            console.log(err);
            setLoading(false);
        });
    }

    if (loggedIn) {
        return <Navigate to="/dashboard" replace={true}/>
    }
    return (
        <div className="login-bg h-100 d-flex align-items-center justify-content-center">
            <Card className="login-card">
                <Form noValidate validated={validated} onSubmit={handleSubmit} method="POST">
                    <h1 className="text-center">Login</h1>
                    <Form.Group className="mb-3" controlId="formUsername">
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="username" placeholder="Enter username" name="username" required/>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formGroup">
                        <Form.Label>Group name</Form.Label>
                        <Form.Control type="text" placeholder="Your SENG3011 group" name="group" required/>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formPassword">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" placeholder="Password" name="password" required/>
                        <Form.Text className="text-muted">
                        These are your SENG3011 authentication gateway credentials.
                        </Form.Text>
                    </Form.Group>

                    <div className="mb-3 text-center">
                        <Button variant="primary" type="submit" disabled={isLoading}>
                            {isLoading ? 'Logging in…' : 'Log in'}
                        </Button>
                    </div>

                    {
                        !! alertMsg ? (
                            <Alert key="danger" variant="danger">
                                { alertMsg }
                            </Alert>
                        ) : null
                    }
                </Form>
            </Card>
        </div>
    )
}