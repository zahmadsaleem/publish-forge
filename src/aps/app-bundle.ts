import axios from 'axios'
import * as core from '@actions/core'
import FormData from 'form-data'
import fs from 'fs'

import {Inputs} from '../inputs'
import {designAutomationApiBaseUrl} from './config'

interface AppBundleUpdateResponse {
  version: number
  uploadParameters: {
    endpointURL: string
    formData: never
  }
}

export async function updateAppBundle(
  inputs: Inputs,
  accessToken: string
): Promise<AppBundleUpdateResponse> {
  const config = {
    method: 'post',
    url: `${designAutomationApiBaseUrl}/appbundles/${inputs.appBundleId}/versions`,
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
    url: `${designAutomationApiBaseUrl}/appbundles`,
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

export async function uploadAppBundle(
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

export async function assignAppBundleAlias(
  accessToken: string,
  versionNumber: Number,
  inputs: Inputs
): Promise<void> {
  const config = {
    method: 'patch',
    url: `${designAutomationApiBaseUrl}/appbundles/${inputs.appBundleId}/aliases/${inputs.appBundleAlias}`,
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
    url: `${designAutomationApiBaseUrl}/appbundles/${inputs.appBundleId}/aliases`,
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