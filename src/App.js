import {
  HashRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import logo from './logo.svg';
import './App.css';

import Video from './components/video.js'
import NewVideo from './components/newvideo.js'

function App() {
  return (
    <div>
      <nav className="navbar navbar-dark bg-dark p-2">
        <a className="navbar-brand" href="#">UPLD</a>
      </nav>
      <div className="container-fluid no-padding">
        <div className="row">
          <Router>
            <Switch>
              <Route exact path="/v/new">
                <NewVideo />
              </Route>
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
    </div>
  );
}

export default App;
