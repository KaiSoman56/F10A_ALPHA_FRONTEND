import { 
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
} from "react-router-dom";
import Login from './Login';
import Dashboard from './Dashboard';
import Ticker from "./Ticker"

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />}/>
                <Route path="/dashboard" element={<Dashboard />}/>
                <Route path="/ticker" element={<Ticker />}/>
                <Route path="/*" element={<Navigate to="/login" replace={true}/>}/>
            </Routes>
        </Router>
    )
}