import { Expose, Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDefined,
  IsInt,
  IsIP,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

import { ValidateMembers } from "../helpers";
import { ComputeCapacity } from "./computecapacity";
import { WorkloadData, WorkloadDataResult } from "./workload_base";

class ZNetworkInterface {
  @Expose() @IsString() @IsNotEmpty() network: string;
  @Expose() @IsIP() @IsNotEmpty() ip: string;
}

class MyceliumIP {
  @Expose() @IsString() @IsNotEmpty() network: string;
  @Expose() @IsString() hex_seed: string;
}

class ZmachineNetwork {
  @Expose() @IsString() @IsDefined() public_ip: string;
  @Expose() @Type(() => ZNetworkInterface) @ValidateNested({ each: true }) interfaces: ZNetworkInterface[];
  @Expose() @IsBoolean() planetary: boolean;
  @Expose() @Type(() => MyceliumIP) @ValidateNested() mycelium: MyceliumIP;

  challenge(): string {
    let out = "";
    out += this.public_ip;
    out += this.planetary.toString();
    for (let i = 0; i < this.interfaces.length; i++) {
      out += this.interfaces[i].network;
      out += this.interfaces[i].ip;
    }
    out += this.mycelium?.network || "";
    out += this.mycelium?.hex_seed || "";
    return out;
  }
}

class Mount {
  @Expose() @IsString() @IsNotEmpty() name: string;
  @Expose() @IsString() @IsNotEmpty() mountpoint: string;

  challenge(): string {
    let out = "";
    out += this.name;
    out += this.mountpoint;
    return out;
  }
}

@ValidateMembers()
class Zmachine extends WorkloadData {
  @Expose() @IsString() @IsNotEmpty() @IsUrl() flist: string;
  @Expose() @Type(() => ZmachineNetwork) @ValidateNested() network: ZmachineNetwork;
  @Expose() @IsInt() @Min(0) @Max(10 * 1024 ** 4) size: number; // in bytes
  @Expose() @Type(() => ComputeCapacity) @ValidateNested() compute_capacity: ComputeCapacity;
  @Expose() @Type(() => Mount) @ValidateNested({ each: true }) mounts: Mount[];
  @Expose() @IsString() @IsDefined() entrypoint: string;
  @Expose() env: Record<string, unknown>;
  @Expose() @Transform(({ value }) => (value ? true : false)) @IsBoolean() corex: boolean;
  @Expose() @IsString({ each: true }) @IsOptional() gpu?: string[];

  challenge(): string {
    let out = "";
    out += this.flist;
    out += this.network.challenge();
    out += this.size || "0";
    out += this.compute_capacity.challenge();
    for (let i = 0; i < this.mounts.length; i++) {
      out += this.mounts[i].challenge();
    }
    out += this.entrypoint;
    for (const key of Object.keys(this.env).sort()) {
      out += key;
      out += "=";
      out += this.env[key];
      if (this.gpu) {
        for (const g of this.gpu) {
          out += g;
        }
      }
    }
    return out;
  }
}

class ZmachineResult extends WorkloadDataResult {
  @Expose() id: string;
  @Expose() ip: string;
  @Expose() ygg_ip: string;
  @Expose() planetary_ip: string;
  @Expose() mycelium_ip: string;
}

export { Zmachine, ZmachineNetwork, ZNetworkInterface, Mount, ZmachineResult, MyceliumIP };
