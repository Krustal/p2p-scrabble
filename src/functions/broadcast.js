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

/**
 * @param event {object} - similar to an AWS lambda event object
 * @param context {object} - information about the context the function was called in. e.g., user information
 * @param callback {function} - should return either an error or a response object
 */
exports.handler = function handler(event, context, callback) {
  pusher.trigger("scrabble-registration", "my-event", {
    message: "hello world"
  });
  callback(null, {
    statusCode: 200,
    body: "true"
  });
};
