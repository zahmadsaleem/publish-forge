import * as glob from '@actions/glob'
import FormData from 'form-data'
import axios from 'axios'
import fs from 'fs'
import qs from 'qs'

export interface Inputs {
  clientId: string
  clientSecret: string
  nickname: string
  appBundleId: string
  appBundleAlias: string
  appBundleEngine: string
  appBundlePath: string
  activities: string
}

async function getAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const data = qs.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope:
      'code:all data:write data:read bucket:create bucket:delete bucket:update'
  })
  const config = {
    method: 'post',
    url: 'https://developer.api.autodesk.com/authentication/v1/authenticate',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data
  }

  const result = await axios(config)

  return result.data.access_token
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
  const data = JSON.stringify({
    engine: inputs.appBundleEngine,
    description: 'AnkerForge'
  })

  const config = {
    method: 'post',
    url: `https://developer.api.autodesk.com/da/us-east/v3/appbundles/${inputs.appBundleId}/versions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data
  }

  const result = await axios(config)
  return result.data
}

async function uploadAppBundle(
  zipFilePath: string,
  formData: Record<string, string>,
  uploadUrl: string
): Promise<void> {
  const data = new FormData()
  data.append('key', formData.key)
  data.append('content-type', 'application/octet-stream')
  data.append('policy', formData.policy)
  data.append('success_action_status', '200')
  data.append('success_action_redirect', '')
  data.append('x-amz-signature', formData['x-amz-signature'])
  data.append('x-amz-credential', formData['x-amz-credential'])
  data.append('x-amz-algorithm', formData['x-amz-algorithm'])
  data.append('x-amz-date', formData['x-amz-date'])
  data.append('x-amz-server-side-encryption', 'AES256')
  data.append('x-amz-security-token', formData['x-amz-security-token'])
  data.append('file', fs.createReadStream(zipFilePath))

  const config = {
    method: 'post',
    url: uploadUrl,
    headers: {
      ...data.getHeaders()
    },
    data
  }

  await axios(config)

  return
}

async function assignAppBundleAlias(
  accessToken: string,
  versionNumber: Number,
  inputs: Inputs
): Promise<void> {
  const data = {
    version: versionNumber,
    id: inputs.appBundleId
  }

  const config = {
    method: 'patch',
    url: `https://developer.api.autodesk.com/da/us-east/v3/${inputs.nickname}/appbundles/${inputs.appBundleId}/aliases/${inputs.appBundleAlias}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data
  }
  axios(config)
}
async function updateActivities(
  accessToken: string,
  inputs: Inputs
): Promise<void> {
  const globber = await glob.create(inputs.activities)
  const files = await globber.glob()

  for (const file_path of files) {
    const activity = fs.readFileSync(file_path, 'utf8')
    const data = JSON.parse(activity)

    const config = {
      method: 'post',
      url: `https://developer.api.autodesk.com/da/us-east/v3/activities/${data.id}/versions`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data
    }
    await axios(config)
  }
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
  await updateActivities(accessToken, inputs)
}
