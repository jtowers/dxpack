
import { PollingClient } from "@salesforce/core";

export interface PollingHandler{
    poll
}

export async function getPollingClient(options: PollingClient.Options) : Promise<PollingClient>{
    return await PollingClient.create(options);
}
