import { Expose, Type } from "class-transformer";
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

import { ValidateMembers } from "../helpers";
import { WorkloadData } from "./workload_base";

class Mycelium {
  @Expose() @IsString() @IsNotEmpty() hex_key: string;
  @Expose() @IsOptional() @IsString({ each: true }) peers?: string[];
}

@ValidateMembers()
class NetworkLight extends WorkloadData {
  @Expose() @IsString() @IsNotEmpty() subnet: string;
  @Expose() @IsOptional() @Type(() => Mycelium) @ValidateNested() mycelium?: Mycelium;

  challenge(): string {
    let out = "";
    out += this.subnet;

    out += this.mycelium?.hex_key || "";
    if (this.mycelium?.peers) {
      for (let i = 0; i < this.mycelium?.peers?.length; i++) {
        out += this.mycelium?.peers[i] || "";
      }
    }
    return out;
  }
}

export { NetworkLight };
