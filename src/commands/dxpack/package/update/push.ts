import { flags, SfdxCommand } from "@salesforce/command";
import {
  Connection,
  Logger,
  Messages,
  PollingClient,
  SfdxError,
  StatusResult,
} from "@salesforce/core";
import { AnyJson } from "@salesforce/ts-types";
import {
  getRecord,
  getSubscribers,
  insertPushRequest,
  createPushJobs,
  PackagePushJob,
  PackagePushRequest,
  PackagePushRequestStatus,
  SubscriberResults,
} from "../../../../shared/objects/pushRequest";
import { Duration } from "@salesforce/kit";
import * as dayjs from "dayjs";
import * as utc from "dayjs/plugin/utc";
import { QueryResult } from "jsforce/query";
import { RecordResult, ErrorResult } from "jsforce/record-result";
import { resultIsError } from "../../../../shared/helpers/sobject";
import { getPollingClient } from "../../../../shared/helpers/poll";


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages("@jtowers/dxpack", "push");

export default class Org extends SfdxCommand {
  public static description = messages.getMessage("commandDescription");

  public static examples = [
    `$ sfdx dxpack:package:update:push --packageversionid 04t4x0000000001234 -w 20
    Scheduling package upgrade... Package Push Request submitted successfully
    package installs InProgress, sleeping for 15 seconds
    package installs InProgress, sleeping for 15 seconds
    package install Succeeded:
    2 succeeded, 0 Failed
  `,
    `$ sfdx dxpack:package:update:push --packageversionid 04t4x0000000001234 --subscriberfilter "OrgType='Sandbox'" -w 20
    Scheduling package upgrade... Package Push Request submitted successfully
    package installs InProgress, sleeping for 15 seconds
    package installs InProgress, sleeping for 15 seconds
    package install Succeeded:
    1 succeeded, 0 Failed
  `,
    `$ sfdx dxpack:package:update:push --packageversionid 04t4x0000000001234 --schedulestarttime "2021-02-14 10:00"
    Scheduling package upgrade... Package Push Request submitted successfully
    Package Push Request created. Check the status by running sfdx packageutils:package:update:status -i 0DV4x000000kA5j
  `,
  ];

  public static args = [{ name: "file" }];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    packageversionid: flags.string({
      char: "i",
      required: true,
      description: messages.getMessage("versionFlagDescription"),
    }),
    subscriberfilter: flags.string({
      char: "f",
      description: messages.getMessage("subscriberFilterDescription"),
    }),
    schedulestarttime: flags.datetime({
      char: "s",
      description: messages.getMessage("scheduleStartFlagDescription"),
    }),
    wait: flags.number({
      char: "w",
      description: messages.getMessage("scheduleStartFlagDescription"),
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
    let scheduleStartTime = null;
    if (this.flags.schedulestarttime) {
      dayjs.extend(utc);
      let startTime: dayjs.Dayjs = dayjs(this.flags.schedulestarttime);
      let now = dayjs();
      if (startTime.isBefore(now)) {
        throw new SfdxError(messages.getMessage("scheduleFuture"));
      }
      scheduleStartTime = startTime.utc().format();
    }

    this.ux.startSpinner(
      "Scheduling package upgrade",
      "getting eligible subscribers",
      { stdout: true }
    );

    let subscriberResult: SubscriberResults = await getSubscribers(
      conn,
      this.flags.packageversionid,
      this.flags.subscriberfilter
    );

    if (!subscriberResult.success) {
      this.ux.stopSpinner(messages.getMessage(subscriberResult.error));
      throw new SfdxError(
        messages.getMessage(subscriberResult.error),
        "GetSubscribersError"
      );
    }

    let subscribers = [];

    subscriberResult.subscribers.forEach((subscriber) => {
      if (subscribers.indexOf(subscriber.OrgKey) == -1) {
        subscribers.push(subscriber.OrgKey);
      }
    });

    if (subscribers.length == 0) {
      this.ux.stopSpinner(messages.getMessage("noSubscribers"));
      throw new SfdxError(
        messages.getMessage("noSubscribers"),
        "NoSubscribersError"
      );
    }

    this.ux.setSpinnerStatus("creating push request");
    let pushRequest: PackagePushRequest = new PackagePushRequest();
    pushRequest.PackageVersionId = this.flags.packageversionid;
    pushRequest.ScheduledStartTime = scheduleStartTime;

    let pushReqErrors = await insertPushRequest(conn, pushRequest);

    if (pushReqErrors.length > 0) {
      this.ux.stopSpinner(pushReqErrors.join("\n"));
      throw new SfdxError(pushReqErrors.join("\n"));
    }

    this.ux.setSpinnerStatus(
      `creating push jobs for ${subscribers.length} subscribers`
    );
    let pushJobResults: RecordResult[] = (await createPushJobs(
      conn,
      subscribers,
      pushRequest.Id
    )) as RecordResult[];
    let errors = [];
    pushJobResults.forEach((pushJobResult) => {
      if (
        resultIsError(pushJobResult) &&
        (pushJobResult as ErrorResult).errors.length > 0
      ) {
        errors = errors.concat((pushJobResult as ErrorResult).errors);
      }
    });

    if (errors.length > 0) {
      this.ux.stopSpinner(messages.getMessage("pushJobCreateError"));
      throw new SfdxError(messages.getMessage("pushJobCreateError"));
    }

    this.ux.setSpinnerStatus("updating push request status");

    pushRequest.Status = PackagePushRequestStatus.Pending;

    let updateResult: RecordResult = (await conn.update(
      "PackagePushRequest",
      pushRequest
    )) as RecordResult;

    if (!updateResult.success) {
      this.ux.stopSpinner(messages.getMessage("packageRequestUpdateError"));
      throw new SfdxError(messages.getMessage("packageRequestUpdateError"));
    }

    this.ux.stopSpinner("Package Push Request submitted successfully");

    if (!this.flags.schedulestarttime && this.flags.wait) {
      let result = await this.pollResult(
        conn,
        pushRequest.Id,
        this.flags.wait,
        this.logger
      );
      this.ux.log(messages.getMessage("successWait", [result.Status]));
      let postPushResults: QueryResult<PackagePushJob> = await conn.query(
        `SELECT Id, Status FROM PackagePushJob WHERE PackagePushRequestId = '${pushRequest.Id}'`
      );
      let successes = 0;
      let failures = 0;
      if (postPushResults.totalSize > 0) {
        postPushResults.records.forEach((postPushResult) => {
          postPushResult.Status == PackagePushRequestStatus.Succeeded
            ? successes++
            : failures++;
        });
        this.ux.log(`${successes} succeeded, ${failures} Failed`);
      }
    } else {
      this.ux.log(
      messages.getMessage("successNoWait", [pushRequest.Id])
      );
    }
    return pushRequest;
  }

  async pollResult(
    conn: Connection,
    pushRequestId: string,
    wait: number,
    logger: Logger
  ): Promise<PackagePushRequest> {
    let self = this;
    const options: PollingClient.Options = {
      async poll(): Promise<StatusResult> {
        try {
          let result = await getRecord(conn, pushRequestId);
          if (
            result.Status == PackagePushRequestStatus.Succeeded ||
            result.Status == PackagePushRequestStatus.Failed
          ) {
            return {
              completed: true,
              payload: result,
            };
          } else {
            self.ux.log(
              `package installs ${result.Status}, sleeping for 15 seconds`
            );
            return {
              completed: false,
            };
          }
        } catch (error) {
          self.ux.log("Error checking push request status");
          self.ux.log(error);
          return {
            completed: true,
          };
        }
      },
      frequency: Duration.seconds(15),
      timeout: Duration.minutes(wait),
      timeoutErrorName: "PackagePushTimeoutError",
    };

    const client : PollingClient = await getPollingClient(options)

    let result : AnyJson = await client.subscribe();
    return result as PackagePushRequest;
  }
}
