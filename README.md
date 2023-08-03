# Publish Forge

Action to Publish an Autodesk Design Automation API AppBundle

WIP

[Autodesk Docs](https://aps.autodesk.com/en/docs/design-automation/v3/developers_guide/basics/)

ClientId
- AppBundle
  - Aliases connected to AppBundle version(eg: dev --> 5, prod --> 3)
    - Activity (automatically versioned)

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

TOD0:
- [x] Allow creating if not exists
- [ ] Add support for activity aliases