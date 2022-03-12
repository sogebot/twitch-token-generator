import { Router } from 'itty-router'

// Create a new router
const router = Router()

router.get("/", async ({query}) => {
  /*
  POST https://id.twitch.tv/oauth2/token
    ?client_id=<your client ID>
    &client_secret=<your client secret>
    &code=<authorization code received above>
    &grant_type=authorization_code
    &redirect_uri=<your registered redirect URI>
  */
  if (query.code) {
    try {
      const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${query.code}&grant_type=authorization_code&redirect_uri=${REDIRECT_URI}`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        return new Response(`Access token: ${data.access_token}\nRefresh token: ${data.refresh_token}\nClient ID: ${CLIENT_ID}`, {
          headers: { 'content-type': 'text/plain' },
        })
      }
    } catch (e) {
      return new Response("400, code incorrect!", { status: 400 })
      console.error(e)
    }
  }
  return new Response("404, not found!", { status: 404 })
})

router.get("/request-tokens", ({ query, url }) => {
  /*
  GET https://id.twitch.tv/oauth2/authorize
    ?client_id=<your client ID>
    &redirect_uri=<your registered redirect URI>
    &response_type=code
    &scope=<space-separated list of scopes>
  */
  if (query.scope) {
    return Response.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${query.scope}&force_verify=true`, 301)
  } else {
    return new Response("400, missing scope!", { status: 400 })
  }
})

router.post("/refresh/:token", async ({ params }) => {
  /*
    POST https://id.twitch.tv/oauth2/token
    ?grant_type=refresh_token
    &refresh_token=<your refresh token>
    &client_id=<your client ID>
    &client_secret=<your client secret>
  */
  const { token } = params;

  const bannedTokens = [
    'f9inswa7vscdwdck8g0m0405eegytd3u41a9yx4grw8mkixya1',
    '8ur3jam2cr5nvrrfjau6ycv39s1ob60bgyhben365w6g5x5jkp'
  ]

  if (bannedTokens.includes(token)) {
    return new Response(JSON.stringify({ message: 'Banned refresh token received' }), {
      headers: { 'content-type': 'application/json' }, status: 403
    })
  }

  if (token) {
    try {
      const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&refresh_token=${token.replace(/%20/gi, '')}&grant_type=refresh_token`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        return new Response(JSON.stringify({
          token: data.access_token,
          refresh: data.refresh_token,
          success: true
        }), {
          headers: { 'content-type': 'application/json' },
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  return new Response(JSON.stringify({ message: 'Invalid refresh token received' }), {
    headers: { 'content-type': 'application/json' }, status: 400
  })
})

router.all("*", () => new Response("404, not found!", { status: 404 }))

addEventListener('fetch', event => {
  event.respondWith(router.handle(event.request))
})

/*  // on /request?scope=...
  GET https://id.twitch.tv/oauth2/authorize
    ?client_id=<your client ID>
    &redirect_uri=<your registered redirect URI>
    &response_type=<type>
    &scope=<space-separated list of scopes></space-separated>

  console.log({CLIENT_ID, CLIENT_SECRET, request: JSON.stringify(request)})
  return new Response('Hello worker!', {
    headers: { 'content-type': 'text/plain' },
  })
  */
