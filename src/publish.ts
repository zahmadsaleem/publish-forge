import {HttpClient} from '@actions/http-client'

const client = new HttpClient()
export interface Inputs {
  clientId: string
  clientSecret: string
  nickname: string
  appBundleAlias: string
  engine: string
  description: string
  appBundlePath: string
}

async function getAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const args = {
    data: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'forge:read forge:write'
    },
    headers: {'Content-Type': 'application/json'}
  }

  const result = await client.post(
    'https://developer.api.autodesk.com/authentication/v1/authenticate',
    JSON.stringify(args)
  )

  const resultRaw = await result.readBody()
  const resultJson = JSON.parse(resultRaw)
  return resultJson.access_token
}

interface AppBundleUpdateResponse {
  version: number
  uploadParameters: {
    endpointURL: string
    formData: never
  }
}

async function updateAppBundle(
  inputs: Inputs,
  accessToken: string
): Promise<AppBundleUpdateResponse> {
  const url = `https://developer.api.autodesk.com/da/us-east/v3/appbundles/${inputs.nickname}/versions`

  const args = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data: {
      engine: inputs.engine,
      description: inputs.description
    }
  }
  const result = await client.post(url, JSON.stringify(args))
  const resultRaw = await result.readBody()
  return JSON.parse(resultRaw)
}

async function uploadAppBundle(
  zipFilePath: string,
  formData: any,
  uploadUrl: string
): Promise<void> {
  const data = formData
  data.file = zipFilePath

  const args = {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  }
  /* const result =*/ await client.post(uploadUrl, JSON.stringify(args))
  // const resultRaw = await result.readBody()
  // const resultJson = JSON.parse(resultRaw)

  return
}

async function assignAppBundleAlias(
  accessToken: string,
  versionNumber: Number,
  inputs: Inputs
): Promise<void> {
  const url = `https://developer.api.autodesk.com/da/us-east/v3/appbundles/${inputs.nickname}/aliases/${inputs.appBundleAlias}`
  const args = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data: {
      version: versionNumber,
      id: inputs.appBundleAlias
    }
  }

  /*const result =*/ await client.put(url, JSON.stringify(args))
  // const resultRaw = await result.readBody()
  // const resultJson = JSON.parse(resultRaw)
}

export async function publish(inputs: Inputs): Promise<void> {
  const accessToken = await getAccessToken(inputs.clientId, inputs.clientSecret)
  const result = await updateAppBundle(inputs, accessToken)
  await uploadAppBundle(
    inputs.appBundlePath,
    result.uploadParameters.formData,
    result.uploadParameters.endpointURL
  )
  await assignAppBundleAlias(accessToken, result.version, inputs)
}
