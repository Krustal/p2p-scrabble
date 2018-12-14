import React from "react";
import axios from "axios";
import websocket from "./websocket";

class Game extends React.Component {
  state = { channel: null, players: [], me: null };
  ws = websocket(this.props.username);
  // TODO: make this require a more conforming GUID
  gameName = location.pathname.split("/")[1];

  peerConnection = new RTCPeerConnection();

  messageInput = React.createRef();

  createOffer = () => {
    return this.peerConnection.createOffer();
  };

  sendOffer = body => {
    axios.post(
      `/.netlify/functions/sendOffer?channel=${this.state.channel.name}`,
      body
    );
  };

  sendAnswer = body => {
    axios.post(
      `/.netlify/functions/sendAnswer?channel=${this.state.channel.name}`,
      body
    );
  };

  sendIceCandidate = body => {
    axios.post(
      `/.netlify/functions/sendIce?channel=${this.state.channel.name}`,
      body
    );
  };

  handleSubmit = e => {
    e.preventDefault();
    this.sendMessage(this.messageInput.current.value);
  };

  sendMessage = msg => {
    // console.log(this.sendChannel);
    this.sendChannel.send(msg);
  };

  componentDidMount() {
    this.peerConnection.ondatachannel = e => {
      console.log("ONDATACHANNEL FIRED");
      if (!this.sendChannel) {
        console.log("setting send channel", e);
        this.sendChannel = e.channel;
      }
      console.log("send channel", this.sendChannel);
      this.sendChannel.onopen = e => console.log("A ON OPEN", e);
      this.sendChannel.onclose = e => console.log("A ON CLOSE", e);
      this.sendChannel.onmessage = e =>
        console.log("A, RECEIVED MESSAGE:", e.data);
    };

    this.peerConnection.onicecandidate = event => {
      if (
        !event.candidate ||
        !this.peerConnection ||
        !this.peerConnection.remoteDescription ||
        !this.peerConnection.remoteDescription.type
      ) {
        return;
      }
      console.log("SENDING ICE");

      const candidate = {
        type: "candidate",
        candidate: event.candidate
      };

      channel.members.each(member => {
        this.sendIceCandidate({
          iceRecipient: member.id,
          iceMaker: channel.members.me.id,
          candidate: event.candidate
        });
      });
    };

    this.peerConnection.onnegotiationneeded = () => {
      console.log("NEGOTIATION NEEDED!");
      this.createOffer().then(offer => {
        channel.members.each(member => {
          const body = {
            offerMaker: channel.members.me.id,
            offerRecipient: member.id,
            offer
          };

          this.peerConnection.setLocalDescription(offer);
          this.sendOffer(JSON.stringify(body));
        });
      });
    };

    const channel = this.ws.subscribe(`presence-${this.gameName}-scrabble`);
    channel.bind("pusher:subscription_succeeded", () => {
      const me = channel.members.me;
      let players = [];
      if (channel.members.count > 1) {
        console.log("creating data channel");
        this.sendChannel = this.peerConnection.createDataChannel("sendChannel");
        this.sendChannel.onopen = e => console.log("A ON OPEN", e);
        this.sendChannel.onclose = e => console.log("A ON CLOSE", e);
        this.sendChannel.onmessage = e =>
          console.log("A, RECEIVED MESSAGE:", e.data);
      }
      channel.members.each(member => {
        players.push(member);
      });
      this.setState({ me, players });
    });
    channel.bind("iceCandidate", data => {
      if (data.iceRecipient === this.state.me.id) {
        console.log("APPLYING ICE", data);
        this.peerConnection.addIceCandidate(
          data.candidate,
          () => {},
          err => {
            console.error(err);
          }
        );
      }
    });
    channel.bind("rtcOffer", data => {
      // console.log(`offer: ${JSON.stringify(data, null, 2)}`);
      if (data.offerRecipient === this.state.me.id) {
        // console.log(`${this.state.me.id} received offer for ${data.offerRecipient}`);
        this.peerConnection
          .setRemoteDescription(data.offer)
          .then(() => this.peerConnection.createAnswer())
          .then(answer => {
            this.sendAnswer({
              answerMaker: this.state.me.id,
              answerRecipient: data.offerMaker,
              answer
            });
            this.peerConnection.setLocalDescription(answer);
          });
      }
    });
    channel.bind("rtcAnswer", data => {
      // console.log(`answer: ${JSON.stringify(data, null, 2)}`);
      if (data.answerRecipient === this.state.me.id) {
        // console.log(`${this.state.me.id} received answer for ${data.answerRecipient}`);
        this.peerConnection.setRemoteDescription(data.answer).then(() => {
          console.log("remote connection set");
          // console.log("sendChannel: ", this.sendChannel)
        });
      }
    });
    channel.bind("pusher:member_added", () => {
      let players = [];
      channel.members.each(member => players.push(member));
      this.setState({ players });
    });
    channel.bind("pusher:member_removed", () => {
      let players = [];
      channel.members.each(member => players.push(member));
      this.setState({ players });
    });
    this.setState({ channel });
  }
  render() {
    return (
      <div>
        <div>
          <h3>Players</h3>
          <ul>
            {this.state.players.map(player => (
              <li key={player.id}>{player.id}</li>
            ))}
          </ul>
          <form onSubmit={this.handleSubmit}>
            <input type="text" ref={this.messageInput} />
            <button type="submit" />
          </form>
        </div>
      </div>
    );
  }
}

export default Game;
