import { Client } from "@threefold/rmb_direct_client";

import {
  DeploymentBuilder,
  KeypairType,
  KeypairTypeBuilder,
  SignatureRequestBuilder,
  SignatureRequirementBuilder,
  TFClient,
  Zmachine,
} from "../src";
import { ComputeCapacity, Mount, Workload, WorkloadTypes, ZmachineNetwork, Zmount, Znet } from "../src/zos";
import { log } from "./utils";

const mnemonic = "";
const chainURL = "wss://tfchain.dev.grid.tf/ws";

const relayURL = "wss://relay.dev.grid.tf";

const zmount = new Zmount();
zmount.size = 53687091200;

const disk = new Workload();
disk.version = 0;
disk.name = "mydisk";
disk.type = WorkloadTypes.zmount;
disk.data = zmount;
disk.metadata = "";
disk.description = "";

const diskMount = new Mount();
diskMount.name = "mydisk";
diskMount.mountpoint = "/mnt/data";

const znet = new Znet();
znet.subnet = "10.20.2.0/24";
znet.ip_range = "10.20.0.0/16";
znet.wireguard_private_key = "fstP801ndccfungAShmfpldUnQBW6UGWbuW6Iot3J1I=";
znet.wireguard_listen_port = 18965;
znet.peers = [];

const network = new Workload();
network.version = 0;
network.name = "testnetwork";
network.type = WorkloadTypes.network;
network.data = znet;
network.metadata = JSON.stringify({ version: 3, user_accesses: [] });
network.description = "";

const vmNetwork1 = new ZmachineNetwork();
vmNetwork1.planetary = true;
vmNetwork1.interfaces = [
  {
    network: "testnetwork",
    ip: "10.20.2.2",
  },
];
vmNetwork1.public_ip = "";

const computeCapacity = new ComputeCapacity();
computeCapacity.cpu = 1;
computeCapacity.memory = 722604032;

const zmachine = new Zmachine();

// const zlight = new ZmachineLight();

zmachine.flist = "https://hub.grid.tf/tf-official-vms/ubuntu-24.04-full.flist";
zmachine.network = vmNetwork1;
zmachine.size = 524288000;
zmachine.compute_capacity = computeCapacity;

zmachine.mounts = [diskMount];

zmachine.entrypoint = "/sbin/zinit init";
zmachine.env = {
  "SSH _KEY": "ssh-rsa AAAAB3NzaC1yc2EA",
};
zmachine.corex = false;
zmachine.gpu = [];

const vm = new Workload();
vm.version = 0;
vm.name = "ayvn";
vm.type = WorkloadTypes.zmachine;
vm.data = zmachine;
vm.metadata = "";
vm.description = "";

const signature_request = new SignatureRequestBuilder();
signature_request.twin_id = 0;
signature_request.weight = 1;
signature_request.required = false;

const signature_requirement = new SignatureRequirementBuilder();
signature_requirement.weight = 1;
signature_requirement.requests = [signature_request];

const deployment = new DeploymentBuilder();
deployment.version = 0;
deployment.twin_id = 0;
deployment.metadata = "";
deployment.description = "";
deployment.expiration = 0;
deployment.workloads = [disk, vm, network];

deployment.sig_req = signature_requirement;

async function main() {
  const hash = deployment.challenge_hash();
  const tfClient = new TFClient(chainURL, mnemonic, mnemonic, KeypairType.sr25519);
  await tfClient.connect();
  const s = '"version" : 3, "type": "vm", "name": "myvm", "projectName": "vm/myvm" ';

  const contract = await (
    await tfClient.contracts.createNode({
      hash,
      numberOfPublicIps: 0,
      nodeId: 156,
      solutionProviderId: 1,
      data: JSON.stringify({ s }),
    })
  ).apply();
  deployment.contract_id = contract.contractId;
  await deployment.sign(79, mnemonic, KeypairTypeBuilder.sr25519);

  const rmbClient = new Client(chainURL, relayURL, mnemonic, "test", KeypairType.sr25519, 5);
  await rmbClient.connect();

  console.log(JSON.stringify(deployment));
  const deployMessageId = await rmbClient.send("zos.deployment.deploy", JSON.stringify(deployment), 6017, 1, 3);
  const deployReply = await rmbClient.read(deployMessageId);
  log(deployReply);
  await setTimeout(() => {}, 10000);

  const getMessage = await rmbClient.send(
    "zos.deployment.get",
    JSON.stringify({ contract_id: contract.contractId }),
    6017,
    1,
    3,
  );
  const getReply = await rmbClient.read(getMessage);
  log(getReply);
  await tfClient.disconnect();
  await rmbClient.disconnect();
}
main();
