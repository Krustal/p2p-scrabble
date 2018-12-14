import React from "react";
import axios from "axios";
import websocket from "./websocket";

import "./game.scss";

class Game extends React.Component {
  state = {
    channel: null,
    players: [],
    me: null,
    mySymbol: null, // X or O
    currentTurn: "X", // start every game with X
    board: [[, , ,], [, , ,], [, , ,]]
  };
  ws = websocket(this.props.username);
  // TODO: make this require a more conforming GUID
  gameName = location.pathname.split("/")[1];

  peerConnection = new RTCPeerConnection();

  messageInput = React.createRef();
  boardRef = React.createRef();

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
    console.log("sending message", this.sendChannel, msg);
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
      this.sendChannel.onmessage = e => {
        console.log("got message", e.data);
        let instruction;
        try {
          instruction = JSON.parse(e.data);
        } catch (e) {
          console.error(e);
          return;
        }
        this.gotMove(instruction);
      };
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
        this.setState({ mySymbol: "O" }); // second player is always O
        console.log("creating data channel");
        // TODO: refactor this to support >2 players in a game
        this.sendChannel = this.peerConnection.createDataChannel("sendChannel");
        this.sendChannel.onopen = e => console.log("A ON OPEN", e);
        this.sendChannel.onclose = e => console.log("A ON CLOSE", e);
        this.sendChannel.onmessage = e => {
          console.log("got message", e.data);
          let instruction;
          try {
            instruction = JSON.parse(e.data);
          } catch (e) {
            console.error(e);
            return;
          }
          this.gotMove(instruction);
        };
      } else {
        this.setState({ mySymbol: "X" });
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
      this.sendChannel && this.sendChannel.close();
    });
    this.setState({ channel });
    window.onresize = this.resizeBoard;
    this.resizeBoard();
  }
  resizeBoard = () => {
    const board = this.boardRef.current;
    const cellHeight = board.children[0].offsetHeight;
    const fontSize = cellHeight * 0.86;
    this.setState({ symbolSize: fontSize });
    // debugger;
  };
  makeMove = pos => () => {
    console.log("placing", this.state.mySymbol, "at", pos);
    this.sendMessage(
      JSON.stringify({ type: "move", symbol: this.state.mySymbol, pos })
    );
    const currentBoard = this.state.board;
    const newBoard = [...currentBoard];
    newBoard[pos[0]][pos[1]] = this.state.mySymbol;
    this.setState({ board: newBoard });
  };
  gotMove = instruction => {
    const currentBoard = this.state.board;
    const newBoard = [...currentBoard];
    newBoard[instruction.pos[0]][instruction.pos[1]] = instruction.symbol;
    this.setState({ board: newBoard });
  };
  componentWillUnmount() {
    this.peerConnection.close();
  }
  render() {
    return (
      <div>
        <div>
          <div className="board" ref={this.boardRef}>
            <div className="cell" onClick={this.makeMove([0, 0])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {/* {this.state.board[0][0]} */}X
              </div>
            </div>
            <div className="cell" onClick={this.makeMove([1, 0])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {this.state.board[1][0]}
              </div>
            </div>
            <div className="cell" onClick={this.makeMove([2, 0])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {this.state.board[2][0]}
              </div>
            </div>
            <div className="cell" onClick={this.makeMove([0, 1])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {this.state.board[0][1]}
              </div>
            </div>
            <div className="cell" onClick={this.makeMove([1, 1])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {this.state.board[1][1]}
              </div>
            </div>
            <div className="cell" onClick={this.makeMove([2, 1])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {this.state.board[2][1]}
              </div>
            </div>
            <div className="cell" onClick={this.makeMove([0, 2])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {this.state.board[0][2]}
              </div>
            </div>
            <div className="cell" onClick={this.makeMove([1, 2])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {this.state.board[1][2]}
              </div>
            </div>
            <div className="cell" onClick={this.makeMove([2, 2])}>
              <div
                className="symbol"
                style={{ fontSize: this.state.symbolSize }}
              >
                {this.state.board[2][2]}
              </div>
            </div>
          </div>
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
