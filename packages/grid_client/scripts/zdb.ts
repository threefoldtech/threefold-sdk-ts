import { FilterOptions, generateString, ZdbModes, ZDBSModel } from "../src";
import { getClient } from "./client_loader";
import { log } from "./utils";

async function deploy(client, zdb) {
  const res = await client.zdbs.deploy(zdb);
  log("================= Deploying ZDBs =================");
  log(res);
  log("================= Deploying ZDBs =================");
}

async function getDeployment(client, zdb) {
  const res = await client.zdbs.getObj(zdb);
  log("================= Getting deployment information =================");
  log(res);
  log("================= Getting deployment information =================");
}

async function cancel(client, zdb) {
  const res = await client.zdbs.delete(zdb);
  log("================= Canceling the deployment =================");
  log(res);
  log("================= Canceling the deployment =================");
}

async function main() {
  const name = "zdb" + generateString(8);
  const grid3 = await getClient(`zdb/${name}`);

  const zdbQueryOptions: FilterOptions = {
    sru: 3,
    hru: 3,
    availableFor: grid3.twinId,
    farmId: 1,
  };

  const zdbs: ZDBSModel = {
    name,
    zdbs: [
      {
        name: "hamada",
        node_id: +(await grid3.capacity.filterNodes(zdbQueryOptions))[0].nodeId,
        mode: ZdbModes.user,
        disk_size: 1,
        publicNamespace: false,
        password: "testzdb",
      },
    ],
    metadata: "",
    description: "test zdbs",
  };

  //Deploy ZDBs
  await deploy(grid3, zdbs);

  //Get the deployment
  await getDeployment(grid3, name);

  //Uncomment the line below to cancel the deployment
  // await cancel(grid3, { name });

  await grid3.disconnect();
}

main();
