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

exports.handler = function(event, _context, callback) {
  pusher.trigger(event.queryStringParameters.channel, "iceCandidate", event.body);

  callback(null, {
    statusCode: 200,
    body: "true"
  });
};
