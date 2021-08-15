import React, { useState, Component, useRef } from 'react'
import Web3 from 'web3'
import {UPLD_REGISTRY_ADDRESS, UPLD_REGISTRY_ABI, FIREBASE_CONFIG} from '../config'
import Button from 'react-bootstrap/Button'

import { create } from 'ipfs-http-client';
import Firebase from 'firebase'

const PINATA_API_KEY= "20b4bc997e30c80bbe90"
const PINATA_API_SECRET = "bdd2dfa426c115084e096a41f3f8658cb032687b3d07af10fba77ad5722e7f60"
const PINATA_API_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4MTQwNGQ3Zi05ZTc3LTQ4N2UtOWFkYS1kOTUyZDMzNDkyODIiLCJlbWFpbCI6InNlcmdpby55YW5lekBhbHVtbm9zLnVzbS5jbCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2V9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIyMGI0YmM5OTdlMzBjODBiYmU5MCIsInNjb3BlZEtleVNlY3JldCI6ImJkZDJkZmE0MjZjMTE1MDg0ZTA5NmE0MWYzZjg2NThjYjAzMjY4N2IzZDA3YWYxMGZiYTc3YWQ1NzIyZTdmNjAiLCJpYXQiOjE2MjQ3NTA3OTV9.Vv93zcV-Fw7ApC7Qh9eHLrWFCYfIlxO1l4f7Huu6MWk"
const pinataSDK = require('@pinata/sdk');
const pinata = pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);


class NewVideo extends Component {
  intervalID
  fs
  ipfs

  constructor(props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this.addToRegistry = this.addToRegistry.bind(this)
    this.videoFileInput = React.createRef();
    this.thumbFileInput = React.createRef();
    this.titleInput = React.createRef();
    this.summaryInput = React.createRef();
    this.lockInput = React.createRef();
    this.bkgMusicInput = React.createRef();
    this.ipfs = create('https://ipfs.infura.io:5001/api/v0')
    this.state = {channelLoading: true, videoUpload: false, addedToRegistry: false, indexed: 0}
    if (!Firebase.apps.length) {
       Firebase.initializeApp(FIREBASE_CONFIG)
    }else {
       Firebase.app(); // if already initialized, use that one
    }
  }

  componentDidMount() {
    this.loadBlockchainData()
  }

  loadFromIpfs(id, whereTo) {
    if (id === undefined || id === null) return;
    fetch("https://ipfs.io/ipfs/"+id)
    .then(response => response.json())
    .then((responseJson) => {
      var obj = {}
      obj[whereTo] = responseJson
      this.setState(obj)
      this.setState({channelLoading: false})
    })
    .catch((error) => {
      console.error(error);
    });
  }

  async loadBlockchainData() {
    if (window.ethereum != null) {
      window.ethereum.on('accountsChanged', function (accounts) {
        window.location.reload()
      })
      window.ethereum.on('networkChanged', function (accounts) {
        window.location.reload()
      })
      const web3 = new Web3(Web3.givenProvider || "http://localhost:7545")
      this.setState({ web3 })
      const accounts = await web3.eth.getAccounts()
      this.setState({ account: accounts[0] })
      const registry = new web3.eth.Contract(UPLD_REGISTRY_ABI, UPLD_REGISTRY_ADDRESS)
      const channel = await registry.methods.channelOwnership(this.state.account).call()
      this.setState({registry, channelCid: channel})
      this.loadFromIpfs(channel, "channelData")
    } else {
      this.setState({ web3: "NO WEB3" })
    }
  }

  async submitJsonToIPFS(contents, whereTo) {
    const pinataSDK = require('@pinata/sdk');
    const pinata = pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);
    pinata.pinJSONToIPFS(contents).then((result) => {
        var obj = {}
        obj[whereTo] = result.IpfsHash
        this.setState(obj)
        this.setState({uploading: false})
    }).catch((err) => {
        console.log(err);
    });
  }

  async addToFirebase() {
    Firebase.database().ref('/'+this.state.videoUpload).set({
      "likes" : {},
      "summary" : this.state.jsonData.summary,
      "title" : this.state.jsonData.title,
      "views" : {}
    });
  }


  async handleSubmit(event) {
    event.preventDefault();
    const videoFile = this.videoFileInput.current.files[0]
    var videoCid = ""
    try {
      videoCid = await this.ipfs.add(videoFile)
    } catch (error) {
      alert('Error uploading video: '+ error)
      return
    }
    const thumbFile = this.thumbFileInput.current.files[0]
    var thumbCid = ""
    try {
      thumbCid = await this.ipfs.add(thumbFile)
    } catch (error) {
      alert('Error uploading thumbnail: '+ error)
      return
    }
    var jsonData = {
      "title": this.titleInput.current.value,
      "cid": videoCid.path,
      "poster_cid": thumbCid.path,
      "channel": this.state.channelCid,
      "summary": this.summaryInput.current.value,
    }
    if (this.lockInput.current.value !== "") {
      jsonData.lock = this.lockInput.current.value
    }
    if (this.bkgMusicInput.current.value !== "") {
      jsonData.bkgMusic = this.bkgMusicInput.current.value
    }
    this.setState({jsonData})
    this.submitJsonToIPFS(jsonData, "videoUpload")
  }

  addToRegistry() {
    this.state.registry.methods.uploadVideo(this.state.videoUpload, this.state.channelCid).send({ from: this.state.account })
		.once('receipt', (receipt) => {
			this.setState({ addedToRegistry: true })
      this.addToFirebase()
		})
  }

  render() {
    return(
      <div className="row">
        <div className="col-sm-12" style={{maxWidth: "960px", margin: "0px auto"}}>
          <h2 className="text-center">Upld a video!</h2>
          {!this.state.channelLoading && !this.state.videoUpload &&
            <div>
              <div>Uploading to {this.state.channelData.name}</div>
              <form onSubmit={this.handleSubmit}>
                <div className="form-group mt-2 mb-1">
                  <label htmlFor="videofile">Video file</label>
                  <input className="form-control" type="file" id="videofile" ref={this.videoFileInput} />
                </div>
                <div className="form-group mt-2 mb-1">
                  <label htmlFor="thumbFile">Thumbnail</label>
                  <input className="form-control" type="file" id="thumbFile" ref={this.thumbFileInput} />
                </div>
                <div className="form-group mt-2 mb-1">
                  <label htmlFor="videoTitle">Video title</label>
                  <input className="form-control" type="text" id="videoTitle"  ref={this.titleInput} />
                </div>
                <div className="form-group mt-2 mb-1">
                  <label htmlFor="videoSummary">Video Summary</label>
                  <textarea className="form-control" id="videoSummary"  ref={this.summaryInput} />
                </div>
                <div className="form-group mt-2 mb-1">
                  <label htmlFor="videoSummary">Lock Address (Optional)</label>
                  <input className="form-control" type="text" id="lock"  ref={this.lockInput} />
                </div>
                <div className="form-group mt-2 mb-1">
                  <label htmlFor="videoSummary">Background Music Id (from Audius)</label>
                  <input className="form-control" type="text" id="bkgMusic"  ref={this.bkgMusicInput} />
                </div>
                <Button variant="success" type="submit">Submit</Button>
              </form>
            </div>
          }
          {this.state.channelLoading &&
            <div>Loading channel</div>
          }
          {this.state.uploading &&
            <div>Uploading video</div>
          }
          {this.state.videoUpload &&
            <div>
              {!this.state.addedToRegistry &&
                <div>
                  <h2 className="text-center">Add video to the registry</h2>
                  <p>Almost there! Your video has been uploaded, but for it to be viewable in Upld you need to add it to our registry in the blockchain.</p>
                  <Button variant="success" type="button" onClick={this.addToRegistry}>Add to the registry</Button>
                </div>
              }
              {this.state.addedToRegistry &&
                <div>
                  <h2 className="text-center">Add video to the registry</h2>
                  <p>Congratulations, your video is now viewable at this url! <a href ={window.location.host + "/#/v/"+this.state.videoUpload}>{window.location.host + "/#/v/"+this.state.videoUpload}</a></p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    )
  }

}

export default NewVideo
