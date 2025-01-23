import {
  AlgorandAccountAssetsFromAddressModel,
  AlgorandAccountCreateModel,
  AlgorandAccountInitModel,
  AlgorandCreateTransactionModel,
  AlgorandSignatureModel,
  AlgorandTransferModel,
  BlockchainDeleteModel,
  BlockchainGetModel,
  BlockchainSignModel,
  generateString,
  GridClient,
} from "../src";
import { getClient } from "./client_loader";
import { log } from "./utils";

let grid3: GridClient;
const test_account_address = "EBABIFYHKVSMFEV66M7SMIILEZCJ4SHBC3FPGISFFTRIIG6VX3KGSAXR34";
const mnemonic =
  "wood clump category carpet cabin cement joy cover this hour armor twist write trade term only label later lizard disease boil pelican dish ability this";
const message = "a message";
const receiver = "HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA";
const hexMessage = message
  .split("")
  .map((letter, i) => message.charCodeAt(i).toString(16))
  .join("");
const name = generateString(10);

async function main() {
  const account: AlgorandAccountCreateModel = {
    name: "myaccount",
  };
  const importedAccount: AlgorandAccountInitModel = {
    name: name,
    secret: mnemonic,
  };
  const accountAddress: AlgorandAccountAssetsFromAddressModel = {
    address: test_account_address,
  };
  const accountName: BlockchainGetModel = {
    name: name,
  };
  const transaction: AlgorandCreateTransactionModel = {
    name: name,
    address_dest: receiver,
    amount: 100,
    description: "test",
  };
  const deleteAccount1: BlockchainDeleteModel = {
    name: name,
  };
  const deleteAccount2: BlockchainDeleteModel = {
    name: "myaccount",
  };
  const message: BlockchainSignModel = {
    content: hexMessage,
    name: name,
  };
  const transactionModel: AlgorandCreateTransactionModel = {
    name: name,
    address_dest: receiver,
    amount: 100,
    description: "test",
  };
  const transfer: AlgorandTransferModel = {
    name: name,
    address_dest: receiver,
    amount: 100,
    description: "test",
  };

  await getClient().then(res => (grid3 = res));

  //Create Account
  await createAccount(account);

  //Import Account
  await importAccount(importedAccount);

  //Get assets from account address
  await getAccountAssetsFromAddress(accountAddress);

  //Get assets from account name
  await getAccountAssetsFromName(accountName);

  //Create Transaction
  await createTransaction(transaction);

  //Sign Bytes
  await signBytes(message);

  //Sign Transaction
  await signTransaction(transactionModel);

  //Get mnemonic from account name
  await getAccountMnemonicFromName(accountName);

  //Check if the account exists from account name
  await checkAccountExistsFromName(accountName);

  //List Accounts
  await listAccounts();

  //Transfer funds
  await transferAccount(transfer);

  //Delete Accounts
  await deleteAccount(deleteAccount1);
  await deleteAccount(deleteAccount2);

  grid3.disconnect();
}

async function createAccount(account) {
  try {
    await grid3.algorand.create(account);
    log(account);
  } catch (err) {
    console.log(err);
  }
}
async function importAccount(account) {
  try {
    const account_imported = await grid3.algorand.init(account);
    log(account_imported);
  } catch (err) {
    console.log(err);
  }
}
async function getAccountAssetsFromName(accountName) {
  try {
    const account_assets = await grid3.algorand.assets(accountName);
    log(account_assets);
  } catch (err) {
    console.log(err);
  }
}
async function getAccountAssetsFromAddress(accountAddress) {
  try {
    const account_assets = await grid3.algorand.assetsByAddress(accountAddress);
    log(account_assets);
  } catch (err) {
    console.log(err);
  }
}
async function createTransaction(transaction) {
  try {
    const account_tx = await grid3.algorand.createTransaction(transaction);
    log(account_tx);
  } catch (err) {
    console.log(err);
  }
}
async function getAccountMnemonicFromName(accountName) {
  try {
    const account = await grid3.algorand.get(accountName);
    log(account);
  } catch (err) {
    console.log(err);
  }
}
async function deleteAccount(accountName) {
  try {
    const deleteAccountConfirmation = await grid3.algorand.delete(accountName);
    log(deleteAccountConfirmation);
  } catch (err) {
    console.log(err);
  }
}
async function listAccounts() {
  try {
    const accountsList = await grid3.algorand.list();
    log(accountsList);
  } catch (err) {
    console.log(err);
  }
}
async function checkAccountExistsFromName(accountName) {
  try {
    const accountExist = await grid3.algorand.exist(accountName);
    log(accountExist);
  } catch (err) {
    console.log(err);
  }
}
async function signBytes(message) {
  try {
    const signed_txn = await grid3.algorand.sign(message);
    log(signed_txn);
  } catch (err) {
    console.log(err);
  }
}
async function signTransaction(transactionModel) {
  try {
    const txn = await grid3.algorand.createTransaction(transactionModel);

    const transaction: AlgorandSignatureModel = {
      txn: txn,
      name: name,
    };
    const signed_txn = await grid3.algorand.sign_txn(transaction);
    log(signed_txn);
  } catch (err) {
    console.log(err);
  }
}
async function transferAccount(transfer) {
  try {
    const account_tx = await grid3.algorand.pay(transfer);
    log(account_tx);
  } catch (err) {
    console.log(err);
  }
}

main();
