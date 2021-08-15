import React, { useState, Component, useRef } from 'react'
import Web3 from 'web3'
import {INFURA_ENDPOINT, UPLD_REGISTRY_ADDRESS, UPLD_REGISTRY_ABI, FIREBASE_CONFIG} from '../config'
import Button from 'react-bootstrap/Button'
import hmacSHA1 from 'crypto-js/hmac-sha1'
import Firebase from 'firebase'
import { v4 as uuidv4 } from 'uuid';

function rot13(s) {
  return s.replace(/[a-zA-Z]/g,function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+13)?c:c-26);});
}

class Video extends Component {
  intervalID

  constructor(props) {
    super(props)
    this.id = props.id
    this.state = {validate: -1, video: false, channel: false, bkgMusic: false, locked: false, indexData: false, countedView: false}
    if (!Firebase.apps.length) {
       Firebase.initializeApp(FIREBASE_CONFIG)
    }else {
       Firebase.app(); // if already initialized, use that one
    }
  }

  componentDidMount() {
      this.load()
  }

  loadFromIpfs(id, whereTo) {
    if (id === undefined || id === null) return;
    fetch("https://gateway.pinata.cloud/ipfs/"+id)
    .then(response => response.json())
    .then((responseJson) => {
      var obj = {}
      obj[whereTo] = responseJson
      if (responseJson.lock && (window.unlockProtocol === undefined || window.unlockProtocol.getState() === "locked")) {
        this.setState({locked: true})
      }
      this.setState(obj)
    })
    .catch((error) => {
      console.error(error);
    });
  }

  loadFromAudius(id, whereTo) {
    fetch("https://discovery-c.mainnet.audius.radar.tech/v1/tracks/"+id+"?app_name=UPLD")
    .then(response => response.json())
    .then((responseJson) => {
      var obj = {}
      obj[whereTo] = responseJson
      this.setState(obj)
    })
    .catch((error) => {
      console.error(error);
    });
  }

  getDataFromFirebase(id, whereTo) {
    let ref = Firebase.database().ref('/'+id);
    ref.on('value', snapshot => {
      var obj = []
      obj[whereTo] = snapshot.val()
      this.setState(obj)
    });
  }

  async loadBlockchainData() {
    const web3 = new Web3(INFURA_ENDPOINT)
    const registry = new web3.eth.Contract(UPLD_REGISTRY_ABI, UPLD_REGISTRY_ADDRESS)
    const validate = await registry.methods.verifyVideo(this.id).call()
    this.setState({validate})
  }

  changeLockState(x) {
    this.setState({locked: x})
  }

  load() {
    this.loadBlockchainData()
    if (this.state.validate === -1) {
      this.intervalID = setTimeout(this.load.bind(this), 500)
      return
    }
    if (!this.state.validate) return;
    this.loadFromIpfs(this.id, "video")
    if (!this.state.video) {
      this.intervalID = setTimeout(this.load.bind(this), 500)
      return
    }
    this.videoTracking(this.updateViews.bind(this))
    this.getDataFromFirebase(this.id, "indexData")
    if (this.state.locked) {
      this.setupUnlock(this.changeLockState.bind(this))
    }
    if (this.state.video.bkgMusic !== undefined) {
      this.loadFromAudius(this.state.video.bkgMusic, "bkgMusic")
    }
    this.loadFromIpfs(this.state.video.channel, "channel")
    if (!this.state.channel) {
      this.intervalID = setTimeout(this.load.bind(this), 500)
      return
    }
  }

  setupUnlock(cllb) {
    if (window.unlockProtocolConfig === undefined) {
      window.addEventListener('unlockProtocol.status', function(e) {
        var state = e.detail
        if (state.state === "unlocked") {
          cllb(false)
        }
      })
      const script = document.createElement("script");
      document.head.appendChild(script);
      script.src = "https://paywall.unlock-protocol.com/static/unlock.latest.min.js";
      script.async = true;
      window.unlockProtocolConfig = {
          "network": "4", // Network ID (1 is for mainnet, 4 for rinkeby, 100 for xDai, etc)
          "locks": {
            "0x61e9210b61C254b28cc7Aea472E496339D2D3265": {
              "name": "Unlock Members"
            }
          },
          "icon": "https://unlock-protocol.com/static/images/svg/unlock-word-mark.svg",
          "callToAction": {
            "default": "Please unlock this demo!"
          }
      }/*
      setTimeout(function(){
        console.log("Loading status")
        console.log(window.unlockProtocol.getState())
        if(window.unlockProtocol.getState() === "unlocked") {
          cllb(false)
        }
      }, 1000)*/

    }
  }

  updateViews() {
    if (this.state.countedView) return;
    this.setState({countedView: true})
    Firebase.database().ref('/'+this.id+"/views/"+uuidv4()).set(1);
  }

  videoTracking(cllb) {
    if (document.getElementById("my-video") === null || document.getElementById("my-video") === undefined) {
      return
    }
    document.getElementById("my-video").addEventListener('play',  evt => {
       cllb()
    });
  }

  triggerUnlockPopup() {
    window.unlockProtocol && window.unlockProtocol.loadCheckoutModal()
  }

  render() {
    return(
      <div className="container-fluid no-padding">
        {this.state.locked &&
          <div className="lockOverlay container-fluid no-padding">
            <div className="row">
              <div className="col-sm-12 text-light text-center" style={{maxWidth: "100%", margin: "200px auto"}}>
                <h2>This content is for members only!</h2>
                <Button variant="warning" className="mt-5" type="button" onClick={this.triggerUnlockPopup}>JOIN HERE</Button>
              </div>
            </div>
          </div>
        }
        <div className="container-fluid">
          {this.state.validate === true &&
            <div>
              <div className="row">
                {this.state.video !== false &&
                  <div className="col-sm-12 text-center video-overlay">
                    <div style={{maxWidth: "960px", margin: "0px auto"}}>
                      {!this.state.locked &&
                        <video
                          id="my-video"
                          className="video-js vjs-theme-forest"
                          controls
                          preload="auto"
                          aspectratio="16:9"
                          width="100%"
                          poster={"https://gateway.pinata.cloud/ipfs/"+this.state.video.poster_cid}
                          data-setup="{}">
                          <source src={"https://gateway.pinata.cloud/ipfs/"+this.state.video.cid} type="video/mp4" />
                          <p className="vjs-no-js">
                            To view this video please enable JavaScript, and consider upgrading to a
                            web browser that
                            <a href="https://videojs.com/html5-video-support/" target="_blank"
                              >supports HTML5 video</a
                            >
                          </p>
                        </video>
                      }
                      {this.state.locked &&
                        <img src={"https://gateway.pinata.cloud/ipfs/"+this.state.video.poster_cid} className="lockedPreview" />
                      }
                    </div>
                  </div>
                }
              </div>
              <div className="row mt-5" style={{maxWidth: "960px", margin: "0px auto"}}>
                {this.state.video !== false &&
                  <div className="col-sm-8">
                    <h2>{this.state.locked ? rot13(this.state.video.title): this.state.video.title}</h2>
                    {this.state.indexData && this.state.indexData.views !== undefined && this.state.indexData.likes !== undefined &&
                      <div>
                        <p>{Object.keys(this.state.indexData.views).length} views, {Object.keys(this.state.indexData.likes).length} likes</p>
                      </div>
                    }
                    <div>
                      {this.state.locked ? rot13(this.state.video.summary): this.state.video.summary}
                    </div>
                  </div>
                }
                <div className="col-sm-4">
                  <div className="row">
                    <div className="col-sm-4">
                      <img src={"https://gateway.pinata.cloud/ipfs/"+this.state.channel.avatar} className="channel-avatar"/>
                    </div>
                    <div className="col-sm-8">
                      <h3>{this.state.channel.name}</h3>
                    </div>
                  </div>
                  <hr></hr>
                  {this.state.bkgMusic &&
                    <div>
                      <h5 className="mb-4">Background Music</h5>
                      <a href={"https://audius.co"+this.state.bkgMusic.data.permalink} target="blank" className="bkgMusic-link row">
                        <div className="col-sm-4 text-center">
                          <img src={this.state.bkgMusic.data.artwork["150x150"]} className="bkgMusic-avatar" />
                        </div>
                        <div className="col-sm-8">
                          <p className="lead mb-0">{this.state.bkgMusic.data.title}</p>
                          <span>By {this.state.bkgMusic.data.user.name}</span>
                        </div>
                      </a>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
          {this.state.validate === false &&
            <h2>Not valid!</h2>
          }
          {this.state.validate === -1 &&
            <h2>Loading</h2>
          }
        </div>
      </div>
    )
  }
}

export default Video
