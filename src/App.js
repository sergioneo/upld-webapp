import {
  HashRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import logo from './logo.svg';
import './App.css';

import Video from './components/video.js'

function App() {
  return (
    <div className="container-fluid">
      <div className="row">
        <Router>
          <Switch>
            <Route path="/v/:id" render={({match}) => (
                <Video
                  id={match.params.id}
                />
              )}
            />
          </Switch>
        </Router>
      </div>
    </div>
  );
}

export default App;
