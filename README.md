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
    - uses: actions/checkout@main
    - uses: "@zahmadsaleem/publish-forge@v1"
      with:
          client_id: ${{ secrets.FORGE_CLIENT_ID }}
          client_secret: ${{ secrets.FORGE_CLIENT_SECRET }}
          appbundle_name: "MyAppBundle"
          appbundle_alias: "dev"
          appbundle_path: "/path/to/appbundle.zip"
          activities: "/path/to/*.json"
          create: true
```

TOD0:
- [x] Allow creating if not exists
- [ ] Add support for activity aliases