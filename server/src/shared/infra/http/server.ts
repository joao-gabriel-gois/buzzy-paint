import { app } from './app.ts';
const PORT = Deno.env.get("PORT");

app.listen(PORT, () => {
  console.log("Starting server at port:", PORT);
})