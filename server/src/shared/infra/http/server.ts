import { app } from "@shared/infra/http/app.ts";
const PORT = Deno.env.get("PORT");

app.listen(PORT, () => {
  console.log("Starting server at port:", PORT);
});

const worker = new Worker(
  new URL(
    "../../../cron/cron_worker.ts", import.meta.url
  ).href,
  {
    type: "module"
  }
);

worker.onmessage = (event) => {
  const { type } = event.data;
  if (type === "CLEANUP_SUCCESS") {
    console.log("Cleanup task succeeded.");
  } else if (type === "CLEANUP_FAILURE") {
    console.error("Cleanup task failed:", event.data.error);
  }
};

// Alternative once cron job for deno is unstable
// It is important to check up if it is a viable option for the
// expired refresh_token cleanup or not
const interval = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
setInterval(() => {
  worker.postMessage({ type: "RUN_CLEANUP" });
}, interval);
