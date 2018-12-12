// TODO: The initial goal is just to connect 2 clients with a simple chat
const registrationForm = document.getElementById("registration");

function registerUser(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  console.log(username);
}
registrationForm.onsubmit = registerUser;
