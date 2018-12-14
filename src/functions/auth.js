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
  const presenceUsers = pusher.get(
    { path: `/channels/${channel}/users` },
    (err, req, res) => {
      if (res.statusCode === 200) {
        const result = JSON.parse(res.body);
        console.log("current players", result.users);
        if (result.users.length < 2) {
          const presenceData = {
            user_id: username
          };

          const auth = pusher.authenticate(socketId, channel, presenceData);
          callback(null, {
            statusCode: 200,
            headers: { "Content-Type": "application/javascript" },
            body: JSON.stringify(auth)
          });
        } else {
          callback(null, {
            statusCode: 403,
            headers: { "Content-Type": "application/javascript" },
            body: JSON.stringify({ status: "already 2 users in game" })
          });
        }
      }
    }
  );
};
