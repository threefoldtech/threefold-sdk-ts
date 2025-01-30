import { Expose, Type } from "class-transformer";
import { ArrayNotEmpty, IsDefined, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

import { ValidateMembers } from "../helpers";
import { WorkloadData } from "./workload_base";

class Peer {
  @Expose() @IsString() @IsNotEmpty() subnet: string;
  @Expose() @IsString() @IsNotEmpty() wireguard_public_key: string;
  @Expose() @IsString({ each: true }) @ArrayNotEmpty() allowed_ips: string[];
  @Expose() @IsString() @IsDefined() endpoint: string;

  challenge(): string {
    let out = "";
    out += this.wireguard_public_key;
    out += this.endpoint;
    out += this.subnet;

    for (let i = 0; i < this.allowed_ips.length; i++) {
      out += this.allowed_ips[i];
    }
    return out;
  }
}

class Mycelium {
  @Expose() @IsString() @IsNotEmpty() hex_key: string;
  @Expose() @IsOptional() @IsString({ each: true }) peers?: string[];
}

@ValidateMembers()
class Znet extends WorkloadData {
  @Expose() @IsString() @IsNotEmpty() subnet: string;
  @Expose() @IsString() @IsNotEmpty() ip_range: string;
  @Expose() @IsString() @IsNotEmpty() wireguard_private_key: string;
  @Expose() @IsInt() @IsNotEmpty() wireguard_listen_port: number;
  @Expose() @Type(() => Peer) @ValidateNested({ each: true }) peers: Peer[];
  @Expose() @Type(() => Mycelium) @ValidateNested() mycelium: Mycelium;

  challenge(): string {
    let out = "";
    out += this.ip_range;
    out += this.subnet;
    out += this.wireguard_private_key;
    out += this.wireguard_listen_port;

    for (let i = 0; i < this.peers.length; i++) {
      out += this.peers[i].challenge();
    }
    out += this.mycelium?.hex_key || "";
    for (let i = 0; i < this.mycelium?.peers?.length; i++) {
      out += this.mycelium?.peers[i] || "";
    }
    return out;
  }
}

export { Znet, Peer, Mycelium };
