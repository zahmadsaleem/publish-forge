import * as glob from '@actions/glob'
import * as core from '@actions/core'
import fs from 'fs'
import axios from 'axios'
import {Inputs} from '../inputs'
import {designAutomationApiBaseUrl} from './config'

export async function updateActivities(
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
  const activityAlias: string | undefined = copiedActivity.alias
  // const activityAlias = data.alias
  // delete data.alias
  const createConfig = {
    method: 'post',
    url: `${designAutomationApiBaseUrl}/activities`,
    headers,
    data: JSON.stringify(copiedActivity)
  }
  delete copiedActivity.id
  delete copiedActivity.alias
  const config = {
    method: 'post',
    url: `${designAutomationApiBaseUrl}/activities/${activityName}/versions`,
    headers,
    data: JSON.stringify(copiedActivity)
  }
  let versionNumber = 1
  await findAndDeleteExistingActivityVersions(activityName, accessToken)
  try {
    core.info(`Updating activity ${activityName}...`)
    const activityUpdateResponse = await axios(config)
    versionNumber = activityUpdateResponse.data.version
    if (activityAlias === undefined) {
      return
    }
    await createOrUpdateActivityAlias(
      activityName,
      activityAlias,
      versionNumber,
      createIfNotExists,
      accessToken
    )
    return
  } catch (err) {
    // todo: check error
  }
  if (!createIfNotExists) {
    throw new Error(`Activity ${activityName} doesn't exist`)
  }

  core.info(`Activity does not exist, creating activity ${activityName}...`)
  await axios(createConfig)
  if (activityAlias === undefined) {
    return
  }
  await createOrUpdateActivityAlias(
    activityName,
    activityAlias,
    versionNumber,
    createIfNotExists,
    accessToken
  )
}

async function findAndDeleteExistingActivityVersions(
  activityName: string,
  accessToken: string
): Promise<void> {
  try {
    core.info(
      `Finding and deleting existing versions of activity: ${activityName}...`
    )
    const existingActivityVersions = await getExistingActivityVersions(
      activityName,
      accessToken
    )
    if (existingActivityVersions && existingActivityVersions.length > 1) {
      existingActivityVersions.pop()
      const deletePromises = existingActivityVersions.map(async version => {
        await deleteExistingActivityVersion(activityName, version, accessToken)
      })
      await Promise.all(deletePromises)
    }
  } catch (error) {
    /* empty */
  }
}

async function getExistingActivityVersions(
  activityName: string,
  accessToken: string
): Promise<number[]> {
  const headers = {
    Authorization: `Bearer ${accessToken}`
  }
  const config = {
    method: 'get',
    url: `${designAutomationApiBaseUrl}/activities/${activityName}/versions`,
    headers
  }
  const response = await axios(config)
  if (response.status !== 200) {
    core.info(`Failed to get existing versions of activity: ${activityName}...`)
    return []
  }
  return response.data.data
}

async function deleteExistingActivityVersion(
  activityName: string,
  version: number,
  accessToken: string
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`
  }
  const config = {
    method: 'delete',
    url: `${designAutomationApiBaseUrl}/activities/${activityName}/versions/${version}`,
    headers
  }
  const response = await axios(config)
  if (response.status !== 204) {
    core.info(
      `Failed to delete activity version: ${version} of activity: ${activityName}...`
    )
  }
  core.info(`Deleted version: ${version}...`)
}

async function createOrUpdateActivityAlias(
  activityName: string,
  activityAlias: string,
  version: number,
  createIfNotExists: boolean,
  accessToken: string
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
  const config = {
    method: 'patch',
    url: `${designAutomationApiBaseUrl}/activities/${activityName}/aliases/${activityAlias}`,
    headers,
    data: JSON.stringify({
      version
    })
  }
  const createConfig = {
    method: 'post',
    url: `${designAutomationApiBaseUrl}/activities/${activityName}/aliases`,
    headers,
    data: JSON.stringify({
      version: 1,
      id: activityAlias
    })
  }
  try {
    await axios(config)
    return
  } catch (err) {
    //
  }

  if (!createIfNotExists) {
    throw new Error(`Activity alias ${activityAlias} doesn't exist`)
  }

  core.info(
    `Activity alias does not exist, creating activity alias ${activityAlias}...`
  )
  await axios(createConfig)
}
