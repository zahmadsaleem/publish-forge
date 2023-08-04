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

export function getInputs(): Inputs {
  return {
    clientId: core.getInput('client_id'),
    clientSecret: core.getInput('client_secret'),
    appBundleAlias: core.getInput('appbundle_alias'),
    appBundleEngine: core.getInput('appbundle_engine'),
    appBundleId: core.getInput('appbundle_id'),
    appBundlePath: core.getInput('appbundle_path'),
    activities: core.getInput('activities'),
    create: core.getInput('create') === 'true'
  }
}
