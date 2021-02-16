dxpack
============
# Usage
## Usage

Install as a plugin in the [Salesforce CLI](https://developer.salesforce.com/tools/sfdxcli). 
```sh-session
$ sfdx plugins:install @jtowers/dxpack
$ sfdx dxpack --help
```

<!-- usagestop -->
  # Commands
  <!-- commands -->
* [`sfdx dxpack:package:update:push -i <string> [-f <string>] [-s <datetime>] [-w <number>] [-v <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-dxpackpackageupdatepush--i-string--f-string--s-datetime--w-number--v-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)
* [`sfdx dxpack:package:update:status -i <string> [-v <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-dxpackpackageupdatestatus--i-string--v-string---apiversion-string---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx dxpack:package:update:push -i <string> [-f <string>] [-s <datetime>] [-w <number>] [-v <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

push a package update

```
push a package update

USAGE
  $ sfdx dxpack:package:update:push -i <string> [-f <string>] [-s <datetime>] [-w <number>] [-v <string>] [--apiversion 
  <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --subscriberfilter=subscriberfilter                                           SOQL Where clause to use to include
                                                                                    orgs to upgrade. Uses fields on
                                                                                    PackageSubscriber SObject

  -i, --packageversionid=packageversionid                                           (required) package version to push

  -s, --schedulestarttime=schedulestarttime                                         date and time to schedule the update
                                                                                    for. Leave blank to update
                                                                                    immediately.

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  -w, --wait=wait                                                                   date and time to schedule the update
                                                                                    for. Leave blank to update
                                                                                    immediately.

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLES
  $ sfdx dxpack:package:update:push --packageversionid 04t4x0000000001234 -w 20
       Scheduling package upgrade... Package Push Request submitted successfully
       package installs InProgress, sleeping for 15 seconds
       package installs InProgress, sleeping for 15 seconds
       package install Succeeded:
       2 succeeded, 0 Failed
  
  $ sfdx dxpack:package:update:push --packageversionid 04t4x0000000001234 --subscriberfilter "OrgType='Sandbox'" -w 20
       Scheduling package upgrade... Package Push Request submitted successfully
       package installs InProgress, sleeping for 15 seconds
       package installs InProgress, sleeping for 15 seconds
       package install Succeeded:
       1 succeeded, 0 Failed
  
  $ sfdx dxpack:package:update:push --packageversionid 04t4x0000000001234 --schedulestarttime "2021-02-14 10:00"
       Scheduling package upgrade... Package Push Request submitted successfully
       Package Push Request created. Check the status by running sfdx packageutils:package:update:status -i 
  0DV4x000000kA5j
```

_See code: [lib/commands/dxpack/package/update/push.js](https://github.com/jtowers/dxpack/blob/v0.0.1/lib/commands/dxpack/package/update/push.js)_

## `sfdx dxpack:package:update:status -i <string> [-v <string>] [--apiversion <string>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

check the status of the specified push request

```
check the status of the specified push request

USAGE
  $ sfdx dxpack:package:update:status -i <string> [-v <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -i, --pushrequestid=pushrequestid                                                 (required) Id of the PackageRequest
                                                                                    record to check for

  -v, --targetdevhubusername=targetdevhubusername                                   username or alias for the dev hub
                                                                                    org; overrides default dev hub org

  --apiversion=apiversion                                                           override the api version used for
                                                                                    api requests made by this command

  --json                                                                            format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)  [default: warn] logging level for
                                                                                    this command invocation

EXAMPLE
  $ sfdx dxpack:package:update:status -i 0DV4x0000000001234
       ID                  STATUS     PACKAGE VERSION ID  DURATION SECONDS  SCHEDULED START TIME          START TIME     
                 END TIME
       ──────────────────  ─────────  ──────────────────  ────────────────  ────────────────────────────  
  ────────────────────────────  ────────────────────────────
       0DV4x0000000001234  Succeeded  04t4x0000000001234  18                2021-02-13T19:30:00.000+0000  
  2021-02-13T19:30:01.049+0000  2021-02-13T19:30:19.832+0000
```

_See code: [lib/commands/dxpack/package/update/status.js](https://github.com/jtowers/dxpack/blob/v0.0.1/lib/commands/dxpack/package/update/status.js)_
<!-- commandsstop -->
