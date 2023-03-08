import * as core from '@actions/core'
import {Inputs, publish} from './publish'

function getInputs(): Inputs {
  return {
    clientId: core.getInput('client_id'),
    clientSecret: core.getInput('client_secret'),
    nickname: core.getInput('nickname'),
    appBundleAlias: core.getInput('alias'),
    engine: core.getInput('engine'),
    description: core.getInput('description'),
    appBundlePath: core.getInput('bundle_path')
  }
}

async function run(): Promise<void> {
  try {
    core.info('Publishing app bundle...')
    const inputs = getInputs()
    await publish(inputs)
    core.info('App bundle published successfully')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
