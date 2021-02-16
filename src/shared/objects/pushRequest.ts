import { Connection } from "@salesforce/core";
import { JsonMap } from "@salesforce/ts-types";
import { QueryResult } from "jsforce/query";
import {
  RecordResult,
  SuccessResult,
  ErrorResult,
} from "jsforce/record-result";
import { resultIsError, resultIsSuccess } from "../helpers/sobject";
import {
  MetadataPackageVersion,
  PackageSubscriber,
} from "./MetadataPackageVersion";

const PR_API_NAME = "PackagePushRequest";

export enum PackagePushRequestStatus {
  Canceled = "Canceled",
  Created = "Created",
  Failed = "Failed",
  InProgress = "In Progress",
  Pending = "Pending",
  Succeeded = "Succeeded",
}

export class PackagePushRequest implements JsonMap {
  [key: string]: import("@salesforce/ts-types").AnyJson;
  Id: string;
  DurationSeconds: number;
  EndTime: string;
  PackageVersionId: string;
  ScheduledStartTime: string;
  StartTime: string;
  Status: PackagePushRequestStatus;
}

export async function insertPushRequest(
  conn: Connection,
  record: PackagePushRequest
) {
  let result = await conn.create(PR_API_NAME, record);
  let errors = [];
  if (resultIsSuccess(result)) {
    record.Id = (result as SuccessResult).id;
  } else if (resultIsError(result)) {
    errors = (result as ErrorResult).errors;
  }

  return errors;
}

export async function getRecord(
  conn: Connection,
  id: string
): Promise<PackagePushRequest> {
  let query: string = `SELECT Id, DurationSeconds, EndTime, PackageVersionId, ScheduledStartTime, StartTime, Status FROM PackagePushRequest WHERE Id = '${id}'`;
  let results: QueryResult<PackagePushRequest> = await conn.query(query);
  let record: PackagePushRequest = null;
  if (results.totalSize > 0) {
    record = results.records[0];
  }

  return record;
}

export function createPushJobs(
  conn: Connection,
  subscribers: Array<string>,
  id: string
): Promise<SuccessResult | ErrorResult | RecordResult[]> {
  let pushJobs: Array<PackagePushJob> = new Array<PackagePushJob>();
  subscribers.forEach((subscriber) => {
    pushJobs.push(new PackagePushJob(id, subscriber));
  });

  return conn.create("PackagePushJob", pushJobs);
}

export class SubscriberResults {
  success: boolean;
  error: string;
  subscribers: PackageSubscriber[];
}

export class PackagePushJob {
  PackagePushRequestId: string;
  SubscriberOrganizationKey: string;
  Status: PackagePushRequestStatus;
  constructor(packagePushRequestId: string, orgId: string) {
    this.PackagePushRequestId = packagePushRequestId;
    this.SubscriberOrganizationKey = orgId;
  }
}

export async function getCurrentPackageVersion(
  conn: Connection,
  packageVersionId: string
): Promise<MetadataPackageVersion> {
  const currentPackageVersionQuery = `SELECT id, ReleaseState, MajorVersion, MinorVersion, PatchVersion, MetadataPackageId From MetadataPackageVersion Where Id = '${packageVersionId}' and ReleaseState = 'Released' Order by majorversion desc, minorversion desc, patchversion desc limit 1`;

  let currentPackageVersions: QueryResult<MetadataPackageVersion> = await conn.query(
    currentPackageVersionQuery
  );

  if (currentPackageVersions.totalSize == 0) {
    return null;
  }

  return currentPackageVersions.records[0];
}

export async function getSubscribers(
  conn: Connection,
  packageVersionId: string,
  subscriberFilter: string
): Promise<SubscriberResults> {
  let result: SubscriberResults = new SubscriberResults();
  let currentPackageVersion: MetadataPackageVersion = await this.getCurrentPackageVersion(
    conn,
    packageVersionId
  );

  if (currentPackageVersion == null) {
    result.success = false;
    result.error = "packageNotFound";
    return result;
  }
  result.success = true;
  result.subscribers = [];
  const subscriberSubquery = `Select OrgKey,InstalledStatus,InstanceName,ParentOrg from PackageSubscribers WHERE InstalledStatus = 'i' ${
    subscriberFilter ? `AND (${subscriberFilter})` : ""
  }`;
  let packageResults: QueryResult<MetadataPackageVersion> = await conn.query(
    `Select Id, ReleaseState, MajorVersion, MinorVersion, PatchVersion, MetadataPackageId, (${subscriberSubquery}) From MetadataPackageVersion Where MetadataPackageId = '${currentPackageVersion.MetadataPackageId}' and ReleaseState = 'Released' AND (MajorVersion < ${currentPackageVersion.MajorVersion} OR (MajorVersion = ${currentPackageVersion.MajorVersion} and MinorVersion < ${currentPackageVersion.MinorVersion}) OR (MajorVersion = ${currentPackageVersion.MajorVersion} and MinorVersion = ${currentPackageVersion.MinorVersion} and PatchVersion < ${currentPackageVersion.PatchVersion})) Order by majorversion desc, minorversion desc, patchversion desc`
  );
  packageResults.records.forEach((record) => {
    if (record.PackageSubscribers && record.PackageSubscribers.records) {
      result.subscribers = result.subscribers.concat(
        record.PackageSubscribers.records
      );
    }
  });

  return result;
}
