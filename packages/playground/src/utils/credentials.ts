import { KeypairType } from "@threefold/grid_client";
import Cryptr from "cryptr";
import md5 from "md5";

import { createCustomToast, ToastType } from "./custom_toast";
import { getGrid, readEmail } from "./grid";
export interface Credentials {
  passwordHash?: string;
  mnemonicHash?: string;
  keypairTypeHash?: string;
  emailHash?: string;
}

const version = 1;
const WALLET_KEY = "wallet.v" + version;
export function getCredentials() {
  const getCredentials = localStorage.getItem(WALLET_KEY);
  let credentials: Credentials = {};

  if (getCredentials) {
    credentials = JSON.parse(getCredentials);
  }
  return credentials;
}

export function setCredentials(
  passwordHash: string,
  mnemonicHash: string,
  keypairTypeHash: string,
  emailHash: string,
): Credentials {
  const credentials: Credentials = {
    passwordHash,
    mnemonicHash,
    keypairTypeHash,
    emailHash,
  };
  localStorage.setItem(WALLET_KEY, JSON.stringify(credentials));
  return credentials;
}

export async function updateCredentials(currentPassword: string, newPassword: string) {
  try {
    const credentials = getCredentials();

    if (credentials.passwordHash && credentials.mnemonicHash) {
      const currentCryptr = new Cryptr(currentPassword, { pbkdf2Iterations: 10, saltLength: 10 });

      const mnemonic = currentCryptr.decrypt(credentials.mnemonicHash);
      const keypairType = credentials.keypairTypeHash
        ? currentCryptr.decrypt(credentials.keypairTypeHash)
        : KeypairType.sr25519;

      const newCryptr = new Cryptr(newPassword, { pbkdf2Iterations: 10, saltLength: 10 });

      const mnemonicHash = newCryptr.encrypt(mnemonic);
      const keypairTypeHash = newCryptr.encrypt(keypairType);
      const grid = await getGrid({ mnemonic: mnemonic, keypairType: keypairType as KeypairType });

      const email = await readEmail(grid!);
      setCredentials(md5(newPassword), mnemonicHash, keypairTypeHash, md5(email));
    }
  } catch (err) {
    console.log(err);
    createCustomToast(`Could not update Password due to ${err}`, ToastType.danger);
  }
}
