import * as glob from '@actions/glob'
import FormData from 'form-data'
import axios from 'axios'
import fs from 'fs'
import qs from 'qs'
import * as core from '@actions/core'

export interface Inputs {
  clientId: string
  clientSecret: string
  appBundleId: string
  appBundleAlias: string
  appBundleEngine: string
  appBundlePath: string
  activities: string
  create: boolean
  description?: string
}

async function getAccessToken(
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
  const config = {
    method: 'post',
    url: `https://developer.api.autodesk.com/da/us-east/v3/appbundles/${inputs.appBundleId}/versions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify({
      engine: inputs.appBundleEngine,
      description: inputs.description || ''
    })
  }

  const createConfig = {
    method: 'post',
    url: `https://developer.api.autodesk.com/da/us-east/v3/appbundles`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify({
      id: inputs.appBundleId,
      engine: inputs.appBundleEngine,
      description: inputs.description || ''
    })
  }

  try {
    const result = await axios(config)
    return result.data
  } catch (error) {
    // todo: check error
  }

  if (!inputs.create) {
    throw new Error(`AppBundle ${inputs.appBundleId} doesn't exist`)
  }

  core.info(`AppBundle ${inputs.appBundleId} does not exist, creating...`)
  const result = await axios(createConfig)
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
  const config = {
    method: 'patch',
    url: `https://developer.api.autodesk.com/da/us-east/v3/appbundles/${inputs.appBundleId}/aliases/${inputs.appBundleAlias}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      version: versionNumber
    })
  }

  const createConfig = {
    method: 'post',
    url: `https://developer.api.autodesk.com/da/us-east/v3/appbundles/${inputs.appBundleId}/aliases`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      version: versionNumber,
      id: inputs.appBundleAlias
    })
  }

  try {
    await axios(config)
    return
  } catch (error) {
    // todo: check error
  }

  if (!inputs.create) {
    throw new Error(`AppBundle alias ${inputs.appBundleAlias} doesn't exist`)
  }

  core.info(
    `AppBundle alias ${inputs.appBundleAlias} does not exist, creating...`
  )
  await axios(createConfig)
}

async function updateActivities(
  accessToken: string,
  inputs: Inputs
): Promise<void> {
  const globber = await glob.create(inputs.activities)
  const files = await globber.glob()
  core.debug(
    `Found ${files.length} activities, file paths: ${JSON.stringify(files)}`
  )
  await Promise.all(
    files.map(async file_path => {
      const data = fs.readFileSync(file_path, 'utf8')
      core.debug(`Reading activity data from ${file_path}`)
      core.debug(`Activity data: ${data}`)
      const activity = JSON.parse(data)
      await updateActivity(activity, inputs.create, accessToken)
    })
  )
}

async function updateActivity(
  activity: Record<string, never>,
  createIfNotExists: boolean,
  accessToken: string
): Promise<void> {
  const copiedActivity = {...activity}
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
  const activityName = copiedActivity.id as unknown as string
  // const activityAlias = data.alias
  // delete data.alias
  const createConfig = {
    method: 'post',
    url: `https://developer.api.autodesk.com/da/us-east/v3/activities`,
    headers,
    data: JSON.stringify(copiedActivity)
  }
  delete copiedActivity.id
  const config = {
    method: 'post',
    url: `https://developer.api.autodesk.com/da/us-east/v3/activities/${activityName}/versions`,
    headers,
    data: JSON.stringify(copiedActivity)
  }
  try {
    core.info(`Updating activity ${activityName}...`)
    await axios(config)
    return
  } catch (err) {
    // todo: check error
  }
  if (!createIfNotExists) {
    throw new Error(`Activity ${activityName} doesn't exist`)
  }

  core.info(`Activity does not exist, creating activity ${activityName}...`)
  await axios(createConfig)
}

export async function publish(inputs: Inputs): Promise<void> {
  core.info('Getting access token...')
  const accessToken = await getAccessToken(inputs.clientId, inputs.clientSecret)
  core.info('Got access token')
  core.info('Updating AppBundle...')
  const result = await updateAppBundle(inputs, accessToken)
  core.info(`Updated AppBundle ${inputs.appBundleId}`)
  core.info('Uploading AppBundle zip...')
  await uploadAppBundle(
    inputs.appBundlePath,
    result.uploadParameters.formData,
    result.uploadParameters.endpointURL
  )
  core.info('Uploaded AppBundle zip')
  core.info(`Assigning AppBundle alias - ${inputs.appBundleAlias}...`)
  await assignAppBundleAlias(accessToken, result.version, inputs)
  core.info('Assigned AppBundle alias')
  core.info('Updating activities...')
  await updateActivities(accessToken, inputs)
  core.info('Updated activities')
}
