import { createClient } from "redis";

import { FilterOptions, generateString, GridClient, ZDBModel, ZdbModes, ZDBSModel } from "../../src";
import { getClient } from "../client_loader";
import { GBToBytes, generateInt, getOnlineNode, log } from "../utils";

jest.setTimeout(300000);

let gridClient: GridClient;
let deploymentName: string;

beforeAll(async () => {
  gridClient = await getClient();
  deploymentName = generateString(15);
  gridClient.clientOptions.projectName = `zdb/${deploymentName}`;
  gridClient._connect();
  return gridClient;
});

test("TC1236 - ZDB: Deploy ZDBs", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1236 - ZDB: Deploy ZDBs
     Scenario:
        - Generate Test Data/ZDB Config.
        - Select Nodes To Deploy the ZDBs on.
        - Deploy the ZDBs.
        - Assert that the generated data matches
          the deployment details.
        - Establish connection to the zdbs through
          redis client
        - Verify that the connection was established
          successfully.
        - Verify that the namespace was added and 
          that the disk size matches the generated 
          size.
        - Verify the ability to switch to your namespace
          and accessing it with the generated password.
        - Verify the ability of setting and getting
          data.
    **********************************************/

  //TestData
  const mode = ZdbModes.user;
  let diskSize = generateInt(1, 20);
  const publicNamespace = false;
  const password = generateString(15);
  const zdbName = generateString(15);
  const metadata = '"deploymentType": "zdb"';
  const description = "test deploying zdbs via ts grid3 client";
  const testKey = generateString(15);
  const testValue = generateString(15);

  //Node Selection
  let nodes;
  try {
    nodes = await gridClient.capacity.filterNodes({
      hru: diskSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
  } catch (error) {
    //Log the resources that were not found.
    log("A Node was not found with the generated resources." + error);
    log("Regenerating test data with lower resources....");

    //Generate lower resources.
    diskSize = generateInt(1, diskSize);

    //Search for another node with lower resources.
    nodes = await gridClient.capacity.filterNodes({
      hru: diskSize,
      farmId: 1,
      availableFor: await gridClient.twins.get_my_twin_id(),
    } as FilterOptions);
  }
  const nodeId = await getOnlineNode(nodes);
  if (nodeId == -1) throw new Error("no nodes available to complete this test");

  //Zdb Model
  const zdb: ZDBModel = {
    name: deploymentName,
    node_id: nodeId,
    mode: mode,
    disk_size: diskSize,
    publicNamespace: publicNamespace,
    password: password,
  };

  //Zdbs Model
  const zdbs: ZDBSModel = {
    name: zdbName,
    zdbs: [zdb],
    metadata: metadata,
    description: description,
  };

  const res = await gridClient.zdbs.deploy(zdbs);
  log(res);

  //Contracts Assertions
  expect(res.contracts.created).toHaveLength(1);
  expect(res.contracts.updated).toHaveLength(0);
  expect(res.contracts.deleted).toHaveLength(0);

  const result = await gridClient.zdbs.getObj(zdbs.name);
  log(result);

  //ZDB Assertions
  expect(result[0].nodeId).toBe(nodeId);
  expect(result[0].status).toBe("ok");
  expect(result[0].size).toBe(GBToBytes(diskSize));
  expect(result[0].mode).toBe(mode);
  expect(result[0].publicNamespace).toBe(publicNamespace);
  expect(result[0].password).toBe(password);
  expect(result[0].metadata).toBe(metadata);
  expect(result[0].description).toBe(description);
  expect(result[0].resData["Namespace"]).toContain(deploymentName);
  expect(result[0].resData["IPs"]).toBeDefined();
  expect(result[0].resData["Port"]).toBeDefined();

  //Get Namespace and Connection data from the deployment result
  const namespace = result[0].resData["Namespace"];
  const host = result[0].resData["IPs"][1];
  const port = result[0].resData["Port"];

  //Create a redis client.
  const client = createClient({
    socket: {
      host: host,
      port: port,
    },
  });

  //Connect to the client.
  client.connect();

  try {
    //Verify that a connection was established to the zdb
    const ping = await client.ping();
    log(ping);
    expect(ping).toBe("PONG");

    //Verify that the namespace was added successfully
    const list = await client.sendCommand(["nslist"]);
    log(list);
    expect(list).toContain(namespace);

    //Verify Disk Size
    const info = await client.sendCommand(["nsinfo", namespace]);
    log(info);
    const splittedRes = info.toString().split("\n");
    const diskValue = splittedRes[20].match(/^\d+|\d+\b|\d+(?=\w)/g);
    expect(splittedRes[1]).toContain(namespace);
    expect(+diskValue[0]).toBe(GBToBytes(diskSize));

    //Select Namespace
    const select = await client.sendCommand(["select", namespace, password]);
    log(select);
    expect(select).toBe("OK");

    //Set Key
    const set = await client.set(testKey, testValue);
    log(set);
    expect(set).toBe(testKey);

    //Get Key
    const get = await client.get(testKey);
    log(get);
    expect(get).toBe(testValue);
  } finally {
    await client.disconnect();
  }
});

afterEach(async () => {
  const zdbsNames = await gridClient.zdbs.list();
  for (const name of zdbsNames) {
    const res = await gridClient.zdbs.delete({ name });
    log(res);
    expect(res.created).toHaveLength(0);
    expect(res.updated).toHaveLength(0);
    expect(res.deleted).toBeDefined();
  }
});

afterAll(async () => {
  return await gridClient.disconnect();
}, 130000);
