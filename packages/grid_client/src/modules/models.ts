import { ExtrinsicResult } from "@threefold/tfchain_client";
import { default as AlgoSdk } from "algosdk";
import { Expose, Transform, Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsDefined,
  IsEnum,
  IsInt,
  IsIP,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

import { IsAlphanumericExpectUnderscore } from "../helpers";
import { Deployment } from "../zos/deployment";
import { ZdbModes } from "../zos/zdb";
import { blockchainType } from "./blockchainInterface";
const NameLength = 35;
const FarmNameLength = 40;

enum ContractStates {
  Created = "Created",
  Deleted = "Deleted",
  OutOfFunds = "OutOfFunds",
  GracePeriod = "GracePeriod",
}

export enum NodeStatus {
  up = "up",
  down = "down",
  standBy = "standby",
}

//TODO: find a way to validate all fields are passed while casting data to any of these classes.
class AlgorandAccountCreateModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}
class AlgorandAccountInitModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() secret: string;
}
class AlgorandAccountAssetsFromAddressModel {
  @Expose() @IsString() @IsNotEmpty() address: string;
}

class AlgorandCreateTransactionModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() address_dest: string;
  @Expose() @IsNumber() @IsNotEmpty() amount: number;
  @Expose() @IsOptional() description: string;
}
class AlgorandTransferModel extends AlgorandCreateTransactionModel {}
class AlgorandSignatureModel {
  @Expose() @IsNotEmpty() txn: AlgoSdk.Transaction;
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}
class DiskModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @Min(0.25) size: number; // in GB
  @Expose() @IsString() @IsNotEmpty() mountpoint: string;
}

class QSFSDiskModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) qsfs_zdbs_name: string;
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() prefix: string;
  @Expose() @IsString() @IsNotEmpty() encryption_key: string;
  @Expose() @Min(0.25) @IsOptional() cache?: number; // in GB
  @Expose() @IsInt() @Min(1) @IsOptional() minimal_shards?: number;
  @Expose() @IsInt() @Min(2) @IsOptional() expected_shards?: number;
  @Expose() @IsString() @IsNotEmpty() mountpoint: string;
}

class NetworkModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() ip_range: string;
  @Expose() @IsBoolean() @IsOptional() addAccess?: boolean;
  @Expose() @IsInt() @Min(1) @IsOptional() accessNodeId?: number;
  @Expose()
  @IsOptional()
  @Type(() => MyceliumNetworkModel)
  @ValidateNested({ each: true })
  myceliumSeeds?: MyceliumNetworkModel[];
}

class MyceliumNetworkModel {
  /**
   * ### Mycelium Network Seed:
   * - The `seed` is an optional field used to provide a specific seed for the Mycelium network.
   * - If not provided, the `GridClient` will generate a seed automatically when the `mycelium` flag is enabled.
   * - **Use Case:** If you need the new machine to have the same IP address as a previously deleted machine, set the `seed` field to the old seed value.
   */
  @Expose() @IsString() @Length(32) seed?: string;
  @Expose() @IsInt() @Min(1) nodeId: number;
}

class BaseGetDeleteModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) name: string;
}

class MachineModel {
  @Expose() @IsString() @IsNotEmpty() @MaxLength(NameLength) @IsAlphanumericExpectUnderscore() name: string;
  @Expose() @IsInt() @Min(1) node_id: number;
  @Expose() @IsOptional() @Type(() => DiskModel) @ValidateNested({ each: true }) disks?: DiskModel[];
  @Expose() @IsOptional() @Type(() => QSFSDiskModel) @ValidateNested({ each: true }) qsfs_disks?: QSFSDiskModel[];
  @Expose() @IsBoolean() public_ip: boolean;
  @Expose() @IsOptional() @IsBoolean() public_ip6?: boolean;
  @Expose() @IsBoolean() planetary: boolean;
  /**
   * ### Mycelium Flag Behavior:
   * - When the `mycelium` flag is enabled, there’s no need to manually provide the `myceliumSeed` flag.
   * - The `GridClient` will automatically generate the necessary seed for you.
   * - **However**, if you have **an existing seed** from a previously deleted machine and wish to deploy a new machine that retains the same IP address,
   * - **you can simply pass in the old seed during deployment instead of calling the `generateRandomHexSeed()` function**.
   */
  @Expose() @IsBoolean() mycelium: boolean;
  /**
   * ### Mycelium Seed:
   * - The `myceliumSeed` is an optional field used to provide a specific seed for the Mycelium network.
   * - If not provided, the `GridClient` will generate a seed automatically when the `mycelium` flag is enabled.
   * - **Use Case:** If you need the new machine to have the same IP address as a previously deleted machine, set the `seed` field to the old seed value.
   */
  @Expose() @IsOptional() @IsString() @Length(6) myceliumSeed?: string;
  @Expose() @IsInt() @Min(1) cpu: number;
  @Expose() @Min(256) memory: number; // in MB
  @Expose() rootfs_size: number; // in GB
  @Expose() @IsUrl() @IsNotEmpty() flist: string;
  @Expose() @IsString() @IsDefined() entrypoint: string;
  @Expose() env: Record<string, unknown>;
  @Expose() @IsOptional() @IsIP() ip?: string;
  @Expose() @IsOptional() @IsBoolean() corex?: boolean;
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
  @Expose() @IsString() @IsOptional() zlogsOutput?: string;
  @Expose() @IsString({ each: true }) @IsOptional() gpus?: string[];
  @Expose() @IsString({ each: true }) @IsOptional() features?: string[];
}

class MachinesModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) name: string;
  @Expose() @Type(() => NetworkModel) @ValidateNested() network: NetworkModel;
  @Expose() @Type(() => MachineModel) @ValidateNested({ each: true }) machines: MachineModel[];
  @Expose() @IsString() @IsOptional() metadata?: string;
  @Expose() @IsString() @IsOptional() description?: string;
}

class AddMachineModel extends MachineModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) deployment_name: string;
  @Expose() @IsString() @IsOptional() myceliumNetworkSeed?: string;
}

class DeleteMachineModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) deployment_name: string;
}

class MachinesGetModel extends BaseGetDeleteModel {}

class MachinesDeleteModel extends BaseGetDeleteModel {}

class KubernetesNodeModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) name: string;
  @Expose() @IsInt() @Min(1) node_id: number;
  @Expose() @IsInt() @Min(1) cpu: number;
  @Expose() @Min(1024) memory: number; // in MB
  @Expose() rootfs_size: number; // in GB
  @Expose() @Min(0.25) disk_size: number; // in GB
  @Expose() @IsOptional() @Type(() => QSFSDiskModel) @ValidateNested({ each: true }) qsfs_disks?: QSFSDiskModel[];
  @Expose() @IsBoolean() public_ip: boolean;
  @Expose() @IsOptional() @IsBoolean() public_ip6: boolean;
  @Expose() @IsBoolean() planetary: boolean;
  @Expose() @IsBoolean() mycelium: boolean;
  @Expose() @IsOptional() @IsString() myceliumSeed?: string;
  @Expose() @IsOptional() @IsIP() ip?: string;
  @Expose() @IsOptional() @IsBoolean() corex?: boolean;
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
  @Expose() @IsString() @IsOptional() zlogsOutput?: string;
  @Expose() @IsString({ each: true }) @IsOptional() gpus?: string[];
}

class K8SModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() secret: string;
  @Expose() @Type(() => NetworkModel) @ValidateNested() network: NetworkModel;
  @Expose() @Type(() => KubernetesNodeModel) @ValidateNested({ each: true }) masters: KubernetesNodeModel[];
  @Expose() @Type(() => KubernetesNodeModel) @ValidateNested({ each: true }) workers?: KubernetesNodeModel[];
  @Expose() @IsString() @IsOptional() metadata?: string;
  @Expose() @IsString() @IsOptional() description?: string;
  @Expose() @IsString() @IsNotEmpty() ssh_key: string; // is not optional as if the user forget it, he will not be able to use the cluster.
}

class K8SGetModel extends BaseGetDeleteModel {}

class K8SDeleteModel extends BaseGetDeleteModel {}

class AddWorkerModel extends KubernetesNodeModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) deployment_name: string;
  @Expose() @IsString() @IsOptional() myceliumNetworkSeed?: string;
}

class DeleteWorkerModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) deployment_name: string;
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumericExpectUnderscore() @MaxLength(NameLength) name: string;
}

class ZDBModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsInt() @Min(1) node_id: number;
  @Expose() @Transform(({ value }) => ZdbModes[value]) @IsEnum(ZdbModes) mode: ZdbModes;
  @Expose() @Min(0.25) disk_size: number; // in GB
  @Expose() @IsBoolean() publicNamespace: boolean;
  @Expose() @IsString() @IsNotEmpty() password: string;
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
}

class ZDBSModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @Type(() => ZDBModel) @ValidateNested({ each: true }) zdbs: ZDBModel[];
  @Expose() @IsString() @IsOptional() metadata?: string;
  @Expose() @IsString() @IsOptional() description?: string;
}

class ZDBGetModel extends BaseGetDeleteModel {}

class ZDBDeleteModel extends BaseGetDeleteModel {}

class AddZDBModel extends ZDBModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) deployment_name: string;
}

class DeleteZDBModel extends DeleteWorkerModel {}

class QSFSZDBSModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @Min(3) count: number;
  @Expose() @ArrayNotEmpty() @IsInt({ each: true }) @Min(1, { each: true }) node_ids: number[];
  @Expose() @Min(0.25) disk_size: number;
  @Expose() @IsString() @IsNotEmpty() password: string;
  @Expose() @IsString() @IsOptional() metadata?: string;
  @Expose() @IsString() @IsOptional() description?: string;
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
}

class QSFSZDBGetModel extends BaseGetDeleteModel {}

class QSFSZDBDeleteModel extends BaseGetDeleteModel {}

class BaseGatewayNameModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}

class GatewayFQDNModel extends BaseGatewayNameModel {
  @Expose() @IsInt() @Min(1) node_id: number;
  @Expose() @IsString() @IsNotEmpty() fqdn: string;
  @Expose() @IsBoolean() tls_passthrough: boolean;
  @Expose() @IsString() @IsOptional() network?: string;
  @Expose() @IsString() @IsOptional() metadata?: string;
  @Expose() @IsString() @IsOptional() description?: string;
  @Expose() @ArrayNotEmpty() @IsUrl({ protocols: ["http", "https"] }, { each: true }) backends: string[];
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
}

class GatewayFQDNGetModel extends BaseGetDeleteModel {}

class GatewayFQDNDeleteModel extends BaseGetDeleteModel {}

class GatewayNameModel extends BaseGatewayNameModel {
  @Expose() @IsInt() @Min(1) node_id: number;
  @Expose() @IsBoolean() tls_passthrough: boolean;
  @Expose() @IsString() @IsOptional() network?: string;
  @Expose() @IsString() @IsOptional() metadata?: string;
  @Expose() @IsString() @IsOptional() description?: string;
  @Expose() @ArrayNotEmpty() @IsUrl({ protocols: ["http", "https"] }, { each: true }) backends: string[];
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
}

class GatewayNameGetModel extends BaseGatewayNameModel {}

class GatewayNameDeleteModel extends BaseGatewayNameModel {}

class ZOSModel extends Deployment {
  @Expose() @IsInt() @Min(1) node_id: number;
}

class ZOSGetDeploymentModel {
  @Expose() @IsInt() @Min(1) contractId: number;
}

class NodeContractCreateModel {
  @Expose() @IsInt() @Min(1) node_id: number;
  @Expose() @IsString() @IsNotEmpty() hash: string;
  @Expose() @IsString() @IsDefined() data: string;
  @Expose() @IsInt() @Min(0) public_ip: number;
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
}

class NameContractCreateModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}
class RentContractCreateModel {
  @Expose() @IsInt() @IsNotEmpty() nodeId: number;
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
}
class RentContractGetModel {
  @Expose() @IsInt() @IsNotEmpty() nodeId: number;
}

class NodeGetModel {
  @Expose() @IsInt() @IsNotEmpty() id: number;
}

class RentContractDeleteModel {
  @Expose() @IsInt() @IsNotEmpty() nodeId: number;
}
class ContractGetModel {
  @Expose() @IsInt() @Min(1) id: number;
}
class ContractGetByNodeIdAndHashModel {
  @Expose() @IsInt() @Min(1) node_id: number;
  @Expose() @IsString() @IsNotEmpty() hash: string;
}

class CreateServiceContractModel {
  @Expose() @IsString() @IsNotEmpty() serviceAccount: string;
  @Expose() @IsString() @IsNotEmpty() consumerAccount: string;
}

class ServiceContractApproveModel {
  @Expose() @IsInt() @Min(1) serviceId: number;
  @Expose() @IsBoolean() approve: boolean;
}

class ServiceContractBillModel {
  @Expose() @IsInt() @Min(1) serviceId: number;
  @Expose() @IsInt() @Min(1) variableAmount: number;
  @Expose() @IsString() @IsNotEmpty() metadata: string;
}

class ServiceContractCancelModel {
  @Expose() @IsInt() @Min(1) serviceId: number;
}
class SetServiceContractFeesModel {
  @Expose() @IsInt() @Min(1) serviceId: number;
  @Expose() @IsInt() @Min(1) baseFee: number;
  @Expose() @IsInt() @Min(1) variableFee: number;
}
class SetServiceContractMetadataModel {
  @Expose() @IsInt() @Min(1) serviceId: number;
  @Expose() @IsString() @IsNotEmpty() metadata: string;
}

class GetServiceContractModel {
  @Expose() @IsInt() @Min(1) serviceId: number;
}
class NameContractGetModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}

class NodeContractUpdateModel {
  @Expose() @IsInt() @Min(1) id: number;
  @Expose() @IsString() @IsNotEmpty() hash: string;
  @Expose() @IsString() @IsDefined() data: string;
}

class ContractCancelModel {
  @Expose() @IsInt() @Min(1) id: number;
}

class BatchCancelContractsModel {
  @Expose() @ArrayNotEmpty() @IsInt({ each: true }) @Min(1, { each: true }) ids: number[];
}

class ContractsByTwinId {
  @Expose() @IsInt() @Min(1) twinId: number;
}

class ContractsByAddress {
  @Expose() @IsString() @IsNotEmpty() address: string;
}

class ContractConsumption {
  @Expose() @IsInt() @Min(1) id: number;
}

class ContractLockModel extends ContractConsumption {}

class TwinCreateModel {
  @Expose() @IsString() @IsNotEmpty() relay: string;
}

class TwinGetModel {
  @Expose() @IsInt() @Min(1) id: number;
}

class TwinGetByAccountIdModel {
  @Expose() @IsString() @IsNotEmpty() public_key: string;
}

class TwinDeleteModel {
  @Expose() @IsInt() @Min(1) id: number;
}

class KVStoreSetModel {
  @Expose() @IsString() @IsNotEmpty() key: string;
  @Expose() @IsString() @IsNotEmpty() value: string;
  @Expose() @IsBoolean() @IsOptional() encrypt?: boolean;
}
class KVStoreGetModel {
  @Expose() @IsString() @IsNotEmpty() key: string;
  @Expose() @IsBoolean() @IsOptional() decrypt?: boolean;
}
class KVStoreRemoveModel {
  @Expose() @IsString() @IsNotEmpty() key: string;
}

class KVStoreBatchRemoveModel {
  @Expose() @ArrayNotEmpty() @IsString({ each: true }) keys: string[];
}
class DaoVoteModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) farmId: number;
  @Expose() @IsBoolean() approve: boolean;
  @Expose() @IsString() @IsNotEmpty() hash: string;
}
class BalanceGetModel {
  @Expose() @IsString() @IsNotEmpty() address: string;
}

class BalanceTransferModel {
  @Expose() @IsString() @IsNotEmpty() address: string;
  @Expose() @Min(0.0000001) amount: number;
}

class StellarWalletVerifyModel {
  @Expose() @IsString() @IsNotEmpty() public_key: string;
  @Expose() @IsString() @IsNotEmpty() content: string;
  @Expose() @IsString() @IsNotEmpty() signedContent: string;
}

class StellarWalletBalanceByAddressModel {
  @Expose() @IsString() @IsNotEmpty() address: string;
}

class StellarWalletTransferModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() address_dest: string;
  @Expose() @Min(0.0000001) amount: number;
  @Expose() @IsString() @IsNotEmpty() asset: string;
  @Expose() @IsString() @IsOptional() description?: string;
}

class StellarWalletCreateModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}

class StellarWalletInitModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() secret: string;
}

class TfchainWalletInitModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() secret: string;
}

class TfchainWalletBalanceByAddressModel {
  @Expose() @IsString() @IsNotEmpty() address: string;
}
class TfchainDaoVoteModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsInt() @IsNotEmpty() @Min(1) farmId: number;
  @Expose() @IsBoolean() approve: boolean;
  @Expose() @IsString() @IsNotEmpty() hash: string;
}
class TfchainWalletTransferModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() address_dest: string;
  @Expose() @Min(0.0000001) amount: number;
}

class TfchainCreateModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() relay?: string;
}

class BlockchainListResultModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() public_key: string;
  @Expose() @Transform(({ value }) => blockchainType[value]) @IsEnum(blockchainType) blockchain_type: blockchainType;
}

class BlockchainCreateResultModel extends BlockchainListResultModel {
  @Expose() @IsString() @IsNotEmpty() mnemonic?: string;
  @Expose() @IsString() @IsNotEmpty() secret?: string;
  @Expose() @IsNumber() @IsOptional() twinId?: number;
}

class BlockchainGetResultModel extends BlockchainCreateResultModel {}

class BlockchainAssetModel {
  @Expose() @IsString() @IsNotEmpty() asset: string;
  @Expose() amount: number;
}

class BlockchainAssetsModel extends BlockchainListResultModel {
  @Expose() @Type(() => BlockchainAssetModel) @ValidateNested({ each: true }) assets: BlockchainAssetModel[];
}

class BlockchainCreateModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @Transform(({ value }) => blockchainType[value]) @IsEnum(blockchainType) blockchain_type: blockchainType;
  @Expose() @IsString() @IsOptional() relay?: string;
}

class BlockchainGetModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}

class BlockchainDeleteModel extends BlockchainGetModel {}

class BlockchainListModel {
  @Expose()
  @Transform(({ value }) => blockchainType[value])
  @IsOptional()
  @IsEnum(blockchainType)
  blockchain_type?: blockchainType;
}

class BlockchainInitModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @Transform(({ value }) => blockchainType[value]) @IsEnum(blockchainType) blockchain_type: blockchainType;
  @Expose() @IsString() @IsNotEmpty() secret: string;
}

class BlockchainSignModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() content: string;
}

class BlockchainSignNoNameModel {
  @Expose() @IsString() @IsNotEmpty() content: string;
}

class BlockchainPayNoNameModel {
  @Expose()
  @Transform(({ value }) => blockchainType[value])
  @IsEnum(blockchainType)
  blockchain_type_dest: blockchainType;
  @Expose() @IsString() description: string;
  @Expose() @IsString() @IsNotEmpty() address_dest: string;
  @Expose() @Min(0.0000001) amount: number;
  @Expose() @IsString() @IsOptional() asset: string;
}

class BlockchainPayModel extends BlockchainPayNoNameModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}

class WalletMessageSignModel {
  @Expose() @IsString() @IsNotEmpty() message: string;
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
}

class FarmsGetModel {
  @Expose() @IsInt() @Min(1) @IsOptional() page?: number; // default 1
  @Expose() @IsInt() @Min(1) @IsOptional() maxResult?: number; // default 50
}

class NodesGetModel extends FarmsGetModel {}

class FarmHasFreePublicIPsModel {
  @Expose() @IsInt() @Min(1) farmId: number;
}

class NodesByFarmIdModel extends FarmHasFreePublicIPsModel {}

class ContractState {
  @Expose() @IsEnum(ContractStates, { each: true }) state: ContractStates[];
}

class NodeFreeResourcesModel {
  @Expose() @IsInt() @Min(1) nodeId: number;
}

class FarmIdFromFarmNameModel {
  @Expose() @IsString() @IsNotEmpty() farmName: string;
}

class NodeIdFromContractIdModel {
  @Expose() @IsInt() @Min(1) contractId: number;
}
class CapacityPoolCheckModel {
  @Expose() @IsInt() @Min(1) nodeId: number;
  @Expose() @IsInt({ each: true }) @Min(250 * 1024 ** 2, { each: true }) rootfsDisks: number[]; //Byte
  @Expose() @IsInt({ each: true }) @Min(250 * 1024 ** 2, { each: true }) ssdDisks: number[]; //Byte
  @Expose() @IsInt({ each: true }) @Min(250 * 1024 ** 2, { each: true }) hddDisks: number[]; //Byte
}

class PingNodeOptionsModel {
  @Expose() @IsInt() @Min(1) nodeId: number;
}
class FilterOptions {
  @Expose() @IsOptional() @Min(0) cru?: number;
  @Expose() @IsOptional() @Min(0) mru?: number; // GB
  @Expose() @IsOptional() @Min(0) sru?: number; // GB
  @Expose() @IsOptional() @Min(0) hru?: number; // GB
  @Expose() @IsOptional() @IsBoolean() publicIPs?: boolean;
  @Expose() @IsOptional() @IsBoolean() hasIPv6?: boolean;
  @Expose() @IsOptional() @IsBoolean() accessNodeV4?: boolean;
  @Expose() @IsOptional() @IsBoolean() accessNodeV6?: boolean;
  @Expose() @IsOptional() @IsBoolean() gateway?: boolean;
  @Expose() @IsOptional() @IsBoolean() certified?: boolean;
  @Expose() @IsOptional() @IsInt({ each: true }) @Min(1, { each: true }) nodeExclude?: number[];
  @Expose() @IsOptional() @IsInt({ each: true }) @Min(1, { each: true }) farmIds?: number[];
  @Expose() @IsOptional() @IsInt() @Min(1) farmId?: number;
  @Expose() @IsOptional() @IsString() farmName?: string;
  @Expose() @IsOptional() @IsString() country?: string;
  @Expose() @IsOptional() @IsString() city?: string;
  @Expose() @IsOptional() @IsBoolean() dedicated?: boolean;
  @Expose() @IsOptional() @IsInt() @Min(1) availableFor?: number;
  @Expose() @IsOptional() @IsInt() page?: number;
  @Expose() @IsOptional() @IsInt() size?: number;
  @Expose() @IsOptional() @IsBoolean() hasGPU?: boolean;
  @Expose() @IsOptional() @IsBoolean() rentable?: boolean;
  @Expose() @IsOptional() @IsInt() @Min(1) rentedBy?: number;
  @Expose() @IsOptional() @IsBoolean() randomize?: boolean;
  @Expose() @IsOptional() @IsBoolean() ret_count?: boolean;
  @Expose() @IsOptional() @Transform(({ value }) => NodeStatus[value]) @IsEnum(NodeStatus) status?: NodeStatus;
  @Expose() @IsOptional() @IsString() region?: string;
  @Expose() @IsOptional() @IsBoolean() healthy?: boolean;
  @Expose() @IsOptional() @IsBoolean() planetary?: boolean;
  @Expose() @IsOptional() @IsBoolean() mycelium?: boolean;
  @Expose() @IsOptional() @IsBoolean() wireguard?: boolean;
  @Expose() @IsOptional() @IsString() features?: string[];
}

enum CertificationType {
  NotCertified = "NotCertified",
  Silver = "Silver",
  Gold = "Gold",
}

class FarmFilterOptions {
  @Expose() @IsOptional() @Min(0) nodeCRU?: number; // Cores
  @Expose() @IsOptional() @Min(0) nodeMRU?: number; // GB
  @Expose() @IsOptional() @Min(0) nodeSRU?: number; // GB
  @Expose() @IsOptional() @Min(0) nodeHRU?: number; // GB
  @Expose() @IsOptional() @IsBoolean() publicIp?: boolean;
  @Expose() @IsOptional() @IsBoolean() nodeHasIPv6?: boolean;
  @Expose() @IsOptional() @IsBoolean() certificationType?: CertificationType;
  @Expose() @IsOptional() @IsString() farmName?: string;
  @Expose() @IsOptional() @IsString() country?: string;
  @Expose() @IsOptional() @IsBoolean() dedicated?: boolean;
  @Expose() @IsOptional() @IsBoolean() nodeCertified?: boolean;
  @Expose() @IsOptional() @IsInt() @Min(1) availableFor?: number;
  @Expose() @IsOptional() @IsBoolean() nodeHasGPU?: boolean;
  @Expose() @IsOptional() @IsInt() @Min(1) nodeRentedBy?: number;
  @Expose() @IsOptional() @IsInt() page?: number;
  @Expose() @IsOptional() @IsInt() size?: number;
  @Expose() @IsOptional() @IsInt() ownedBy?: number;
  @Expose() @IsOptional() @IsInt() farmId?: number;
  @Expose() @IsOptional() @IsBoolean() randomize?: boolean;
  @Expose() @IsOptional() @IsBoolean() ret_count?: boolean;
  @Expose() @IsOptional() @IsString() region?: string;
}

class CalculatorModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(0) cru: number; // vCores
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) mru: number; // GB
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) sru: number; // GB
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) hru: number; // GB
  @Expose() @IsBoolean() @IsNotEmpty() ipv4u: boolean;
  @Expose() @IsBoolean() @IsOptional() certified?: boolean;
  @Expose() @IsOptional() @IsNumber() @Min(0) balance?: number;
  @Expose() @IsOptional() @IsNumber() @Min(0) nu?: number;
}

class CUModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(0) cru: number; // vCores
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) mru: number; // GB
}

class SUModel {
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) hru: number; // GB
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) sru: number; // GB
}

class NUModel {
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) nu: number; // GB
}

class BatchModel<T> {
  @ArrayNotEmpty() @ValidateNested({ each: true }) extrinsics: ExtrinsicResult<T>[];
}

class ZOSNodeModel {
  @Expose() @IsInt() @Min(1) nodeId: number;
}

class NodeCPUTest {
  @Expose() @IsNotEmpty() @IsString() name: string;
  @Expose() @IsNotEmpty() @IsString() description: string;
  @Expose() @IsNotEmpty() @IsNumber() timestamp: number;
  @Expose() result: CPUBenchmark | {};
}

class NodeHealthCheck {
  @Expose() @IsArray() cache: [];
  @Expose() @IsArray() network: [];
}

class NodeIPValidation {
  @Expose() @IsNotEmpty() @IsString() name: string;
  @Expose() @IsNotEmpty() @IsString() description: string;
  @Expose() @IsNotEmpty() @IsNumber() timestamp: number;
  @Expose() result: IPValidation | {};
}

class NodeIPerf {
  @Expose() @IsNotEmpty() @IsString() name: string;
  @Expose() @IsNotEmpty() @IsString() description: string;
  @Expose() @IsNotEmpty() @IsNumber() timestamp: number;
  @Expose() result: IPerf[] | [];
}

class CPUReport {
  @Expose() @IsNotEmpty() @IsNumber() host_system: number;
  @Expose() @IsNotEmpty() @IsNumber() host_total: number;
  @Expose() @IsNotEmpty() @IsNumber() host_user: number;
  @Expose() @IsNotEmpty() @IsNumber() remote_system: number;
  @Expose() @IsNotEmpty() @IsNumber() remote_total: number;
  @Expose() @IsNotEmpty() @IsNumber() remote_user: number;
}

class IPerf {
  @Expose() @ValidateNested() cpu_report: CPUReport;
  @Expose() @IsNotEmpty() @IsNumber() download_speed: number;
  @Expose() @IsNotEmpty() @IsString() error: string;
  @Expose() @IsNotEmpty() @IsInt() node_id: number;
  @Expose() @IsNotEmpty() @IsString() node_ip: string;
  @Expose() @IsNotEmpty() @IsString() test_type: string;
  @Expose() @IsNotEmpty() @IsNumber() upload_speed: number;
}

class CPUBenchmark {
  @Expose() @IsNotEmpty() @IsNumber() multi: number;
  @Expose() @IsNotEmpty() @IsNumber() single: number;
  @Expose() @IsNotEmpty() @IsNumber() threads: number;
  @Expose() @IsNotEmpty() @IsNumber() workloads: number;
}

class IPValidation {
  @Expose() @IsNotEmpty() @IsString() reason: string;
  @Expose() @IsNotEmpty() @IsString() state: string;
}

class NodePowerModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) nodeId: number;
  @Expose() @IsBoolean() @IsNotEmpty() power: boolean;
}

class FarmIdModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) id: number;
}

class FarmPublicIPsModel {
  @Expose() @IsNotEmpty() @IsIP() ip: string;
  @Expose() @IsNotEmpty() @IsString() gw: string;
}

class AddFarmIPModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) farmId: number;
  @Expose() @IsNotEmpty() @IsString() ip: string;
  @Expose() @IsNotEmpty() @IsIP() gw: string;
}

class IPConfig {
  @Expose() @IsNotEmpty() @IsString() ip: string;
  @Expose() @IsNotEmpty() @IsIP() gw: string;
}
class PublicConfigModel {
  @Expose() @IsNotEmpty() @Type(() => IPConfig) @ValidateNested() ip4: IPConfig;
  @Expose() @IsOptional() ip6: IPConfig | null;
  @Expose() @IsOptional() @IsString() domain: string | null;
}
class AddPublicConfig {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) farmId: number;
  @Expose() @IsInt() @IsNotEmpty() @Min(1) nodeId: number;
  @Expose() @IsOptional() @Type(() => PublicConfigModel) @ValidateNested() publicConfig?: PublicConfigModel | null;
}

class RemoveFarmIPModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) farmId: number;
  @Expose() @IsNotEmpty() @IsString() ip: string;
}

class AddStellarAddressToFarmModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) farmId: number;
  @Expose() @IsString() @IsNotEmpty() stellarAddress: string;
}

class CreateFarmModel {
  @Expose() @IsString() @IsNotEmpty() @MaxLength(FarmNameLength) name: string;
  @Expose()
  @IsOptional()
  @Type(() => FarmPublicIPsModel)
  @ValidateNested({ each: true })
  publicIps?: FarmPublicIPsModel[];
}

class pingFarmModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) farmId: number;
}

class NetworkAddNodeModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() ipRange: string;
  @Expose() @IsInt() @IsNotEmpty() @Min(1) nodeId: number;
  @Expose() @IsBoolean() mycelium: boolean;
  @Expose() @IsInt() @IsOptional() solutionProviderId?: number;
  @Expose() @IsString() @IsOptional() description?: string;
  @Expose() @IsString() @IsOptional() @Length(32) myceliumSeed?: string;
}

class NetworkHasNodeModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() ipRange: string;
  @Expose() @IsInt() @IsNotEmpty() @Min(1) nodeId: number;
}

class NetworkGetModel {
  @Expose() @IsString() @IsNotEmpty() @IsAlphanumeric() @MaxLength(NameLength) name: string;
  @Expose() @IsString() @IsNotEmpty() ipRange: string;
}

class SetDedicatedNodeExtraFeesModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) nodeId: number;
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) extraFee: number;
}

class GetDedicatedNodePriceModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) nodeId: number;
}

class SwapToStellarModel {
  @Expose() @IsNotEmpty() @IsString() target: string;
  @Expose() @IsNotEmpty() @Min(1) amount: number;
}

class ListenToMintCompletedModel {
  @Expose() @IsNotEmpty() @IsString() address: string;
}

class GetActiveContractsModel {
  @Expose() @IsInt() @IsNotEmpty() @Min(1) nodeId: number;
}

class CurrencyModel {
  @Expose() @IsNumber() @IsNotEmpty() @Min(0) amount: number; // hourly amount
}

interface GPUCardInfo {
  id: string;
  contract: number;
  device: string;
  vendor: string;
}

class ZOSVersionResultModel {
  @Expose() @IsString() @IsNotEmpty() zos: string;
  @Expose() @IsString() @IsNotEmpty() zinit: string;
}

class ZOSResources {
  @Expose() @IsNumber() @IsNotEmpty() cru: number;
  @Expose() @IsNumber() @IsNotEmpty() sru: number;
  @Expose() @IsNumber() @IsNotEmpty() hru: number;
  @Expose() @IsNumber() @IsNotEmpty() mru: number;
  @Expose() @IsNumber() @IsNotEmpty() ipv4u: number;
}

class ZOSNodeStatistics {
  system: ZOSResources;
  total: ZOSResources;
  used: ZOSResources;
  users: {
    deployments: number;
    workloads: number;
    last_deployment_timestamp: number;
  };
}

class ZOSNetworkInterfaces {
  @Expose() @IsArray() ygg: string[];
  @Expose() @IsArray() zos: string[];
}

class ZOSNetworkPublicConfig {
  @Expose() @IsString() type: string;
  @Expose() @IsString() ipv4: string;
  @Expose() @IsString() ipv6: string;
  @Expose() @IsString() gw4: string;
  @Expose() @IsString() gw6: string;
  @Expose() @IsString() domain: string;
}

class ZOSStoragePools {
  @Expose() @IsString() @IsNotEmpty() name: string;
  @Expose() @IsString() @IsNotEmpty() type: string;
  @Expose() @IsNumber() size: number;
  @Expose() @IsNumber() used: number;
}

class ZOSNodePerfTestsResult {
  @Expose() iperf?: NodeIPerf;
  @Expose() publicIPValidation?: NodeIPValidation;
  @Expose() healthCheck?: NodeHealthCheck;
  @Expose() cpuBenchmark?: NodeCPUTest;
}

export {
  AlgorandAccountCreateModel,
  AlgorandAccountInitModel,
  AlgorandAccountAssetsFromAddressModel,
  AlgorandSignatureModel,
  AlgorandCreateTransactionModel,
  AlgorandTransferModel,
  DiskModel,
  DaoVoteModel,
  NetworkModel,
  MachineModel,
  MachinesModel,
  MachinesGetModel,
  MachinesDeleteModel,
  AddMachineModel,
  DeleteMachineModel,
  KubernetesNodeModel,
  K8SModel,
  K8SGetModel,
  K8SDeleteModel,
  AddWorkerModel,
  DeleteWorkerModel,
  ZDBModel,
  ZDBSModel,
  ZDBGetModel,
  ZDBDeleteModel,
  AddZDBModel,
  DeleteZDBModel,
  GatewayFQDNModel,
  GatewayNameModel,
  ZOSModel,
  QSFSDiskModel,
  QSFSZDBSModel,
  QSFSZDBGetModel,
  QSFSZDBDeleteModel,
  NodeContractCreateModel,
  NameContractCreateModel,
  RentContractCreateModel,
  RentContractGetModel,
  RentContractDeleteModel,
  ContractGetModel,
  ContractGetByNodeIdAndHashModel,
  NameContractGetModel,
  NodeContractUpdateModel,
  ContractCancelModel,
  BatchCancelContractsModel,
  ContractsByTwinId,
  ContractsByAddress,
  ContractConsumption,
  ContractLockModel,
  TwinCreateModel,
  TwinGetModel,
  TwinGetByAccountIdModel,
  TwinDeleteModel,
  KVStoreSetModel,
  KVStoreGetModel,
  KVStoreRemoveModel,
  KVStoreBatchRemoveModel,
  BalanceGetModel,
  BalanceTransferModel,
  StellarWalletCreateModel,
  StellarWalletVerifyModel,
  StellarWalletBalanceByAddressModel,
  StellarWalletTransferModel,
  StellarWalletInitModel,
  GatewayFQDNGetModel,
  GatewayFQDNDeleteModel,
  GatewayNameGetModel,
  GatewayNameDeleteModel,
  FarmsGetModel,
  NodesGetModel,
  FarmHasFreePublicIPsModel,
  NodesByFarmIdModel,
  NodeFreeResourcesModel,
  FarmIdFromFarmNameModel,
  NodeIdFromContractIdModel,
  CapacityPoolCheckModel,
  FilterOptions,
  FarmFilterOptions,
  ContractStates,
  ContractState,
  TfchainWalletInitModel,
  TfchainWalletBalanceByAddressModel,
  TfchainWalletTransferModel,
  TfchainCreateModel,
  TfchainDaoVoteModel,
  WalletMessageSignModel,
  BlockchainCreateModel,
  BlockchainCreateResultModel,
  BlockchainInitModel,
  BlockchainGetModel,
  BlockchainDeleteModel,
  BlockchainListModel,
  BlockchainListResultModel,
  BlockchainAssetModel,
  BlockchainAssetsModel,
  BlockchainSignModel,
  BlockchainSignNoNameModel,
  BlockchainPayModel,
  BlockchainPayNoNameModel,
  BlockchainGetResultModel,
  PingNodeOptionsModel,
  CalculatorModel,
  CUModel,
  SUModel,
  NUModel,
  BatchModel,
  ZOSGetDeploymentModel,
  ZOSNodeModel,
  NodePowerModel,
  FarmIdModel,
  CreateFarmModel,
  pingFarmModel,
  CreateServiceContractModel,
  ServiceContractApproveModel,
  ServiceContractBillModel,
  ServiceContractCancelModel,
  SetServiceContractFeesModel,
  SetServiceContractMetadataModel,
  GetServiceContractModel,
  NetworkAddNodeModel,
  NetworkHasNodeModel,
  NetworkGetModel,
  NodeGetModel,
  SetDedicatedNodeExtraFeesModel,
  GetDedicatedNodePriceModel,
  SwapToStellarModel,
  ListenToMintCompletedModel,
  AddFarmIPModel,
  RemoveFarmIPModel,
  AddStellarAddressToFarmModel,
  AddPublicConfig,
  GetActiveContractsModel,
  GPUCardInfo,
  MyceliumNetworkModel,
  NodeCPUTest,
  NodeIPValidation,
  NodeIPerf,
  NodeHealthCheck,
  CurrencyModel,
  ZOSVersionResultModel,
  ZOSNodeStatistics,
  ZOSNetworkInterfaces,
  ZOSNetworkPublicConfig,
  ZOSStoragePools,
  ZOSNodePerfTestsResult,
};
