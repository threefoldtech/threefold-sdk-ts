import { mnemonicToMiniSecret } from "@polkadot/util-crypto";
import { validateMnemonic } from "bip39";

import { getClient } from "./client_loader";
import { log } from "./utils";

function toHexSeed(mnemonicOrHexSeed: string): string {
  if (validateMnemonic(mnemonicOrHexSeed)) {
    const seed = mnemonicToMiniSecret(mnemonicOrHexSeed);
    log("================= Creating Seed =================");

    log("0x" + Buffer.from(seed).toString("hex"));

    log("================= Seed is Done =================");

    return "0x" + Buffer.from(seed).toString("hex");
  }
  log("================= Creating Seed =================");
  const seed = mnemonicOrHexSeed.length === 64 ? mnemonicOrHexSeed : mnemonicOrHexSeed.slice(2);

  log(seed);
  log("================= Seed is Done =================");

  return "0x" + seed;
}

async function main() {
  const grid3 = await getClient();
  const mnemonic = "shock tuna wreck shop seven wing glare clock kitchen dynamic bamboo risk";
  // const hex = "d7a3ed3d4ef2c1f1605e4cea92deea99a1047e6cfea6c529bb343309cb5a3154";
  toHexSeed(mnemonic);

  // loadKeyPairOrSigner(hex);

  grid3.disconnect();
}

main();
