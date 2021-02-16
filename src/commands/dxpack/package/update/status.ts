import { flags, SfdxCommand } from "@salesforce/command";
import { Connection, Messages, SfdxError } from "@salesforce/core";
import { AnyJson } from "@salesforce/ts-types";
import {
  getRecord,
  PackagePushRequest,
} from "../../../../shared/objects/pushRequest";

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages("@jtowers/dxpack", "status");

export default class Org extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");

  public static examples = [
    `$ sfdx dxpack:package:update:status -i 0DV4x0000000001234
    ID                  STATUS     PACKAGE VERSION ID  DURATION SECONDS  SCHEDULED START TIME          START TIME                    END TIME
    ──────────────────  ─────────  ──────────────────  ────────────────  ────────────────────────────  ────────────────────────────  ────────────────────────────
    0DV4x0000000001234  Succeeded  04t4x0000000001234  18                2021-02-13T19:30:00.000+0000  2021-02-13T19:30:01.049+0000  2021-02-13T19:30:19.832+0000
  `,
  ];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    pushrequestid: flags.string({
      char: "i",
      required: true,
      description: messages.getMessage("idDescription"),
    }),
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static requiresDevhubUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    let conn: Connection = this.hubOrg.getConnection();
    let record: PackagePushRequest = await getRecord(
      conn,
      this.flags.pushrequestid
    );
    if (record === null) {
      throw new SfdxError(
        messages.getMessage("errorNoOrgResults", [this.flags.pushrequestid])
      );
    }

    this.ux.table(
      [record],
      [
        "Id",
        "Status",
        "PackageVersionId",
        "DurationSeconds",
        "ScheduledStartTime",
        "StartTime",
        "EndTime",
      ]
    );
    return record;
  }
}
