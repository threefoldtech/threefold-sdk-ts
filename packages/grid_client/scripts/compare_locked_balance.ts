import TFGridGqlClient from "@threefold/graphql_client";
import { ContractState } from "@threefold/gridproxy_client";

import { BalanceGetModel, GridClient } from "../src";
import { getClient } from "./client_loader";

interface Contract {
  contractID: string;
  state: string;
}

async function getUsersWithContracts(grid: GridClient) {
  const users: any[] = [];

  const graphql = new TFGridGqlClient(grid.config.graphqlURL);

  const [nodeContracts, nameContracts, rentContracts] = await Promise.all([
    graphql.nodeContracts(
      { twinID: true, contractID: true, state: true },
      {
        where: {
          state_in: [ContractState.Created, ContractState.GracePeriod],
        },
      },
    ),
    graphql.nameContracts(
      { twinID: true, contractID: true, state: true },
      {
        where: {
          state_in: [ContractState.Created, ContractState.GracePeriod],
        },
      },
    ),
    graphql.rentContracts(
      { twinID: true, contractID: true, state: true },
      {
        where: {
          state_in: [ContractState.Created, ContractState.GracePeriod],
        },
      },
    ),
  ]);

  const contracts = [...nodeContracts, ...nameContracts, ...rentContracts];

  const twinIDs = [...new Set(contracts.map(contract => contract.twinID))];

  const twins = await graphql.twins({ accountID: true, twinID: true }, { where: { twinID_in: twinIDs } });
  const twinMap = new Map(twins.map(twin => [twin.twinID, twin.accountID]));

  for (const contract of contracts) {
    const accountID = twinMap.get(contract.twinID);
    if (!accountID) continue;

    let user = users.find(user => user.twinID === contract.twinID);

    if (!user) {
      user = {
        twinID: contract.twinID,
        accountID: accountID,
        contracts: [],
      };
      users.push(user);
    }

    user.contracts.push({
      contractID: contract.contractID,
      state: contract.state,
    });
  }

  return users;
}
/** @deprecated */
async function getContractsLockedAmount(grid: GridClient, contracts: Contract[]) {
  const contractLockDetails = await Promise.all(
    contracts.map(contract => grid.contracts.contractLock({ id: +contract.contractID })),
  );

  return contractLockDetails.reduce((total, details) => total + details.amountLocked + details.extraAmountLocked, 0);
}

(async function main() {
  const grid = await getClient();
  await grid.tfclient.connect();

  const users = await getUsersWithContracts(grid);

  const unmatchedBalanceAccounts: any[] = [];

  const balancePromises = users.map(user => grid.balance.get({ address: user.accountID }));
  const balances = await Promise.all(balancePromises);

  const contractsLockedAmountPromises = users.map(user => getContractsLockedAmount(grid, user.contracts));
  const contractsLockedAmounts = await Promise.all(contractsLockedAmountPromises);

  for (const [index, user] of users.entries()) {
    const balance = balances[index];
    const contractsLockedAmount = contractsLockedAmounts[index];

    if (balance.frozen !== contractsLockedAmount) {
      unmatchedBalanceAccounts.push({
        ...user,
        lockedBalance: balance.frozen,
        lockedContractsBalance: contractsLockedAmount,
      });
    }
  }

  console.dir({ unmatchedBalanceAccounts }, { depth: null, colors: true });
  await grid.disconnect();
})();
