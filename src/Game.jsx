import React from "react";
import websocket from "./websocket";

class Game extends React.Component {
  state = { channel: null, players: [], me: null };
  ws = websocket(this.props.username);
  // TODO: make this require a more conforming GUID
  gameName = location.pathname.split("/")[1];
  componentDidMount() {
    const channel = this.ws.subscribe(`presence-${this.gameName}-scrabble`);
    channel.bind("message", function(data) {
      alert(JSON.stringify(data));
    });
    channel.bind("pusher:subscription_succeeded", () => {
      const me = channel.members.me;
      let players = [];
      channel.members.each(member => players.push(member));
      this.setState({ me, players });
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
