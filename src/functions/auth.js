import Pusher from "pusher";
import dotenv from "dotenv";

dotenv.config();

var pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "us2",
  encrypted: true
});

exports.handler = function(event, context, callback) {
  console.log("environment vars", process.env.NODE_ENV);
  const parsedBody = event.body
    .split("&")
    .map(kv => kv.split("="))
    .reduce((params, [key, value]) => {
      params[key] = value;
      return params;
    }, {});
  const { socket_id: socketId, channel_name: channel, username } = parsedBody;
  const presenceData = {
    user_id: username
  };
  console.log("auth params", socketId, channel, presenceData);
  const auth = pusher.authenticate(socketId, channel, presenceData);
  console.log("auth", auth);
  callback(null, {
    statusCode: 200,
    headers: { "Content-Type": "application/javascript" },
    body: JSON.stringify(auth)
  });
};
