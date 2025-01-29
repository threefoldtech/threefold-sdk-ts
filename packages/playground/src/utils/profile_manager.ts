import type { GridClient } from "@threefold/grid_client";

import router from "@/router";

import { createCustomToast, ToastType } from "./custom_toast";
import { readEmail } from "./grid";
import SSHKeysManagement from "./ssh";

/**
 * Handles the actions to be performed after a successful login.
 *
 * - Saves the password in session storage for future use.
 * - Retrieves and checks the provided or stored email address.
 *   If neither is available, triggers a warning toast and navigates to the profile creation page.
 * - Ensures that SSH keys are migrated if not already done. If not migrated, it performs the migration and updates the SSH keys.
 *
 * @param grid - The instance of the GridClient used to interact with the grid.
 * @param password - The user's password to be stored in session storage.
 * @param email - Optional email address provided during login. If not provided, it will attempt to retrieve the stored email.
 *
 * @throws {Error} If any operation (like reading the email or updating SSH keys) fails.
 */
export async function handlePostLogin(grid: GridClient, password: string, email?: string) {
  sessionStorage.setItem("password", password);

  if (!email) {
    const storedEmail = await readEmail(grid!);
    if (!storedEmail) {
      createCustomToast("Email is Missing! Please enter your Email.", ToastType.warning);
      router.push({ path: "/tf-chain/your-profile" });
    }
  }

  // Migrate the ssh-key
  const sshKeysManagement = new SSHKeysManagement();
  if (!sshKeysManagement.migrated()) {
    const newKeys = sshKeysManagement.migrate();
    await sshKeysManagement.update(newKeys);
  }
}
