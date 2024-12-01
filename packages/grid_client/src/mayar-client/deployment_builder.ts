import { Keyring } from "@polkadot/keyring";
import { waitReady } from "@polkadot/wasm-crypto";
import { default as md5 } from "crypto-js/md5";

import { Workload } from "../zos";

enum KeypairTypeBuilder {
  sr25519 = "sr25519",
}

class SignatureRequestBuilder {
  twin_id: number;
  required: boolean;
  weight: number;

  challenge(): string {
    let out = "";
    out += this.twin_id;
    out += this.required;
    out += this.weight;

    return out;
  }
}

class SignatureRequirementBuilder {
  requests: SignatureRequestBuilder[] = [];
  weight: number;
  signatures: SignatureBuilder[] = [];

  challenge(): string {
    let out = "";

    for (let i = 0; i < this.requests.length; i++) {
      out += this.requests[i].challenge();
    }

    out += this.weight;
    return out;
  }
}
class SignatureBuilder {
  twin_id: number;
  signature: string;
  sig_type: KeypairTypeBuilder;
}

class DeploymentBuilder {
  version: number;
  twin_id: number;
  contract_id: number;
  expiration: number;
  metadata;
  description;
  workloads: Workload[];
  sig_req: SignatureRequirementBuilder;

  challenge(): string {
    let out = "";
    out += this.version;
    out += this.twin_id;
    out += this.expiration;

    out += this.metadata;
    out += this.description;

    for (let i = 0; i < this.workloads.length; i++) {
      out += this.workloads[i].challenge();
    }

    out += this.sig_req.challenge();
    return out;
  }

  challenge_hash(): string {
    return md5(this.challenge()).toString();
  }

  from_hex(s: string) {
    const result = new Uint8Array(s.length / 2);
    for (let i = 0; i < s.length / 2; i++) {
      result[i] = parseInt(s.substr(2 * i, 2), 16);
    }
    return result;
  }
  to_hex(bs): string {
    const encoded: string[] = [];
    for (let i = 0; i < bs.length; i++) {
      encoded.push("0123456789abcdef"[(bs[i] >> 4) & 15]);
      encoded.push("0123456789abcdef"[bs[i] & 15]);
    }
    return encoded.join("");
  }

  async sign(twin_id: number, mnemonic: string, keypairType: KeypairTypeBuilder, hash = ""): Promise<void> {
    const challenged_hash = hash || this.challenge_hash();
    const hashed_bytes = this.from_hex(challenged_hash);

    const keyr = new Keyring({ type: keypairType });
    await waitReady();
    const key = keyr.addFromUri(mnemonic);
    const signed_hsh_key = key.sign(hashed_bytes);
    const hex_signed_hash = this.to_hex(signed_hsh_key);

    for (let i = 0; i < this.sig_req.signatures.length; i++) {
      if (this.sig_req.signatures[i].twin_id === twin_id) {
        this.sig_req.signatures[i].signature = hex_signed_hash;
        this.sig_req.signatures[i].sig_type = keypairType;
      }
    }
    const signature = new SignatureBuilder();
    signature.twin_id = twin_id;
    signature.signature = hex_signed_hash;
    signature.sig_type = keypairType;
    this.sig_req.signatures.push(signature);
  }
}

export {
  DeploymentBuilder,
  SignatureRequirementBuilder,
  SignatureRequestBuilder,
  SignatureBuilder,
  KeypairTypeBuilder,
};
