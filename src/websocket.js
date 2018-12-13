import Pusher from "pusher-js";

Pusher.logToConsole = process.env.NODE_ENV !== "production";
export default username =>
  new Pusher(process.env.PUSHER_KEY, {
    cluster: "us2",
    forceTLS: true,
    authEndpoint: `${process.env.FN_BASE}/auth`,
    auth: {
      params: {
        username
      }
    }
  });
