import urlJoin from "url-join";

import { ILivenessChecker, ServiceStatus } from "../types";
import { ServiceBase } from "./serviceBase";
export class KYCMonitor extends ServiceBase implements ILivenessChecker {
  constructor(ServiceUrl?: string) {
    super("KYC");
    if (ServiceUrl) this.url = ServiceUrl;
  }
  async isAlive(url = this.url): Promise<ServiceStatus> {
    try {
      const res = await fetch(urlJoin(url, "/api/v1/health"));
      if (!res?.ok) throw Error(`HTTP Response Code: ${res?.status}`);
      const { status } = await res.json();
      if (status !== "Healthy") throw Error(`Status: ${status}`);
      return { alive: true };
    } catch (error) {
      return { alive: false, error };
    }
  }
}
