export default {
  token_secret: Deno.env.get("JWT_TOKEN_SECRET"),
  token_expires_in: Deno.env.get("JWT_TOKEN_EXPIRE_DATE"),
  refresh_token_secret: Deno.env.get("JWT_REFRESH_TOKEN_SECRET"),
  refresh_token_expires_in: Deno.env.get("JWT_REFRESH_TOKEN_EXPIRE_DATE"),
}
