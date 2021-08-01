import React, { useState, Component } from 'react'

class Video extends Component {
  intervalID

  constructor(props) {
    super(props)
    this.id = props.id
    this.state = {video: false, channel: false}
  }

  componentDidMount() {
      this.load()
  }

  loadFromIpfs(id, whereTo) {
    fetch("https://gateway.pinata.cloud/ipfs/"+this.id)
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

  load() {
    this.loadFromIpfs(this.id, "video")
    if (!this.state.video) {
      this.intervalID = setTimeout(this.load.bind(this), 500)
      return
    }
    this.loadFromIpfs(this.state.video.channel, "channel")
    if (!this.state.channel) {
      this.intervalID = setTimeout(this.load.bind(this), 500)
      return
    }
  }

  render() {
    return(
      <div className="container-fluid">
        <div className="row">
          {this.state.video !== false &&
            <div className="col-sm-12 text-center video-overlay">
              <div style={{maxWidth: "960px", margin: "0px auto"}}>
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
              </div>
            </div>
          }
        </div>
        <div className="row mt-2">
          <div className="col-sm-8">Content</div>
          <div className="col-sm-4">Sidebar</div>
        </div>
      </div>
    )
  }
}

export default Video
