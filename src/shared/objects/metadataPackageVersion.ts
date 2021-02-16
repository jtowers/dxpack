import {QueryResult} from 'jsforce/query';

export class MetadataPackageVersion {
    Id: string;
    PackageSubscribers:QueryResult<PackageSubscriber> ;
    ReleaseState: string;
    MajorVersion: number;
     MinorVersion: number;
     PatchVersion: number;
     MetadataPackageId: string;
}



export class PackageSubscriber {
    OrgKey : string;
    InstalledStatus : string;
    InstanceName : string;
    ParentOrg : string;
}