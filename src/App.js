import React from "react";
import io from "socket.io-client";
import "./App.css";

const constraints = { video: true, audio: true };
class App extends React.Component {
  state = {
    desc: "",
    candidate: "",
  };
  localref = React.createRef();
  remoteVideo = React.createRef();
  remoteDescription = React.createRef();

  socket = null;

  candidates = [];

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload,
    });
  };

  componentDidMount() {
    this.socket = io("https://skyvideocall.herokuapp.com/webrtcPeer", {
      path: "/webrtc",
    });

    this.socket.on("connection-success", (success) => {
      console.log(success);
    });

    this.socket.on("offerOrAnswer", (sdp) => {
      const stringify = JSON.stringify(sdp);
      this.setState({ desc: stringify });
      if (sdp.type === "offer") alert("call incoming");
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });
    this.socket.on("candidate", (candidate) => {
      console.log("adding candidates");
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    });
    var peerConnectionConfig = {
      iceServers: [
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.l.google.com:19302" },
      ],
    };

    this.pc = new RTCPeerConnection(peerConnectionConfig);
    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.sendToPeer("candidate", e.candidate);
    };

    this.pc.oniceconnectionstatechange = (e) => {};
    this.pc.onaddstream = (e) => {
      console.log("track", e.stream);
      this.remoteVideo.current.srcObject = e.stream;
    };

    const success = (stream) => {
      console.log("localStreamsuccess", stream);
      window.localStream = stream;
      this.localref.current.srcObject = stream;
      this.pc.addStream(stream);
    };
    const failure = (e) => {
      console.log("getUserMediaFailure", e);
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(success)
      .catch(failure);
  }

  createOffer = () => {
    console.log("offer");
    this.pc.createOffer({ offerToReceiveVideo: true }).then(
      (sdp) => {
        this.pc.setLocalDescription(sdp);
        this.sendToPeer("offerOrAnswer", sdp);
      },
      (e) => console.log(e)
    );
  };

  setRemoteDescription = () => {
    const desc = JSON.parse(this.state.desc);
    console.log("desc", desc);
  };

  createAnswer = () => {
    console.log("answer");
    this.pc.createAnswer({ offerToReceiveVideo: true }).then(
      (sdp) => {
        this.setState({ desc: sdp });
        this.pc.setLocalDescription(sdp);
        this.sendToPeer("offerOrAnswer", sdp);
      },
      (e) => console.log(e)
    );
  };

  addCandidate = () => {
    console.log("onadd candidate", this.candidates);
    this.candidates.forEach((candidate) => {});
  };

  render() {
    console.log("c", this.candidates);
    return (
      <div className="App">
        <video
          className="streamVideo"
          ref={this.localref}
          autoPlay
          muted="muted"
        ></video>
        <video className="streamVideo" ref={this.remoteVideo} autoPlay></video>
        <br />
        <button onClick={() => this.createOffer()}>create offer</button>
        <button onClick={() => this.createAnswer()}>anwer</button>

        <br />
        <textarea
          value={this.state.desc}
          placeholder="Description"
          onChange={(ev) => this.setState({ desc: ev.target.value })}
        />
      </div>
    );
  }
}

export default App;
