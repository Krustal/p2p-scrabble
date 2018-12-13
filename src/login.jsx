import React from "react";

class Login extends React.Component {
  usernameInput = React.createRef();
  handleSubmit = e => {
    e.preventDefault();
    const username = this.usernameInput.current.value;
    this.props.onLogin(username);
  };
  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <h2>"Login"</h2>
        <input type="text" ref={this.usernameInput} />
        <button type="submit">login</button>
      </form>
    );
  }
}

export default Login;
