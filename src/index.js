import Pusher from "pusher-js";
// TODO: The initial goal is just to connect 2 clients with a simple chat

Pusher.logToConsole = process.env.NODE_ENV !== "production";

const pusher = new Pusher(process.env.PUSHER_KEY, {
  cluster: "us2",
  forceTLS: true
});
const wsChannel = pusher.subscribe("scrabble-registration");
wsChannel.bind("my-event", function(data) {
  alert(JSON.stringify(data));
});

const config = {
  username: null,
  connection: null,
  channel: null
};

function handleChannelStatusChange() {
  console.log("handling channel status change");
}
function receiveChannelCallback() {
  console.log("received channel callback");
}
function handleReceiveMessage() {
  console.log("handle receive message");
}
function handleICECandidate(e) {
  console.log("handle ice candidate", !!e.candidate);
  if (e.candidate) {
    // TODO: pass candidate to remote?
    console.log(e.candidate);
  }
}
function handleCreateDescriptionError(error) {
  console.log("Unable to create an offer: " + error.toString());
}

function registerUser(event) {
  event.preventDefault();
  // TODO: Use this username, I imagine we'll want it eventually
  // to route messages to the correct client.
  config.username = document.getElementById("username").value;

  config.connection
    .createOffer()
    .then(offer => {
      config.connection.setLocalDescription(offer);
      document.getElementById("local-description").innerText = JSON.stringify(
        config.connection.localDescription
      );
    })
    .catch(handleCreateDescriptionError);
}

function setRemoteDescription(event) {
  event.preventDefault();
  config.remoteDescription = JSON.parse(
    document.getElementById("remote-description").value
  );
  config.connection
    .setRemoteDescription(config.remoteDescription)
    .then(() => config.connection.createAnswer())
    .then(answer => console.log("answer", answer));
}

function setup() {
  const connection = new RTCPeerConnection();
  config.connection = connection;
  const channel = connection.createDataChannel("gameChannel");
  config.channel = channel;
  channel.onopen = handleChannelStatusChange;
  channel.onclose = handleChannelStatusChange;
  channel.ondatachannel = receiveChannelCallback;
  channel.onmessage = handleReceiveMessage;
  connection.onicecandidate = handleICECandidate;

  const registrationForm = document.getElementById("registration");
  registrationForm.onsubmit = registerUser;
  const remoteDescForm = document.getElementById("remote-description-form");
  remoteDescForm.onsubmit = setRemoteDescription;
}
window.addEventListener("load", setup, false);
