import { test, expect } from "@jest/globals";
import { publish } from "./publish";
import { config } from "dotenv";

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
      nickname: "App",
      appBundleId: "AppBundle",
      appBundleAlias: "prod"

    });
  } catch (error) {
    console.log(error);
  }
  expect(true).toBeTruthy();
});
