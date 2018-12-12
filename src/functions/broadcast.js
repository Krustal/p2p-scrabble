import Pusher from "pusher";

var pusher = new Pusher({
  appId: "671249",
  key: "458da97f25ff32a9a7e0",
  secret: "a24498efa0b396a05b33",
  cluster: "us2",
  encrypted: true
});

/**
 * @param event {object} - similar to an AWS lambda event object
 * @param context {object} - information about the context the function was called in. e.g., user information
 * @param callback {function} - should return either an error or a response object
 */
exports.handler = function handler(event, context, callback) {
  pusher.trigger("my-channel", "my-event", {
    message: "hello world"
  });
  callback(null, {
    statusCode: 200,
    body: "true"
  });
};
