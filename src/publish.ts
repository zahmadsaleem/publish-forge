import * as core from '@actions/core'
import {
  assignAppBundleAlias,
  updateAppBundle,
  uploadAppBundle
} from './aps/app-bundle'
import {updateActivities} from './aps/activity'
import {getAccessToken} from './aps/auth'
import {Inputs} from './inputs'

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
  core.info('AppBundle and Activities updated successfully')
}
