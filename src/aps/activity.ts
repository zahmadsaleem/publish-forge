import * as glob from '@actions/glob'
import * as core from '@actions/core'
import fs from 'fs'
import axios from 'axios'
import {Inputs} from '../inputs'

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
