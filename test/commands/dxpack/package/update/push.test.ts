import { expect, test } from "@salesforce/command/lib/test";
import { Messages, PollingClient } from "@salesforce/core";
import { ensureJsonMap, ensureString } from "@salesforce/ts-types";
import { testSetup } from "@salesforce/core/lib/testSetup";
import * as poll from "../../../../../src/shared/helpers/poll";
import { AnyJson } from "@salesforce/ts-types";

const $$ = testSetup();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages("@jtowers/dxpack", "push");
const PPR_INSERT_ERR = "Error inserting PackagePushRequest";
describe("dxpack:package:update:push", () => {
  test
    .withOrg({ devHubUsername: "test@org.com" }, true)
    .withConnectionRequest(() => {
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
    ])
    .it("displays error when package version not found", (ctx) => {
      expect(ctx.stdout).to.contain(messages.getMessage("packageNotFound"));
    });

  test
    .withOrg(
      {
        devHubUsername: "test@org.com",
      },
      true
    )
    .withConnectionRequest((request) => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/PackageSubscribers/)) {
        return Promise.resolve({ records: [] });
      } else if (ensureString(requestMap.url).match(/MetadataPackageVersion/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001234" }] });
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
    ])
    .it("displays error when no previous package versions found", (ctx) => {
      expect(ctx.stdout).to.contain(messages.getMessage("noSubscribers"));
    });

  test
    .withOrg(
      {
        devHubUsername: "test@org.com",
      },
      true
    )
    .withConnectionRequest((request) => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/PackageSubscribers/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001235" }] });
      } else if (ensureString(requestMap.url).match(/MetadataPackageVersion/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001234" }] });
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
    ])
    .it("displays error when no subscribers found", (ctx) => {
      expect(ctx.stdout).to.contain(messages.getMessage("noSubscribers"));
    });

  test
    .withOrg(
      {
        devHubUsername: "test@org.com",
      },
      true
    )
    .withConnectionRequest((request) => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/PackageSubscribers/)) {
        return Promise.resolve({
          records: [
            {
              Id: "04t4x0000000001235",
              PackageSubscribers: {
                records: [
                  { Id: "04t4x0000000001236", OrgKey: "04t4x0000000001236" },
                ],
              },
            },
          ],
        });
      } else if (ensureString(requestMap.url).match(/MetadataPackageVersion/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001234" }] });
      } else if (
        ensureString(requestMap.url).match(/sobjects\/PackagePushRequest/)
      ) {
        return Promise.resolve({
          success: false,
          errors: [PPR_INSERT_ERR],
        });
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
    ])
    .it(
      "displays error when there is an error creating the package push request",
      (ctx) => {
        expect(ctx.stdout).to.contain(PPR_INSERT_ERR);
      }
    );

  test
    .withOrg(
      {
        devHubUsername: "test@org.com",
      },
      true
    )
    .withConnectionRequest((request) => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/PackageSubscribers/)) {
        return Promise.resolve({
          records: [
            {
              Id: "04t4x0000000001235",
              PackageSubscribers: {
                records: [
                  { Id: "04t4x0000000001236", OrgKey: "04t4x0000000001236" },
                ],
              },
            },
          ],
        });
      } else if (ensureString(requestMap.url).match(/MetadataPackageVersion/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001234" }] });
      } else if (
        ensureString(requestMap.url).match(/sobjects\/PackagePushRequest/)
      ) {
        return Promise.resolve({
          success: true,
          id: "04t4x0000000001236",
        });
      } else if (ensureString(requestMap.url).match(/composite\/sobjects/)) {
        return Promise.resolve([
          {
            success: false,
            errors: ["Error inserting package push job"],
          },
        ]);
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
    ])
    .it(
      "displays error when there is an error creating the package push jobs",
      (ctx) => {
        expect(ctx.stdout).to.contain(
          messages.getMessage("pushJobCreateError")
        );
      }
    );

  test
    .withOrg(
      {
        devHubUsername: "test@org.com",
      },
      true
    )
    .withConnectionRequest((request) => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/PackageSubscribers/)) {
        return Promise.resolve({
          records: [
            {
              Id: "04t4x0000000001235",
              PackageSubscribers: {
                records: [
                  { Id: "04t4x0000000001236", OrgKey: "04t4x0000000001236" },
                ],
              },
            },
          ],
        });
      } else if (ensureString(requestMap.url).match(/MetadataPackageVersion/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001234" }] });
      } else if (
        ensureString(requestMap.url).match(/sobjects\/PackagePushRequest/)
      ) {
        if (requestMap.method === "POST") {
          return Promise.resolve({
            success: true,
            id: "04t4x0000000001236",
          });
        } else {
          return Promise.resolve({
            success: false,
            errors: ["error updating package"],
          });
        }
      } else if (ensureString(requestMap.url).match(/composite\/sobjects/)) {
        return Promise.resolve([
          {
            success: true,
            id: "04t4x0000000001237",
          },
        ]);
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
    ])
    .it(
      "displays error when there is an error updating the package push request",
      (ctx) => {
        expect(ctx.stdout).to.contain(
          messages.getMessage("packageRequestUpdateError")
        );
      }
    );

  test
    .withOrg(
      {
        devHubUsername: "test@org.com",
      },
      true
    )
    .withConnectionRequest((request) => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/PackageSubscribers/)) {
        return Promise.resolve({
          records: [
            {
              Id: "04t4x0000000001235",
              PackageSubscribers: {
                records: [
                  { Id: "04t4x0000000001236", OrgKey: "04t4x0000000001236" },
                ],
              },
            },
          ],
        });
      } else if (ensureString(requestMap.url).match(/MetadataPackageVersion/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001234" }] });
      } else if (
        ensureString(requestMap.url).match(/sobjects\/PackagePushRequest/)
      ) {
        if (requestMap.method === "POST") {
          return Promise.resolve({
            success: true,
            id: "04t4x0000000001236",
          });
        } else {
          return Promise.resolve({
            success: true,
            id: "04t4x0000000001236",
          });
        }
      } else if (ensureString(requestMap.url).match(/composite\/sobjects/)) {
        return Promise.resolve([
          {
            success: true,
            id: "04t4x0000000001237",
          },
        ]);
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
    ])
    .it(
      "displays success when package push request submitted successfully and no wait specified",
      (ctx) => {
        expect(ctx.stdout).to.contain(
          messages.getMessage("successNoWait", ["04t4x0000000001236"])
        );
      }
    );

  test
    .withOrg(
      {
        devHubUsername: "test@org.com",
      },
      true
    )
    .do(() => {
      $$.SANDBOX.stub(poll, "getPollingClient").resolves({
        subscribe: () => Promise.resolve({ Status: "Failed" } as AnyJson),
      } as PollingClient);
    })
    .withConnectionRequest((request) => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/PackageSubscribers/)) {
        return Promise.resolve({
          records: [
            {
              Id: "04t4x0000000001235",
              PackageSubscribers: {
                records: [
                  { Id: "04t4x0000000001236", OrgKey: "04t4x0000000001236" },
                ],
              },
            },
          ],
        });
      } else if (ensureString(requestMap.url).match(/MetadataPackageVersion/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001234" }] });
      } else if (
        ensureString(requestMap.url).match(/sobjects\/PackagePushRequest/)
      ) {
        if (requestMap.method === "POST") {
          return Promise.resolve({
            success: true,
            id: "04t4x0000000001236",
          });
        } else {
          return Promise.resolve({
            success: true,
            id: "04t4x0000000001236",
          });
        }
      } else if (ensureString(requestMap.url).match(/composite\/sobjects/)) {
        return Promise.resolve([
          {
            success: true,
            id: "04t4x0000000001237",
          },
        ]);
      } else if (ensureString(requestMap.url).match(/PackagePushJob/)) {
        return Promise.resolve([{ Status: "Succeeded" }, { Status: "Failed" }]);
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
      "-w",
      "20",
    ])
    .it(
      "displays success when package push request submitted successfully wait specified",
      (ctx) => {
        expect(ctx.stdout).to.contain(
          messages.getMessage("successWait", ["Failed"])
        );
      }
    );

  test
    .withOrg(
      {
        devHubUsername: "test@org.com",
      },
      true
    )
    .do(() => {
      $$.SANDBOX.stub(poll, "getPollingClient").resolves({
        subscribe: () => Promise.resolve({ Status: "Succeeded" } as AnyJson),
      } as PollingClient);
    })
    .withConnectionRequest((request) => {
      const requestMap = ensureJsonMap(request);
      if (ensureString(requestMap.url).match(/PackageSubscribers/)) {
        return Promise.resolve({
          records: [
            {
              Id: "04t4x0000000001235",
              PackageSubscribers: {
                records: [
                  { Id: "04t4x0000000001236", OrgKey: "04t4x0000000001236" },
                ],
              },
            },
          ],
        });
      } else if (ensureString(requestMap.url).match(/MetadataPackageVersion/)) {
        return Promise.resolve({ records: [{ Id: "04t4x0000000001234" }] });
      } else if (
        ensureString(requestMap.url).match(/sobjects\/PackagePushRequest/)
      ) {
        if (requestMap.method === "POST") {
          return Promise.resolve({
            success: true,
            id: "04t4x0000000001236",
          });
        } else {
          return Promise.resolve({
            success: true,
            id: "04t4x0000000001236",
          });
        }
      } else if (ensureString(requestMap.url).match(/composite\/sobjects/)) {
        return Promise.resolve([
          {
            success: true,
            id: "04t4x0000000001237",
          },
        ]);
      } else if (ensureString(requestMap.url).match(/PackagePushJob/)) {
        return Promise.resolve([{ Status: "Succeeded" }, { Status: "Failed" }]);
      }
      return Promise.resolve({ records: [] });
    })
    .stdout()
    .command([
      "dxpack:package:update:push",
      "-i",
      "04t4x0000000001234",
      "-v",
      "test@org.com",
      "-w",
      "20",
    ])
    .it(
      "displays success when package push request submitted successfully wait specified",
      (ctx) => {
        expect(ctx.stdout).to.contain(
          messages.getMessage("successWait", ["Succeeded"])
        );
      }
    );
});
