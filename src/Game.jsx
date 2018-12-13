import React from "react";
import axios from "axios";
import websocket from "./websocket";

class Game extends React.Component {
  state = { channel: null, players: [], me: null };
  ws = websocket(this.props.username);
  // TODO: make this require a more conforming GUID
  gameName = location.pathname.split("/")[1];

  peerConnection = new RTCPeerConnection();

  createOffer = () => {
    return this.peerConnection.createOffer()
  };

  sendOffer = (body) => {
    axios.post(`/.netlify/functions/sendOffer?channel=${this.state.channel.name}`, body)
  };

  sendAnswer = (body) => {
    axios.post(`/.netlify/functions/sendAnswer?channel=${this.state.channel.name}`, body)
  };

  componentDidMount() {
    const sendChannel = this.peerConnection.createDataChannel("sendChannel");
    sendChannel.onopen = (e) => console.log("A ON OPEN", e);
    sendChannel.onclose = (e) => console.log("A ON CLOSE", e);
    sendChannel.onmessage = (e) => console.log("A, RECEIVED MESSAGE:", e.data);

    const channel = this.ws.subscribe(`presence-${this.gameName}-scrabble`);
    channel.bind("message", function(data) {
      alert(JSON.stringify(data));
    });
    channel.bind("pusher:subscription_succeeded", () => {
      const me = channel.members.me;
      let players = [];
      this.createOffer()
        .then((offer) => {
          channel.members.each(member => {
            players.push(member);

            if (me.id === member.id) return;

            const body = {
              offerMaker: me.id,
              offerRecipient: member.id,
              offer
            };

            this.peerConnection.setLocalDescription(offer);
            this.sendOffer(JSON.stringify(body));
          });

          this.setState({ me, players });
      });
    });
    channel.bind("rtcOffer", (data) => {
      console.log(`offer: ${JSON.stringify(data, null, 2)}`);
      if (data.offerRecipient === this.state.me.id) {
        console.log(`${this.state.me.id} received offer for ${data.offerRecipient}`);
        this.peerConnection.setRemoteDescription(data.offer)
          .then(() => this.peerConnection.createAnswer())
          .then((answer) => {
            this.sendAnswer({
              answerMaker: this.state.me.id,
              answerRecipient: data.offerMaker,
              answer
            });
            this.peerConnection.setLocalDescription(answer)
          })
      }
    });
    channel.bind('rtcAnswer', (data) => {
      console.log(`answer: ${JSON.stringify(data, null, 2)}`)
      if (data.answerRecipient === this.state.me.id) {
        console.log(`${this.state.me.id} received answer for ${data.answerRecipient}`);
        this.peerConnection.setRemoteDescription(data.answer)
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
        </div>
      </div>
    );
  }
}

export default Game;
