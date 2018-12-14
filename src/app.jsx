import React, { Component } from "react";
import faker from "faker/locale/en";
import Login from "./login";
import Game from "./Game";

class App extends Component {
  state = {
    username: localStorage.getItem("username") || null,
    gameId: location.pathname.split("/")[1]
  };
  handleLogin = username => {
    this.setState({ username });
    localStorage.setItem("username", username);
  };
  componentDidMount() {
    if (!this.state.gameId) {
      const gameId = faker
        .fake(
          "{{hacker.verb}}-{{hacker.adjective}}-{{hacker.adjective}}-{{hacker.noun}}"
        )
        .replace(/\s/, "");
      history.pushState({ gameId }, gameId, `/${gameId}`);
      this.setState({ gameId });
    }
  }
  render() {
    return this.state.username ? (
      this.state.gameId ? (
        <Game username={this.state.username} />
      ) : null
    ) : (
      <Login onLogin={this.handleLogin} />
    );
  }
}

export default App;
