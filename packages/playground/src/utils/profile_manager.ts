import { GridClient } from "@threefold/grid_client";

import router from "@/router";

import { createCustomToast, ToastType } from "./custom_toast";
import { readEmail, storeEmail } from "./grid";
import SSHKeysManagement from "./ssh";

export async function handlePostLogin(grid: GridClient) {
  throw new Error("Not implemented");
  const storedEmail = await readEmail(grid!);
  if (!storedEmail) {
    createCustomToast("Email is Missing! Please enter your Email.", ToastType.warning);
    router.push({ path: "/tf-chain/your-profile" });
  }

  // Migrate the ssh-key
  const sshKeysManagement = new SSHKeysManagement();
  if (!sshKeysManagement.migrated()) {
    const newKeys = sshKeysManagement.migrate();
    await sshKeysManagement.update(newKeys);
  }
}
