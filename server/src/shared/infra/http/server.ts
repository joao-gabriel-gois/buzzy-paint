import { app } from "@shared/infra/http/app.ts";
const PORT = Deno.env.get("PORT");

app.listen(PORT, () => {
  console.log("Starting server at port:", PORT);
});
