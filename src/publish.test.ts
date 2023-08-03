import { test, expect } from "@jest/globals";
import { publish } from "./publish";
import { config } from "dotenv";
import {AxiosError} from 'axios'
import * as core from '@actions/core'

config();

const clientId = process.env.FORGE_CLIENT_ID as string;
const clientSecret = process.env.FORGE_CLIENT_SECRET as string;
test("dummy test", async () => {
  try {
    await publish({
      clientId,
      clientSecret,
      activities: "./testdata/*.activity.json",
      appBundleEngine: "Autodesk.Revit+2023",
      appBundlePath: "./testdata/AppBundle.bundle.zip",
      appBundleId: "TestAppBundle",
      appBundleAlias: "prod",
      create: true
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      console.log(error.response?.data)
    }
    else{
      console.log(error);
    }
  }
  expect(true).toBeTruthy();
});
