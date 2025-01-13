import { Expose, Transform, Type } from "class-transformer";
import { IsDefined, IsEnum, IsInt, IsNotEmpty, IsString, Min, ValidateNested } from "class-validator";

import { ValidateMembers } from "../helpers";
import { GatewayFQDNProxy, GatewayNameProxy, GatewayResult } from "./gateway";
import { PublicIPv4, PublicIPv4Result } from "./ipv4"; // TODO: remove deprecated
import { NetworkLight } from "./network_light";
import { PublicIP, PublicIPResult } from "./public_ip";
import { QuantumSafeFS, QuantumSafeFSResult } from "./qsfs";
import { Volume, VolumeResult } from "./volume";
import { WorkloadData, WorkloadDataResult } from "./workload_base";
import { Zdb, ZdbResult } from "./zdb";
import { Zlogs, ZlogsResult } from "./zlogs";
import { Zmachine, ZmachineResult } from "./zmachine";
import { ZmachineLight, ZmachineLightResult } from "./zmachine_light";
import { Zmount, ZmountResult } from "./zmount";
import { Znet } from "./znet";

enum ResultStates {
  error = "error",
  ok = "ok",
  deleted = "deleted",
}

enum WorkloadTypes {
  zmachine = "zmachine",
  zmount = "zmount",
  volume = "volume",
  network = "network",
  zdb = "zdb",
  ipv4 = "ipv4", // TODO: remove deprecated
  ip = "ip",
  gatewayfqdnproxy = "gateway-fqdn-proxy",
  gatewaynameproxy = "gateway-name-proxy",
  qsfs = "qsfs",
  zlogs = "zlogs",
  networklight = "network-light",
  zmachinelight = "zmachine-light",
}

class DeploymentResult {
  @Expose() created: number;
  @Expose() @Transform(({ value }) => ResultStates[value]) state: ResultStates;
  @Expose() message: string;
  @Expose()
  @Type(() => WorkloadDataResult, {
    discriminator: {
      property: "__type",
      subTypes: [
        { value: ZmountResult, name: WorkloadTypes.zmount },
        { value: VolumeResult, name: WorkloadTypes.volume },
        { value: WorkloadDataResult, name: WorkloadTypes.network },
        { value: ZmachineResult, name: WorkloadTypes.zmachine },
        { value: ZdbResult, name: WorkloadTypes.zdb },
        { value: PublicIPResult, name: WorkloadTypes.ip },
        { value: PublicIPv4Result, name: WorkloadTypes.ipv4 }, // TODO: remove deprecated
        { value: WorkloadDataResult, name: WorkloadTypes.gatewayfqdnproxy },
        { value: WorkloadDataResult, name: WorkloadTypes.gatewaynameproxy },
        { value: QuantumSafeFSResult, name: WorkloadTypes.qsfs },
        { value: ZlogsResult, name: WorkloadTypes.zlogs },
        { value: WorkloadDataResult, name: WorkloadTypes.networklight },
        { value: ZmachineLightResult, name: WorkloadTypes.zmachinelight },
      ],
    },
  })
  data:
    | ZmountResult
    | VolumeResult
    | ZmachineResult
    | ZdbResult
    | PublicIPResult
    | PublicIPv4Result // TODO: remove deprecated
    | QuantumSafeFSResult
    | WorkloadDataResult
    | GatewayResult
    | ZlogsResult
    | ZmachineLightResult;
}

@ValidateMembers()
class Workload {
  @Expose() @IsInt() @Min(0) version: number;
  @Expose() @IsString() @IsNotEmpty() name: string;
  @Expose()
  @Transform(({ value }) => WorkloadTypes[value.replace(/-/g, "")]) // remove the '-' from the Workloadtype's value to match the key in the reverse parsing from json to obj
  @IsEnum(WorkloadTypes)
  type: WorkloadTypes;
  @Expose()
  @ValidateNested()
  @Type(() => WorkloadData, {
    discriminator: {
      property: "__type",
      subTypes: [
        { value: Zmount, name: WorkloadTypes.zmount },
        { value: Volume, name: WorkloadTypes.volume },
        { value: Znet, name: WorkloadTypes.network },
        { value: Zmachine, name: WorkloadTypes.zmachine },
        { value: Zdb, name: WorkloadTypes.zdb },
        { value: PublicIP, name: WorkloadTypes.ip },
        { value: PublicIPv4, name: WorkloadTypes.ipv4 }, // TODO: remove deprecated
        { value: GatewayFQDNProxy, name: WorkloadTypes.gatewayfqdnproxy },
        { value: GatewayNameProxy, name: WorkloadTypes.gatewaynameproxy },
        { value: QuantumSafeFS, name: WorkloadTypes.qsfs },
        { value: Zlogs, name: WorkloadTypes.zlogs },
        { value: NetworkLight, name: WorkloadTypes.networklight },
        { value: ZmachineLight, name: WorkloadTypes.zmachinelight },
      ],
    },
  })
  // TODO: remove public IPv4 deprecated
  data:
    | Zmount
    | Volume
    | Znet
    | Zmachine
    | Zdb
    | PublicIP
    | PublicIPv4
    | GatewayFQDNProxy
    | GatewayNameProxy
    | QuantumSafeFS
    | Zlogs
    | NetworkLight
    | ZmachineLight;

  @Expose() @IsString() @IsDefined() metadata: string;
  @Expose() @IsString() @IsDefined() description: string;
  @Expose() @Type(() => DeploymentResult) result: DeploymentResult;

  challenge(): string {
    let out = "";
    out += this.version;
    out += this.name;
    out += this.type.toString();
    out += this.metadata;
    out += this.description;
    out += this.data.challenge();

    return out;
  }
}

export { Workload, WorkloadTypes, DeploymentResult, ResultStates };
