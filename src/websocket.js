import Pusher from "pusher-js";

Pusher.logToConsole = false; // process.env.NODE_ENV !== "production";
export default username =>
  new Pusher(process.env.PUSHER_KEY, {
    cluster: "us2",
    forceTLS: true,
    authEndpoint: `/.netlify/functions/auth`,
    auth: {
      params: {
        username
      }
    }
  });
