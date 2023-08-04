import qs from 'qs'
import axios from 'axios'

export async function getAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const data = qs.stringify({
    grant_type: 'client_credentials',
    scope: 'code:all'
  })
  const config = {
    method: 'post',
    url: 'https://developer.api.autodesk.com/authentication/v2/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${clientId}:${clientSecret}`
      ).toString('base64')}`
    },
    data
  }

  const result = await axios(config)

  return result.data.access_token
}
