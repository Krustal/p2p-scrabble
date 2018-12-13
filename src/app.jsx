import React, { Component } from "react";
import axios from "axios";
import Login from "./login";
import Game from "./Game";

class App extends Component {
  state = { username: localStorage.getItem("username") || null };
  handleLogin = username => {
    this.setState({ username });
    localStorage.setItem("username", username);
  };
  render() {
    return this.state.username ? (
      <Game username={this.state.username} />
    ) : (
      <Login onLogin={this.handleLogin} />
    );
  }
}

export default App;
