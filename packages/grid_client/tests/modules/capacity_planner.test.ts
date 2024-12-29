import {
  FarmHasFreePublicIPsModel,
  FarmIdFromFarmNameModel,
  FarmsGetModel,
  FilterOptions,
  GridClient,
  NodeFreeResourcesModel,
  NodesGetModel,
  randomChoice,
} from "../../src";
import { getClient } from "../client_loader";
import { GBToBytes, generateInt, log } from "../utils";

jest.setTimeout(300000);

let gridClient: GridClient;

beforeAll(async () => {
  return (gridClient = await getClient());
});

test("TC1239 - Capacity Planner: Get Farms", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1239 - Capacity Planner: Get Farms
     Scenario:
        - Generate Test Data.
        - Get Farms that match the generated data.
            - Page
            - maxResult
        - Assert that the length of returned Farms
          Matches the generated maxResult
    **********************************************/

  //TestData
  const page = generateInt(1, 5);
  const maxResult = generateInt(1, 50);
  const farms: FarmsGetModel = {
    page: page,
    maxResult: maxResult,
  };

  const res = await gridClient.capacity.getFarms(farms);
  log(res);
  expect(res.length).toBe(farms.maxResult);
});

test("TC1240 - Capacity Planner: Get All Farms", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1240 - Capacity Planner: Get All Farms
     Scenario:
        - Get All Farms.
        - Assert that the Farms are Returned.
    **********************************************/

  const res = await gridClient.capacity.getAllFarms();
  log(res);
  expect(res).toBeDefined();
});

test("TC1241 - Capacity Planner: Get Nodes", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1241 - Capacity Planner: Get Nodes
     Scenario:
        - Generate Test Data.
        - Get Nodes that match the generated data.
            - Page
            - maxResult
        - Assert that the length of returned Nodes
          Matches the generated maxResult
    **********************************************/

  //TestData
  const page = 1;
  const maxResult = generateInt(1, 30);
  const nodes: NodesGetModel = {
    page: page,
    maxResult: maxResult,
  };

  const res = await gridClient.capacity.getNodes(nodes);
  log(res);
  expect(res.length).toBe(nodes.maxResult);
});

test("TC1242 - Capacity Planner: Get All Nodes", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1242 - Capacity Planner: Get All Nodes
     Scenario:
        - Get All Nodes.
        - Assert that the Nodes are Returned.
    **********************************************/

  const res = await gridClient.capacity.getAllNodes();
  log(res);
  expect(res).toBeDefined();
});

test("TC1243 - Capacity Planner: Filter Nodes", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1243 - Capacity Planner: Filter Nodes
     Scenario:
        - Generate Test Data.
        - Get Nodes that match the applied filters.
        - Assert that the returned nodes match resources
          applied in the filter.
    **********************************************/

  //TestData
  const mru = generateInt(1, 100);
  const sru = generateInt(1, 100);
  const hru = generateInt(1, 100);
  const farmId = 1; //FreeFarm
  const filter: FilterOptions = {
    mru: mru,
    sru: sru,
    hru: hru,
    farmId: farmId,
  };

  log(
    "Nodes Are Filtered According to The Following Specs: " +
      "MRU: " +
      mru +
      "GB | SRU: " +
      sru +
      "GB | HRU: " +
      hru +
      "GB",
  );

  const res = await gridClient.capacity.filterNodes(filter);
  log(res);

  for (const node in res) {
    expect(res[node].total_resources["mru"] - res[node].used_resources["mru"]).toBeGreaterThanOrEqual(GBToBytes(mru));
    expect(res[node].total_resources["sru"] - res[node].used_resources["sru"]).toBeGreaterThanOrEqual(GBToBytes(sru));
    expect(res[node].total_resources["hru"] - res[node].used_resources["hru"]).toBeGreaterThanOrEqual(GBToBytes(hru));
    expect(res[node].farmId).toEqual(farmId);
  }
});

test("TC1244 - Capacity Planner: Get Free Public IPs", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1244 - Capacity Planner: Get Free Public IPs
     Scenario:
        - Set the farm ID.
        - Check if the mentioned Farm has free
          public IPs.
    **********************************************/

  //TestData
  const farmId = 1; //FreeFarm
  const freePublicIPs: FarmHasFreePublicIPsModel = {
    farmId: farmId,
  };

  const res = await gridClient.capacity.checkFarmHasFreePublicIps(freePublicIPs);
  log(res);
  expect(res).toBeDefined();
});

test("TC1245 - Capacity Planner: Get Free Resources of a Specific Node", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1245 - Capacity Planner: Get Free 
     Resources of a Specific Node
     Scenario:
        - Get Node ID.
        - Check if the mentioned Node has free
          Resources.
    **********************************************/

  //TestData
  const nodes = await gridClient.capacity.filterNodes({
    availableFor: await gridClient.twins.get_my_twin_id(),
  } as FilterOptions);
  const nodeId = +randomChoice(nodes).nodeId;
  const nodeFreeResources: NodeFreeResourcesModel = {
    nodeId: nodeId,
  };

  const res = await gridClient.capacity.getNodeFreeResources(nodeFreeResources);
  log(res);
  expect(res).toBeDefined();
});

test("TC1246 - Capacity Planner: Get Farm ID From Farm Name", async () => {
  /**********************************************
     Test Suite: Grid3_Client_TS (Automated)
     Test Cases: TC1246 - Capacity Planner: Get Farm ID From Farm Name
     Scenario:
        - Set Farm Name.
        - Get the Farm ID of the mentioned Farm Name.
        - Assert that the Correct ID is returned.
    **********************************************/

  //TestData
  const farmName = "freefarm";
  const farmId = 1; //FreeFarm
  const farmIdFromFarmName: FarmIdFromFarmNameModel = {
    farmName: farmName,
  };

  const res = await gridClient.capacity.getFarmIdFromFarmName(farmIdFromFarmName);
  log(res);
  expect(res).toEqual(farmId);
});

afterAll(async () => {
  return await gridClient.disconnect();
}, 130000);
