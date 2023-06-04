// dummy jest test
import {test, expect} from '@jest/globals'
import { publish } from "./publish";
// load env vars from .env file
import {config} from 'dotenv'
config()


const clientId = process.env.FORGE_CLIENT_ID
const clientSecret = process.env.FORGE_CLIENT_SECRET
test('dummy test', async () => {
  try {

  await publish({
    clientId,
    clientSecret,
    activities: "",
    appBundleEngine: "Autodesk.Revit+2023",
    appBundlePath: "./bin/App.bundle.zip",
    nickname: 'App',
    appBundleId: 'AppFeature',
    appBundleAlias: 'prod'

  })
  } catch (error) {
    console.log(error)
  }
  expect(true).toBeTruthy()
})
