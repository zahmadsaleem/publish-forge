# Publish Forge

GitHub Action to Publish an Autodesk Design Automation API AppBundle to Autodesk Platform Services(APS)

This action combines multiple steps described in the [docs](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/basics/) to publish an AppBundle to Autodesk Platform Services(APS) into a single GitHub Action.

Example Usage:
```yaml
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: "@zahmadsaleem/publish-forge@main"
      with:
        client_id : ${{ secrets.FORGE_CLIENT_ID }}
        client_secret:  ${{ secrets.FORGE_CLIENT_SECRET }}
        activities: "./testdata/*.activity.json"
        appbundle_engine: "Autodesk.Revit+2023"
        appbundle_path: "./testdata/AppBundle.bundle.zip"
        appbundle_id: "TestAppBundle"
        appbundle_alias: "prod"
        create: true
```

## Reference
Most of the parameters are self-explanatory, and analogous to the APS documentation. 

### activities 
This is a glob pattern that will be used to find all the activity files. 
The action will create an activity for each file found. 
The activity name will be the name of the field `id` in the activity file.
During an update the `id` field is used to find the activity to update.


For example, if the glob pattern is `./testdata/*.activity.json` and the files are `./testdata/Activity1.activity.json` and `./testdata/Activity2.activity.json`, then the action will create two activities with ids coming from the field `id` in the activity files.

### create
If set to true, the action will create the appbundle and activities if they do not exist.

TOD0:
- [x] Allow creating appbundle, appbundle alias or activity if it doesn't exists
- [ ] Add support for creating and updating activity aliases