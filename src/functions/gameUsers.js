import Pusher from "pusher";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

var pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: "us2",
  encrypted: true
});

exports.handler = function handler(event, context, callback) {
  const game = event.path.split("/")[2];
  pusher.get({ path: `/channels/${game}-scrabble-registration/users` });
  callback(null, { statusCode: 200, body: JSON.stringify(game) });
};
