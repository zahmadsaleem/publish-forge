import * as core from '@actions/core'
import {publish} from './publish'
import {AxiosError} from 'axios'
import {getInputs} from './inputs'

async function run(): Promise<void> {
  try {
    const inputs = getInputs()
    await publish(inputs)
  } catch (error) {
    if (error instanceof AxiosError) {
      core.setFailed(error.response?.data)
      if (error.stack) core.debug(error.stack)
      return
    }
    if (error instanceof Error) {
      core.setFailed(error.message)
      if (error.stack) core.debug(error.stack)
      return
    }
    core.setFailed('Unknown error')
  }
}

run()
