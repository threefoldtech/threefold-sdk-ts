// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import "@polkadot/types/lookup";

import type {
  Bytes,
  Compact,
  Enum,
  Null,
  Option,
  Result,
  Struct,
  Text,
  U8aFixed,
  Vec,
  bool,
  u128,
  u16,
  u32,
  u64,
  u8,
} from "@polkadot/types-codec";
import type { ITuple } from "@polkadot/types-codec/types";
import type { AccountId32, Call, H256, MultiAddress } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";

declare module "@polkadot/types/lookup" {
  /** @name FrameSystemAccountInfo (3) */
  interface FrameSystemAccountInfo extends Struct {
    readonly nonce: u32;
    readonly consumers: u32;
    readonly providers: u32;
    readonly sufficients: u32;
    readonly data: PalletBalancesAccountData;
  }

  /** @name PalletBalancesAccountData (5) */
  interface PalletBalancesAccountData extends Struct {
    readonly free: u128;
    readonly reserved: u128;
    readonly frozen: u128;
    readonly flags: u128;
  }

  /** @name FrameSupportDispatchPerDispatchClassWeight (8) */
  interface FrameSupportDispatchPerDispatchClassWeight extends Struct {
    readonly normal: SpWeightsWeightV2Weight;
    readonly operational: SpWeightsWeightV2Weight;
    readonly mandatory: SpWeightsWeightV2Weight;
  }

  /** @name SpWeightsWeightV2Weight (9) */
  interface SpWeightsWeightV2Weight extends Struct {
    readonly refTime: Compact<u64>;
    readonly proofSize: Compact<u64>;
  }

  /** @name SpRuntimeDigest (14) */
  interface SpRuntimeDigest extends Struct {
    readonly logs: Vec<SpRuntimeDigestDigestItem>;
  }

  /** @name SpRuntimeDigestDigestItem (16) */
  interface SpRuntimeDigestDigestItem extends Enum {
    readonly isOther: boolean;
    readonly asOther: Bytes;
    readonly isConsensus: boolean;
    readonly asConsensus: ITuple<[U8aFixed, Bytes]>;
    readonly isSeal: boolean;
    readonly asSeal: ITuple<[U8aFixed, Bytes]>;
    readonly isPreRuntime: boolean;
    readonly asPreRuntime: ITuple<[U8aFixed, Bytes]>;
    readonly isRuntimeEnvironmentUpdated: boolean;
    readonly type: "Other" | "Consensus" | "Seal" | "PreRuntime" | "RuntimeEnvironmentUpdated";
  }

  /** @name FrameSystemEventRecord (19) */
  interface FrameSystemEventRecord extends Struct {
    readonly phase: FrameSystemPhase;
    readonly event: Event;
    readonly topics: Vec<H256>;
  }

  /** @name FrameSystemEvent (21) */
  interface FrameSystemEvent extends Enum {
    readonly isExtrinsicSuccess: boolean;
    readonly asExtrinsicSuccess: {
      readonly dispatchInfo: FrameSupportDispatchDispatchInfo;
    } & Struct;
    readonly isExtrinsicFailed: boolean;
    readonly asExtrinsicFailed: {
      readonly dispatchError: SpRuntimeDispatchError;
      readonly dispatchInfo: FrameSupportDispatchDispatchInfo;
    } & Struct;
    readonly isCodeUpdated: boolean;
    readonly isNewAccount: boolean;
    readonly asNewAccount: {
      readonly account: AccountId32;
    } & Struct;
    readonly isKilledAccount: boolean;
    readonly asKilledAccount: {
      readonly account: AccountId32;
    } & Struct;
    readonly isRemarked: boolean;
    readonly asRemarked: {
      readonly sender: AccountId32;
      readonly hash_: H256;
    } & Struct;
    readonly type: "ExtrinsicSuccess" | "ExtrinsicFailed" | "CodeUpdated" | "NewAccount" | "KilledAccount" | "Remarked";
  }

  /** @name FrameSupportDispatchDispatchInfo (22) */
  interface FrameSupportDispatchDispatchInfo extends Struct {
    readonly weight: SpWeightsWeightV2Weight;
    readonly class: FrameSupportDispatchDispatchClass;
    readonly paysFee: FrameSupportDispatchPays;
  }

  /** @name FrameSupportDispatchDispatchClass (23) */
  interface FrameSupportDispatchDispatchClass extends Enum {
    readonly isNormal: boolean;
    readonly isOperational: boolean;
    readonly isMandatory: boolean;
    readonly type: "Normal" | "Operational" | "Mandatory";
  }

  /** @name FrameSupportDispatchPays (24) */
  interface FrameSupportDispatchPays extends Enum {
    readonly isYes: boolean;
    readonly isNo: boolean;
    readonly type: "Yes" | "No";
  }

  /** @name SpRuntimeDispatchError (25) */
  interface SpRuntimeDispatchError extends Enum {
    readonly isOther: boolean;
    readonly isCannotLookup: boolean;
    readonly isBadOrigin: boolean;
    readonly isModule: boolean;
    readonly asModule: SpRuntimeModuleError;
    readonly isConsumerRemaining: boolean;
    readonly isNoProviders: boolean;
    readonly isTooManyConsumers: boolean;
    readonly isToken: boolean;
    readonly asToken: SpRuntimeTokenError;
    readonly isArithmetic: boolean;
    readonly asArithmetic: SpArithmeticArithmeticError;
    readonly isTransactional: boolean;
    readonly asTransactional: SpRuntimeTransactionalError;
    readonly isExhausted: boolean;
    readonly isCorruption: boolean;
    readonly isUnavailable: boolean;
    readonly isRootNotAllowed: boolean;
    readonly type:
      | "Other"
      | "CannotLookup"
      | "BadOrigin"
      | "Module"
      | "ConsumerRemaining"
      | "NoProviders"
      | "TooManyConsumers"
      | "Token"
      | "Arithmetic"
      | "Transactional"
      | "Exhausted"
      | "Corruption"
      | "Unavailable"
      | "RootNotAllowed";
  }

  /** @name SpRuntimeModuleError (26) */
  interface SpRuntimeModuleError extends Struct {
    readonly index: u8;
    readonly error: U8aFixed;
  }

  /** @name SpRuntimeTokenError (27) */
  interface SpRuntimeTokenError extends Enum {
    readonly isFundsUnavailable: boolean;
    readonly isOnlyProvider: boolean;
    readonly isBelowMinimum: boolean;
    readonly isCannotCreate: boolean;
    readonly isUnknownAsset: boolean;
    readonly isFrozen: boolean;
    readonly isUnsupported: boolean;
    readonly isCannotCreateHold: boolean;
    readonly isNotExpendable: boolean;
    readonly isBlocked: boolean;
    readonly type:
      | "FundsUnavailable"
      | "OnlyProvider"
      | "BelowMinimum"
      | "CannotCreate"
      | "UnknownAsset"
      | "Frozen"
      | "Unsupported"
      | "CannotCreateHold"
      | "NotExpendable"
      | "Blocked";
  }

  /** @name SpArithmeticArithmeticError (28) */
  interface SpArithmeticArithmeticError extends Enum {
    readonly isUnderflow: boolean;
    readonly isOverflow: boolean;
    readonly isDivisionByZero: boolean;
    readonly type: "Underflow" | "Overflow" | "DivisionByZero";
  }

  /** @name SpRuntimeTransactionalError (29) */
  interface SpRuntimeTransactionalError extends Enum {
    readonly isLimitReached: boolean;
    readonly isNoLayer: boolean;
    readonly type: "LimitReached" | "NoLayer";
  }

  /** @name PalletUtilityEvent (30) */
  interface PalletUtilityEvent extends Enum {
    readonly isBatchInterrupted: boolean;
    readonly asBatchInterrupted: {
      readonly index: u32;
      readonly error: SpRuntimeDispatchError;
    } & Struct;
    readonly isBatchCompleted: boolean;
    readonly isBatchCompletedWithErrors: boolean;
    readonly isItemCompleted: boolean;
    readonly isItemFailed: boolean;
    readonly asItemFailed: {
      readonly error: SpRuntimeDispatchError;
    } & Struct;
    readonly isDispatchedAs: boolean;
    readonly asDispatchedAs: {
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly type:
      | "BatchInterrupted"
      | "BatchCompleted"
      | "BatchCompletedWithErrors"
      | "ItemCompleted"
      | "ItemFailed"
      | "DispatchedAs";
  }

  /** @name PalletSchedulerEvent (33) */
  interface PalletSchedulerEvent extends Enum {
    readonly isScheduled: boolean;
    readonly asScheduled: {
      readonly when: u32;
      readonly index: u32;
    } & Struct;
    readonly isCanceled: boolean;
    readonly asCanceled: {
      readonly when: u32;
      readonly index: u32;
    } & Struct;
    readonly isDispatched: boolean;
    readonly asDispatched: {
      readonly task: ITuple<[u32, u32]>;
      readonly id: Option<U8aFixed>;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isCallUnavailable: boolean;
    readonly asCallUnavailable: {
      readonly task: ITuple<[u32, u32]>;
      readonly id: Option<U8aFixed>;
    } & Struct;
    readonly isPeriodicFailed: boolean;
    readonly asPeriodicFailed: {
      readonly task: ITuple<[u32, u32]>;
      readonly id: Option<U8aFixed>;
    } & Struct;
    readonly isPermanentlyOverweight: boolean;
    readonly asPermanentlyOverweight: {
      readonly task: ITuple<[u32, u32]>;
      readonly id: Option<U8aFixed>;
    } & Struct;
    readonly type:
      | "Scheduled"
      | "Canceled"
      | "Dispatched"
      | "CallUnavailable"
      | "PeriodicFailed"
      | "PermanentlyOverweight";
  }

  /** @name SubstrateValidatorSetEvent (36) */
  interface SubstrateValidatorSetEvent extends Enum {
    readonly isValidatorAdditionInitiated: boolean;
    readonly asValidatorAdditionInitiated: AccountId32;
    readonly isValidatorRemovalInitiated: boolean;
    readonly asValidatorRemovalInitiated: AccountId32;
    readonly type: "ValidatorAdditionInitiated" | "ValidatorRemovalInitiated";
  }

  /** @name PalletSessionEvent (37) */
  interface PalletSessionEvent extends Enum {
    readonly isNewSession: boolean;
    readonly asNewSession: {
      readonly sessionIndex: u32;
    } & Struct;
    readonly type: "NewSession";
  }

  /** @name PalletGrandpaEvent (38) */
  interface PalletGrandpaEvent extends Enum {
    readonly isNewAuthorities: boolean;
    readonly asNewAuthorities: {
      readonly authoritySet: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>;
    } & Struct;
    readonly isPaused: boolean;
    readonly isResumed: boolean;
    readonly type: "NewAuthorities" | "Paused" | "Resumed";
  }

  /** @name SpConsensusGrandpaAppPublic (41) */
  interface SpConsensusGrandpaAppPublic extends SpCoreEd25519Public {}

  /** @name SpCoreEd25519Public (42) */
  interface SpCoreEd25519Public extends U8aFixed {}

  /** @name PalletBalancesEvent (43) */
  interface PalletBalancesEvent extends Enum {
    readonly isEndowed: boolean;
    readonly asEndowed: {
      readonly account: AccountId32;
      readonly freeBalance: u128;
    } & Struct;
    readonly isDustLost: boolean;
    readonly asDustLost: {
      readonly account: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isBalanceSet: boolean;
    readonly asBalanceSet: {
      readonly who: AccountId32;
      readonly free: u128;
    } & Struct;
    readonly isReserved: boolean;
    readonly asReserved: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUnreserved: boolean;
    readonly asUnreserved: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isReserveRepatriated: boolean;
    readonly asReserveRepatriated: {
      readonly from: AccountId32;
      readonly to: AccountId32;
      readonly amount: u128;
      readonly destinationStatus: FrameSupportTokensMiscBalanceStatus;
    } & Struct;
    readonly isDeposit: boolean;
    readonly asDeposit: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isWithdraw: boolean;
    readonly asWithdraw: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isSlashed: boolean;
    readonly asSlashed: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isMinted: boolean;
    readonly asMinted: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isBurned: boolean;
    readonly asBurned: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isSuspended: boolean;
    readonly asSuspended: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isRestored: boolean;
    readonly asRestored: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUpgraded: boolean;
    readonly asUpgraded: {
      readonly who: AccountId32;
    } & Struct;
    readonly isIssued: boolean;
    readonly asIssued: {
      readonly amount: u128;
    } & Struct;
    readonly isRescinded: boolean;
    readonly asRescinded: {
      readonly amount: u128;
    } & Struct;
    readonly isLocked: boolean;
    readonly asLocked: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isUnlocked: boolean;
    readonly asUnlocked: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isFrozen: boolean;
    readonly asFrozen: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly isThawed: boolean;
    readonly asThawed: {
      readonly who: AccountId32;
      readonly amount: u128;
    } & Struct;
    readonly type:
      | "Endowed"
      | "DustLost"
      | "Transfer"
      | "BalanceSet"
      | "Reserved"
      | "Unreserved"
      | "ReserveRepatriated"
      | "Deposit"
      | "Withdraw"
      | "Slashed"
      | "Minted"
      | "Burned"
      | "Suspended"
      | "Restored"
      | "Upgraded"
      | "Issued"
      | "Rescinded"
      | "Locked"
      | "Unlocked"
      | "Frozen"
      | "Thawed";
  }

  /** @name FrameSupportTokensMiscBalanceStatus (44) */
  interface FrameSupportTokensMiscBalanceStatus extends Enum {
    readonly isFree: boolean;
    readonly isReserved: boolean;
    readonly type: "Free" | "Reserved";
  }

  /** @name PalletTransactionPaymentEvent (45) */
  interface PalletTransactionPaymentEvent extends Enum {
    readonly isTransactionFeePaid: boolean;
    readonly asTransactionFeePaid: {
      readonly who: AccountId32;
      readonly actualFee: u128;
      readonly tip: u128;
    } & Struct;
    readonly type: "TransactionFeePaid";
  }

  /** @name PalletTfgridEvent (46) */
  interface PalletTfgridEvent extends Enum {
    readonly isFarmStored: boolean;
    readonly asFarmStored: TfchainSupportFarm;
    readonly isFarmUpdated: boolean;
    readonly asFarmUpdated: TfchainSupportFarm;
    readonly isFarmDeleted: boolean;
    readonly asFarmDeleted: u32;
    readonly isNodeStored: boolean;
    readonly asNodeStored: TfchainSupportNode;
    readonly isNodeUpdated: boolean;
    readonly asNodeUpdated: TfchainSupportNode;
    readonly isNodeDeleted: boolean;
    readonly asNodeDeleted: u32;
    readonly isNodeUptimeReported: boolean;
    readonly asNodeUptimeReported: ITuple<[u32, u64, u64]>;
    readonly isNodePublicConfigStored: boolean;
    readonly asNodePublicConfigStored: ITuple<[u32, Option<TfchainSupportPublicConfig>]>;
    readonly isEntityStored: boolean;
    readonly asEntityStored: PalletTfgridEntity;
    readonly isEntityUpdated: boolean;
    readonly asEntityUpdated: PalletTfgridEntity;
    readonly isEntityDeleted: boolean;
    readonly asEntityDeleted: u32;
    readonly isTwinStored: boolean;
    readonly asTwinStored: PalletTfgridTwin;
    readonly isTwinUpdated: boolean;
    readonly asTwinUpdated: PalletTfgridTwin;
    readonly isTwinEntityStored: boolean;
    readonly asTwinEntityStored: ITuple<[u32, u32, Bytes]>;
    readonly isTwinEntityRemoved: boolean;
    readonly asTwinEntityRemoved: ITuple<[u32, u32]>;
    readonly isTwinDeleted: boolean;
    readonly asTwinDeleted: u32;
    readonly isTwinAccountBounded: boolean;
    readonly asTwinAccountBounded: ITuple<[u32, AccountId32]>;
    readonly isPricingPolicyStored: boolean;
    readonly asPricingPolicyStored: PalletTfgridPricingPolicy;
    readonly isFarmingPolicyStored: boolean;
    readonly asFarmingPolicyStored: PalletTfgridFarmingPolicy;
    readonly isFarmPayoutV2AddressRegistered: boolean;
    readonly asFarmPayoutV2AddressRegistered: ITuple<[u32, Bytes]>;
    readonly isFarmMarkedAsDedicated: boolean;
    readonly asFarmMarkedAsDedicated: u32;
    readonly isConnectionPriceSet: boolean;
    readonly asConnectionPriceSet: u32;
    readonly isNodeCertificationSet: boolean;
    readonly asNodeCertificationSet: ITuple<[u32, TfchainSupportNodeCertification]>;
    readonly isNodeCertifierAdded: boolean;
    readonly asNodeCertifierAdded: AccountId32;
    readonly isNodeCertifierRemoved: boolean;
    readonly asNodeCertifierRemoved: AccountId32;
    readonly isFarmingPolicyUpdated: boolean;
    readonly asFarmingPolicyUpdated: PalletTfgridFarmingPolicy;
    readonly isFarmingPolicySet: boolean;
    readonly asFarmingPolicySet: ITuple<[u32, Option<TfchainSupportFarmingPolicyLimit>]>;
    readonly isFarmCertificationSet: boolean;
    readonly asFarmCertificationSet: ITuple<[u32, TfchainSupportFarmCertification]>;
    readonly isZosVersionUpdated: boolean;
    readonly asZosVersionUpdated: Bytes;
    readonly isPowerTargetChanged: boolean;
    readonly asPowerTargetChanged: {
      readonly farmId: u32;
      readonly nodeId: u32;
      readonly powerTarget: TfchainSupportPower;
    } & Struct;
    readonly isPowerStateChanged: boolean;
    readonly asPowerStateChanged: {
      readonly farmId: u32;
      readonly nodeId: u32;
      readonly powerState: TfchainSupportPowerState;
    } & Struct;
    readonly type:
      | "FarmStored"
      | "FarmUpdated"
      | "FarmDeleted"
      | "NodeStored"
      | "NodeUpdated"
      | "NodeDeleted"
      | "NodeUptimeReported"
      | "NodePublicConfigStored"
      | "EntityStored"
      | "EntityUpdated"
      | "EntityDeleted"
      | "TwinStored"
      | "TwinUpdated"
      | "TwinEntityStored"
      | "TwinEntityRemoved"
      | "TwinDeleted"
      | "TwinAccountBounded"
      | "PricingPolicyStored"
      | "FarmingPolicyStored"
      | "FarmPayoutV2AddressRegistered"
      | "FarmMarkedAsDedicated"
      | "ConnectionPriceSet"
      | "NodeCertificationSet"
      | "NodeCertifierAdded"
      | "NodeCertifierRemoved"
      | "FarmingPolicyUpdated"
      | "FarmingPolicySet"
      | "FarmCertificationSet"
      | "ZosVersionUpdated"
      | "PowerTargetChanged"
      | "PowerStateChanged";
  }

  /** @name TfchainSupportFarm (47) */
  interface TfchainSupportFarm extends Struct {
    readonly version: u32;
    readonly id: u32;
    readonly name: Bytes;
    readonly twinId: u32;
    readonly pricingPolicyId: u32;
    readonly certification: TfchainSupportFarmCertification;
    readonly publicIps: Vec<TfchainSupportPublicIP>;
    readonly dedicatedFarm: bool;
    readonly farmingPolicyLimits: Option<TfchainSupportFarmingPolicyLimit>;
  }

  /** @name TfchainSupportFarmCertification (50) */
  interface TfchainSupportFarmCertification extends Enum {
    readonly isNotCertified: boolean;
    readonly isGold: boolean;
    readonly type: "NotCertified" | "Gold";
  }

  /** @name TfchainSupportPublicIP (52) */
  interface TfchainSupportPublicIP extends Struct {
    readonly ip: Bytes;
    readonly gateway: Bytes;
    readonly contractId: u64;
  }

  /** @name TfchainSupportFarmingPolicyLimit (58) */
  interface TfchainSupportFarmingPolicyLimit extends Struct {
    readonly farmingPolicyId: u32;
    readonly cu: Option<u64>;
    readonly su: Option<u64>;
    readonly end: Option<u64>;
    readonly nodeCount: Option<u32>;
    readonly nodeCertification: bool;
  }

  /** @name TfchainSupportNode (61) */
  interface TfchainSupportNode extends Struct {
    readonly version: u32;
    readonly id: u32;
    readonly farmId: u32;
    readonly twinId: u32;
    readonly resources: TfchainSupportResources;
    readonly location: PalletTfgridNodeLocation;
    readonly publicConfig: Option<TfchainSupportPublicConfig>;
    readonly created: u64;
    readonly farmingPolicyId: u32;
    readonly interfaces: Vec<TfchainSupportInterfaceInterfaceName>;
    readonly certification: TfchainSupportNodeCertification;
    readonly secureBoot: bool;
    readonly virtualized: bool;
    readonly serialNumber: Option<Bytes>;
    readonly connectionPrice: u32;
  }

  /** @name PalletTfgridNodeLocation (62) */
  interface PalletTfgridNodeLocation extends Struct {
    readonly city: Bytes;
    readonly country: Bytes;
    readonly latitude: Bytes;
    readonly longitude: Bytes;
  }

  /** @name TfchainSupportInterfaceInterfaceName (68) */
  interface TfchainSupportInterfaceInterfaceName extends Struct {
    readonly name: Bytes;
    readonly mac: Bytes;
    readonly ips: Vec<Bytes>;
  }

  /** @name TfchainSupportResources (79) */
  interface TfchainSupportResources extends Struct {
    readonly hru: u64;
    readonly sru: u64;
    readonly cru: u64;
    readonly mru: u64;
  }

  /** @name TfchainSupportPublicConfig (81) */
  interface TfchainSupportPublicConfig extends Struct {
    readonly ip4: TfchainSupportIp4;
    readonly ip6: Option<TfchainSupportIp6>;
    readonly domain: Option<Bytes>;
  }

  /** @name TfchainSupportIp4 (82) */
  interface TfchainSupportIp4 extends Struct {
    readonly ip: Bytes;
    readonly gw: Bytes;
  }

  /** @name TfchainSupportIp6 (84) */
  interface TfchainSupportIp6 extends Struct {
    readonly ip: Bytes;
    readonly gw: Bytes;
  }

  /** @name TfchainSupportNodeCertification (89) */
  interface TfchainSupportNodeCertification extends Enum {
    readonly isDiy: boolean;
    readonly isCertified: boolean;
    readonly type: "Diy" | "Certified";
  }

  /** @name PalletTfgridEntity (91) */
  interface PalletTfgridEntity extends Struct {
    readonly version: u32;
    readonly id: u32;
    readonly name: Bytes;
    readonly accountId: AccountId32;
    readonly country: Bytes;
    readonly city: Bytes;
  }

  /** @name PalletTfgridTwin (92) */
  interface PalletTfgridTwin extends Struct {
    readonly id: u32;
    readonly accountId: AccountId32;
    readonly relay: Option<Bytes>;
    readonly entities: Vec<PalletTfgridEntityProof>;
    readonly pk: Option<Bytes>;
  }

  /** @name PalletTfgridEntityProof (96) */
  interface PalletTfgridEntityProof extends Struct {
    readonly entityId: u32;
    readonly signature: Bytes;
  }

  /** @name PalletTfgridPricingPolicy (97) */
  interface PalletTfgridPricingPolicy extends Struct {
    readonly version: u32;
    readonly id: u32;
    readonly name: Bytes;
    readonly su: PalletTfgridPolicy;
    readonly cu: PalletTfgridPolicy;
    readonly nu: PalletTfgridPolicy;
    readonly ipu: PalletTfgridPolicy;
    readonly uniqueName: PalletTfgridPolicy;
    readonly domainName: PalletTfgridPolicy;
    readonly foundationAccount: AccountId32;
    readonly certifiedSalesAccount: AccountId32;
    readonly discountForDedicationNodes: u8;
  }

  /** @name PalletTfgridPolicy (98) */
  interface PalletTfgridPolicy extends Struct {
    readonly value: u32;
    readonly unit: PalletTfgridUnit;
  }

  /** @name PalletTfgridUnit (99) */
  interface PalletTfgridUnit extends Enum {
    readonly isBytes: boolean;
    readonly isKilobytes: boolean;
    readonly isMegabytes: boolean;
    readonly isGigabytes: boolean;
    readonly isTerrabytes: boolean;
    readonly type: "Bytes" | "Kilobytes" | "Megabytes" | "Gigabytes" | "Terrabytes";
  }

  /** @name PalletTfgridFarmingPolicy (100) */
  interface PalletTfgridFarmingPolicy extends Struct {
    readonly version: u32;
    readonly id: u32;
    readonly name: Bytes;
    readonly cu: u32;
    readonly su: u32;
    readonly nu: u32;
    readonly ipv4: u32;
    readonly minimalUptime: u16;
    readonly policyCreated: u32;
    readonly policyEnd: u32;
    readonly immutable: bool;
    readonly default: bool;
    readonly nodeCertification: TfchainSupportNodeCertification;
    readonly farmCertification: TfchainSupportFarmCertification;
  }

  /** @name TfchainSupportPower (102) */
  interface TfchainSupportPower extends Enum {
    readonly isUp: boolean;
    readonly isDown: boolean;
    readonly type: "Up" | "Down";
  }

  /** @name TfchainSupportPowerState (103) */
  interface TfchainSupportPowerState extends Enum {
    readonly isUp: boolean;
    readonly isDown: boolean;
    readonly asDown: u32;
    readonly type: "Up" | "Down";
  }

  /** @name PalletSmartContractEvent (104) */
  interface PalletSmartContractEvent extends Enum {
    readonly isContractCreated: boolean;
    readonly asContractCreated: PalletSmartContractContract;
    readonly isContractUpdated: boolean;
    readonly asContractUpdated: PalletSmartContractContract;
    readonly isNodeContractCanceled: boolean;
    readonly asNodeContractCanceled: {
      readonly contractId: u64;
      readonly nodeId: u32;
      readonly twinId: u32;
    } & Struct;
    readonly isNameContractCanceled: boolean;
    readonly asNameContractCanceled: {
      readonly contractId: u64;
    } & Struct;
    readonly isIPsReserved: boolean;
    readonly asIPsReserved: {
      readonly contractId: u64;
      readonly publicIps: Vec<TfchainSupportPublicIP>;
    } & Struct;
    readonly isIPsFreed: boolean;
    readonly asIPsFreed: {
      readonly contractId: u64;
      readonly publicIps: Vec<TfchainSupportPublicIP>;
    } & Struct;
    readonly isContractDeployed: boolean;
    readonly asContractDeployed: ITuple<[u64, AccountId32]>;
    readonly isConsumptionReportReceived: boolean;
    readonly asConsumptionReportReceived: PalletSmartContractConsumption;
    readonly isContractBilled: boolean;
    readonly asContractBilled: PalletSmartContractContractBill;
    readonly isTokensBurned: boolean;
    readonly asTokensBurned: {
      readonly contractId: u64;
      readonly amount: u128;
    } & Struct;
    readonly isUpdatedUsedResources: boolean;
    readonly asUpdatedUsedResources: PalletSmartContractContractResources;
    readonly isNruConsumptionReportReceived: boolean;
    readonly asNruConsumptionReportReceived: PalletSmartContractNruConsumption;
    readonly isRentContractCanceled: boolean;
    readonly asRentContractCanceled: {
      readonly contractId: u64;
    } & Struct;
    readonly isContractGracePeriodStarted: boolean;
    readonly asContractGracePeriodStarted: {
      readonly contractId: u64;
      readonly nodeId: u32;
      readonly twinId: u32;
      readonly blockNumber: u64;
    } & Struct;
    readonly isContractGracePeriodEnded: boolean;
    readonly asContractGracePeriodEnded: {
      readonly contractId: u64;
      readonly nodeId: u32;
      readonly twinId: u32;
    } & Struct;
    readonly isSolutionProviderCreated: boolean;
    readonly asSolutionProviderCreated: PalletSmartContractSolutionProvider;
    readonly isSolutionProviderApproved: boolean;
    readonly asSolutionProviderApproved: ITuple<[u64, bool]>;
    readonly isServiceContractCreated: boolean;
    readonly asServiceContractCreated: PalletSmartContractServiceContract;
    readonly isServiceContractMetadataSet: boolean;
    readonly asServiceContractMetadataSet: PalletSmartContractServiceContract;
    readonly isServiceContractFeesSet: boolean;
    readonly asServiceContractFeesSet: PalletSmartContractServiceContract;
    readonly isServiceContractApproved: boolean;
    readonly asServiceContractApproved: PalletSmartContractServiceContract;
    readonly isServiceContractCanceled: boolean;
    readonly asServiceContractCanceled: {
      readonly serviceContractId: u64;
      readonly cause: PalletSmartContractCause;
    } & Struct;
    readonly isServiceContractBilled: boolean;
    readonly asServiceContractBilled: {
      readonly serviceContract: PalletSmartContractServiceContract;
      readonly bill: PalletSmartContractServiceContractBill;
      readonly amount: u128;
    } & Struct;
    readonly isBillingFrequencyChanged: boolean;
    readonly asBillingFrequencyChanged: u64;
    readonly isNodeExtraFeeSet: boolean;
    readonly asNodeExtraFeeSet: {
      readonly nodeId: u32;
      readonly extraFee: u64;
    } & Struct;
    readonly isRentWaived: boolean;
    readonly asRentWaived: {
      readonly contractId: u64;
    } & Struct;
    readonly isContractGracePeriodElapsed: boolean;
    readonly asContractGracePeriodElapsed: {
      readonly contractId: u64;
      readonly gracePeriod: u64;
    } & Struct;
    readonly isContractPaymentOverdrawn: boolean;
    readonly asContractPaymentOverdrawn: {
      readonly contractId: u64;
      readonly timestamp: u64;
      readonly partiallyBilledAmount: u128;
      readonly overdraft: u128;
    } & Struct;
    readonly isRewardDistributed: boolean;
    readonly asRewardDistributed: {
      readonly contractId: u64;
      readonly standardRewards: u128;
      readonly additionalRewards: u128;
    } & Struct;
    readonly type:
      | "ContractCreated"
      | "ContractUpdated"
      | "NodeContractCanceled"
      | "NameContractCanceled"
      | "IPsReserved"
      | "IPsFreed"
      | "ContractDeployed"
      | "ConsumptionReportReceived"
      | "ContractBilled"
      | "TokensBurned"
      | "UpdatedUsedResources"
      | "NruConsumptionReportReceived"
      | "RentContractCanceled"
      | "ContractGracePeriodStarted"
      | "ContractGracePeriodEnded"
      | "SolutionProviderCreated"
      | "SolutionProviderApproved"
      | "ServiceContractCreated"
      | "ServiceContractMetadataSet"
      | "ServiceContractFeesSet"
      | "ServiceContractApproved"
      | "ServiceContractCanceled"
      | "ServiceContractBilled"
      | "BillingFrequencyChanged"
      | "NodeExtraFeeSet"
      | "RentWaived"
      | "ContractGracePeriodElapsed"
      | "ContractPaymentOverdrawn"
      | "RewardDistributed";
  }

  /** @name PalletSmartContractContract (105) */
  interface PalletSmartContractContract extends Struct {
    readonly version: u32;
    readonly state: PalletSmartContractContractState;
    readonly contractId: u64;
    readonly twinId: u32;
    readonly contractType: PalletSmartContractContractData;
    readonly solutionProviderId: Option<u64>;
  }

  /** @name PalletSmartContractContractState (106) */
  interface PalletSmartContractContractState extends Enum {
    readonly isCreated: boolean;
    readonly isDeleted: boolean;
    readonly asDeleted: PalletSmartContractCause;
    readonly isGracePeriod: boolean;
    readonly asGracePeriod: u64;
    readonly type: "Created" | "Deleted" | "GracePeriod";
  }

  /** @name PalletSmartContractCause (107) */
  interface PalletSmartContractCause extends Enum {
    readonly isCanceledByUser: boolean;
    readonly isOutOfFunds: boolean;
    readonly isCanceledByCollective: boolean;
    readonly type: "CanceledByUser" | "OutOfFunds" | "CanceledByCollective";
  }

  /** @name PalletSmartContractContractData (108) */
  interface PalletSmartContractContractData extends Enum {
    readonly isNodeContract: boolean;
    readonly asNodeContract: PalletSmartContractNodeContract;
    readonly isNameContract: boolean;
    readonly asNameContract: PalletSmartContractNameContract;
    readonly isRentContract: boolean;
    readonly asRentContract: PalletSmartContractRentContract;
    readonly type: "NodeContract" | "NameContract" | "RentContract";
  }

  /** @name PalletSmartContractNodeContract (109) */
  interface PalletSmartContractNodeContract extends Struct {
    readonly nodeId: u32;
    readonly deploymentHash: U8aFixed;
    readonly deploymentData: Bytes;
    readonly publicIps: u32;
    readonly publicIpsList: Vec<TfchainSupportPublicIP>;
  }

  /** @name PalletSmartContractNameContract (112) */
  interface PalletSmartContractNameContract extends Struct {
    readonly name: Bytes;
  }

  /** @name PalletSmartContractRentContract (115) */
  interface PalletSmartContractRentContract extends Struct {
    readonly nodeId: u32;
  }

  /** @name PalletSmartContractConsumption (116) */
  interface PalletSmartContractConsumption extends Struct {
    readonly contractId: u64;
    readonly timestamp: u64;
    readonly cru: u64;
    readonly sru: u64;
    readonly hru: u64;
    readonly mru: u64;
    readonly nru: u64;
  }

  /** @name PalletSmartContractContractBill (117) */
  interface PalletSmartContractContractBill extends Struct {
    readonly contractId: u64;
    readonly timestamp: u64;
    readonly discountLevel: PalletSmartContractDiscountLevel;
    readonly amountBilled: u128;
  }

  /** @name PalletSmartContractDiscountLevel (118) */
  interface PalletSmartContractDiscountLevel extends Enum {
    readonly isNone: boolean;
    readonly isDefault: boolean;
    readonly isBronze: boolean;
    readonly isSilver: boolean;
    readonly isGold: boolean;
    readonly type: "None" | "Default" | "Bronze" | "Silver" | "Gold";
  }

  /** @name PalletSmartContractContractResources (119) */
  interface PalletSmartContractContractResources extends Struct {
    readonly contractId: u64;
    readonly used: TfchainSupportResources;
  }

  /** @name PalletSmartContractNruConsumption (120) */
  interface PalletSmartContractNruConsumption extends Struct {
    readonly contractId: u64;
    readonly timestamp: u64;
    readonly window: u64;
    readonly nru: u64;
  }

  /** @name PalletSmartContractSolutionProvider (121) */
  interface PalletSmartContractSolutionProvider extends Struct {
    readonly solutionProviderId: u64;
    readonly providers: Vec<PalletSmartContractProvider>;
    readonly description: Bytes;
    readonly link: Bytes;
    readonly approved: bool;
  }

  /** @name PalletSmartContractProvider (123) */
  interface PalletSmartContractProvider extends Struct {
    readonly who: AccountId32;
    readonly take: u8;
  }

  /** @name PalletSmartContractServiceContract (124) */
  interface PalletSmartContractServiceContract extends Struct {
    readonly serviceContractId: u64;
    readonly serviceTwinId: u32;
    readonly consumerTwinId: u32;
    readonly baseFee: u64;
    readonly variableFee: u64;
    readonly metadata: Bytes;
    readonly acceptedByService: bool;
    readonly acceptedByConsumer: bool;
    readonly lastBill: u64;
    readonly state: PalletSmartContractServiceContractState;
  }

  /** @name PalletSmartContractServiceContractState (126) */
  interface PalletSmartContractServiceContractState extends Enum {
    readonly isCreated: boolean;
    readonly isAgreementReady: boolean;
    readonly isApprovedByBoth: boolean;
    readonly type: "Created" | "AgreementReady" | "ApprovedByBoth";
  }

  /** @name PalletSmartContractServiceContractBill (127) */
  interface PalletSmartContractServiceContractBill extends Struct {
    readonly variableAmount: u64;
    readonly window: u64;
    readonly metadata: Bytes;
  }

  /** @name PalletTftBridgeEvent (128) */
  interface PalletTftBridgeEvent extends Enum {
    readonly isMintTransactionProposed: boolean;
    readonly asMintTransactionProposed: ITuple<[Bytes, AccountId32, u64]>;
    readonly isMintTransactionVoted: boolean;
    readonly asMintTransactionVoted: Bytes;
    readonly isMintCompleted: boolean;
    readonly asMintCompleted: ITuple<[PalletTftBridgeMintTransaction, Bytes]>;
    readonly isMintTransactionExpired: boolean;
    readonly asMintTransactionExpired: ITuple<[Bytes, u64, AccountId32]>;
    readonly isBurnTransactionCreated: boolean;
    readonly asBurnTransactionCreated: ITuple<[u64, AccountId32, Bytes, u64]>;
    readonly isBurnTransactionProposed: boolean;
    readonly asBurnTransactionProposed: ITuple<[u64, Bytes, u64]>;
    readonly isBurnTransactionSignatureAdded: boolean;
    readonly asBurnTransactionSignatureAdded: ITuple<[u64, PalletTftBridgeStellarSignature]>;
    readonly isBurnTransactionReady: boolean;
    readonly asBurnTransactionReady: u64;
    readonly isBurnTransactionProcessed: boolean;
    readonly asBurnTransactionProcessed: PalletTftBridgeBurnTransaction;
    readonly isBurnTransactionExpired: boolean;
    readonly asBurnTransactionExpired: ITuple<[u64, Option<AccountId32>, Bytes, u64]>;
    readonly isRefundTransactionCreated: boolean;
    readonly asRefundTransactionCreated: ITuple<[Bytes, Bytes, u64]>;
    readonly isRefundTransactionsignatureAdded: boolean;
    readonly asRefundTransactionsignatureAdded: ITuple<[Bytes, PalletTftBridgeStellarSignature]>;
    readonly isRefundTransactionReady: boolean;
    readonly asRefundTransactionReady: Bytes;
    readonly isRefundTransactionProcessed: boolean;
    readonly asRefundTransactionProcessed: PalletTftBridgeRefundTransaction;
    readonly isRefundTransactionExpired: boolean;
    readonly asRefundTransactionExpired: ITuple<[Bytes, Bytes, u64]>;
    readonly type:
      | "MintTransactionProposed"
      | "MintTransactionVoted"
      | "MintCompleted"
      | "MintTransactionExpired"
      | "BurnTransactionCreated"
      | "BurnTransactionProposed"
      | "BurnTransactionSignatureAdded"
      | "BurnTransactionReady"
      | "BurnTransactionProcessed"
      | "BurnTransactionExpired"
      | "RefundTransactionCreated"
      | "RefundTransactionsignatureAdded"
      | "RefundTransactionReady"
      | "RefundTransactionProcessed"
      | "RefundTransactionExpired";
  }

  /** @name PalletTftBridgeMintTransaction (129) */
  interface PalletTftBridgeMintTransaction extends Struct {
    readonly amount: u64;
    readonly target: AccountId32;
    readonly block: u32;
    readonly votes: u32;
  }

  /** @name PalletTftBridgeStellarSignature (130) */
  interface PalletTftBridgeStellarSignature extends Struct {
    readonly signature: Bytes;
    readonly stellarPubKey: Bytes;
  }

  /** @name PalletTftBridgeBurnTransaction (131) */
  interface PalletTftBridgeBurnTransaction extends Struct {
    readonly block: u32;
    readonly amount: u64;
    readonly source: Option<AccountId32>;
    readonly target: Bytes;
    readonly signatures: Vec<PalletTftBridgeStellarSignature>;
    readonly sequenceNumber: u64;
  }

  /** @name PalletTftBridgeRefundTransaction (134) */
  interface PalletTftBridgeRefundTransaction extends Struct {
    readonly block: u32;
    readonly amount: u64;
    readonly target: Bytes;
    readonly txHash: Bytes;
    readonly signatures: Vec<PalletTftBridgeStellarSignature>;
    readonly sequenceNumber: u64;
  }

  /** @name PalletTftPriceEvent (135) */
  interface PalletTftPriceEvent extends Enum {
    readonly isPriceStored: boolean;
    readonly asPriceStored: u32;
    readonly isOffchainWorkerExecuted: boolean;
    readonly asOffchainWorkerExecuted: AccountId32;
    readonly isAveragePriceStored: boolean;
    readonly asAveragePriceStored: u32;
    readonly isAveragePriceIsAboveMaxPrice: boolean;
    readonly asAveragePriceIsAboveMaxPrice: ITuple<[u32, u32]>;
    readonly isAveragePriceIsBelowMinPrice: boolean;
    readonly asAveragePriceIsBelowMinPrice: ITuple<[u32, u32]>;
    readonly type:
      | "PriceStored"
      | "OffchainWorkerExecuted"
      | "AveragePriceStored"
      | "AveragePriceIsAboveMaxPrice"
      | "AveragePriceIsBelowMinPrice";
  }

  /** @name PalletBurningEvent (136) */
  interface PalletBurningEvent extends Enum {
    readonly isBurnTransactionCreated: boolean;
    readonly asBurnTransactionCreated: ITuple<[AccountId32, u128, u32, Bytes]>;
    readonly type: "BurnTransactionCreated";
  }

  /** @name PalletKvstoreEvent (137) */
  interface PalletKvstoreEvent extends Enum {
    readonly isEntrySet: boolean;
    readonly asEntrySet: ITuple<[AccountId32, Bytes, Bytes]>;
    readonly isEntryGot: boolean;
    readonly asEntryGot: ITuple<[AccountId32, Bytes, Bytes]>;
    readonly isEntryTaken: boolean;
    readonly asEntryTaken: ITuple<[AccountId32, Bytes, Bytes]>;
    readonly type: "EntrySet" | "EntryGot" | "EntryTaken";
  }

  /** @name PalletCollectiveEvent (138) */
  interface PalletCollectiveEvent extends Enum {
    readonly isProposed: boolean;
    readonly asProposed: {
      readonly account: AccountId32;
      readonly proposalIndex: u32;
      readonly proposalHash: H256;
      readonly threshold: u32;
    } & Struct;
    readonly isVoted: boolean;
    readonly asVoted: {
      readonly account: AccountId32;
      readonly proposalHash: H256;
      readonly voted: bool;
      readonly yes: u32;
      readonly no: u32;
    } & Struct;
    readonly isApproved: boolean;
    readonly asApproved: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isDisapproved: boolean;
    readonly asDisapproved: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isExecuted: boolean;
    readonly asExecuted: {
      readonly proposalHash: H256;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isMemberExecuted: boolean;
    readonly asMemberExecuted: {
      readonly proposalHash: H256;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isClosed: boolean;
    readonly asClosed: {
      readonly proposalHash: H256;
      readonly yes: u32;
      readonly no: u32;
    } & Struct;
    readonly type: "Proposed" | "Voted" | "Approved" | "Disapproved" | "Executed" | "MemberExecuted" | "Closed";
  }

  /** @name PalletMembershipEvent (139) */
  interface PalletMembershipEvent extends Enum {
    readonly isMemberAdded: boolean;
    readonly isMemberRemoved: boolean;
    readonly isMembersSwapped: boolean;
    readonly isMembersReset: boolean;
    readonly isKeyChanged: boolean;
    readonly isDummy: boolean;
    readonly type: "MemberAdded" | "MemberRemoved" | "MembersSwapped" | "MembersReset" | "KeyChanged" | "Dummy";
  }

  /** @name PalletDaoEvent (140) */
  interface PalletDaoEvent extends Enum {
    readonly isVoted: boolean;
    readonly asVoted: {
      readonly account: AccountId32;
      readonly proposalHash: H256;
      readonly voted: bool;
      readonly yes: u32;
      readonly no: u32;
    } & Struct;
    readonly isProposed: boolean;
    readonly asProposed: {
      readonly account: AccountId32;
      readonly proposalIndex: u32;
      readonly proposalHash: H256;
      readonly threshold: u32;
    } & Struct;
    readonly isApproved: boolean;
    readonly asApproved: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isDisapproved: boolean;
    readonly asDisapproved: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isExecuted: boolean;
    readonly asExecuted: {
      readonly proposalHash: H256;
      readonly result: Result<Null, SpRuntimeDispatchError>;
    } & Struct;
    readonly isClosed: boolean;
    readonly asClosed: {
      readonly proposalHash: H256;
      readonly yes: u32;
      readonly yesWeight: u64;
      readonly no: u32;
      readonly noWeight: u64;
    } & Struct;
    readonly isClosedByCouncil: boolean;
    readonly asClosedByCouncil: {
      readonly proposalHash: H256;
      readonly vetos: Vec<AccountId32>;
    } & Struct;
    readonly isCouncilMemberVeto: boolean;
    readonly asCouncilMemberVeto: {
      readonly proposalHash: H256;
      readonly who: AccountId32;
    } & Struct;
    readonly type:
      | "Voted"
      | "Proposed"
      | "Approved"
      | "Disapproved"
      | "Executed"
      | "Closed"
      | "ClosedByCouncil"
      | "CouncilMemberVeto";
  }

  /** @name PalletValidatorEvent (142) */
  interface PalletValidatorEvent extends Enum {
    readonly isBonded: boolean;
    readonly asBonded: AccountId32;
    readonly isValidatorRequestCreated: boolean;
    readonly asValidatorRequestCreated: ITuple<[AccountId32, PalletValidatorValidator]>;
    readonly isValidatorRequestApproved: boolean;
    readonly asValidatorRequestApproved: PalletValidatorValidator;
    readonly isValidatorActivated: boolean;
    readonly asValidatorActivated: PalletValidatorValidator;
    readonly isValidatorRemoved: boolean;
    readonly asValidatorRemoved: PalletValidatorValidator;
    readonly isNodeValidatorChanged: boolean;
    readonly asNodeValidatorChanged: AccountId32;
    readonly isNodeValidatorRemoved: boolean;
    readonly asNodeValidatorRemoved: AccountId32;
    readonly type:
      | "Bonded"
      | "ValidatorRequestCreated"
      | "ValidatorRequestApproved"
      | "ValidatorActivated"
      | "ValidatorRemoved"
      | "NodeValidatorChanged"
      | "NodeValidatorRemoved";
  }

  /** @name PalletValidatorValidator (143) */
  interface PalletValidatorValidator extends Struct {
    readonly validatorNodeAccount: AccountId32;
    readonly stashAccount: AccountId32;
    readonly description: Bytes;
    readonly tfConnectId: Bytes;
    readonly info: Bytes;
    readonly state: PalletValidatorValidatorRequestState;
  }

  /** @name PalletValidatorValidatorRequestState (144) */
  interface PalletValidatorValidatorRequestState extends Enum {
    readonly isCreated: boolean;
    readonly isApproved: boolean;
    readonly isValidating: boolean;
    readonly type: "Created" | "Approved" | "Validating";
  }

  /** @name FrameSystemPhase (145) */
  interface FrameSystemPhase extends Enum {
    readonly isApplyExtrinsic: boolean;
    readonly asApplyExtrinsic: u32;
    readonly isFinalization: boolean;
    readonly isInitialization: boolean;
    readonly type: "ApplyExtrinsic" | "Finalization" | "Initialization";
  }

  /** @name FrameSystemLastRuntimeUpgradeInfo (148) */
  interface FrameSystemLastRuntimeUpgradeInfo extends Struct {
    readonly specVersion: Compact<u32>;
    readonly specName: Text;
  }

  /** @name FrameSystemCall (151) */
  interface FrameSystemCall extends Enum {
    readonly isRemark: boolean;
    readonly asRemark: {
      readonly remark: Bytes;
    } & Struct;
    readonly isSetHeapPages: boolean;
    readonly asSetHeapPages: {
      readonly pages: u64;
    } & Struct;
    readonly isSetCode: boolean;
    readonly asSetCode: {
      readonly code: Bytes;
    } & Struct;
    readonly isSetCodeWithoutChecks: boolean;
    readonly asSetCodeWithoutChecks: {
      readonly code: Bytes;
    } & Struct;
    readonly isSetStorage: boolean;
    readonly asSetStorage: {
      readonly items: Vec<ITuple<[Bytes, Bytes]>>;
    } & Struct;
    readonly isKillStorage: boolean;
    readonly asKillStorage: {
      readonly keys_: Vec<Bytes>;
    } & Struct;
    readonly isKillPrefix: boolean;
    readonly asKillPrefix: {
      readonly prefix: Bytes;
      readonly subkeys: u32;
    } & Struct;
    readonly isRemarkWithEvent: boolean;
    readonly asRemarkWithEvent: {
      readonly remark: Bytes;
    } & Struct;
    readonly type:
      | "Remark"
      | "SetHeapPages"
      | "SetCode"
      | "SetCodeWithoutChecks"
      | "SetStorage"
      | "KillStorage"
      | "KillPrefix"
      | "RemarkWithEvent";
  }

  /** @name FrameSystemLimitsBlockWeights (155) */
  interface FrameSystemLimitsBlockWeights extends Struct {
    readonly baseBlock: SpWeightsWeightV2Weight;
    readonly maxBlock: SpWeightsWeightV2Weight;
    readonly perClass: FrameSupportDispatchPerDispatchClassWeightsPerClass;
  }

  /** @name FrameSupportDispatchPerDispatchClassWeightsPerClass (156) */
  interface FrameSupportDispatchPerDispatchClassWeightsPerClass extends Struct {
    readonly normal: FrameSystemLimitsWeightsPerClass;
    readonly operational: FrameSystemLimitsWeightsPerClass;
    readonly mandatory: FrameSystemLimitsWeightsPerClass;
  }

  /** @name FrameSystemLimitsWeightsPerClass (157) */
  interface FrameSystemLimitsWeightsPerClass extends Struct {
    readonly baseExtrinsic: SpWeightsWeightV2Weight;
    readonly maxExtrinsic: Option<SpWeightsWeightV2Weight>;
    readonly maxTotal: Option<SpWeightsWeightV2Weight>;
    readonly reserved: Option<SpWeightsWeightV2Weight>;
  }

  /** @name FrameSystemLimitsBlockLength (159) */
  interface FrameSystemLimitsBlockLength extends Struct {
    readonly max: FrameSupportDispatchPerDispatchClassU32;
  }

  /** @name FrameSupportDispatchPerDispatchClassU32 (160) */
  interface FrameSupportDispatchPerDispatchClassU32 extends Struct {
    readonly normal: u32;
    readonly operational: u32;
    readonly mandatory: u32;
  }

  /** @name SpWeightsRuntimeDbWeight (161) */
  interface SpWeightsRuntimeDbWeight extends Struct {
    readonly read: u64;
    readonly write: u64;
  }

  /** @name SpVersionRuntimeVersion (162) */
  interface SpVersionRuntimeVersion extends Struct {
    readonly specName: Text;
    readonly implName: Text;
    readonly authoringVersion: u32;
    readonly specVersion: u32;
    readonly implVersion: u32;
    readonly apis: Vec<ITuple<[U8aFixed, u32]>>;
    readonly transactionVersion: u32;
    readonly stateVersion: u8;
  }

  /** @name FrameSystemError (167) */
  interface FrameSystemError extends Enum {
    readonly isInvalidSpecName: boolean;
    readonly isSpecVersionNeedsToIncrease: boolean;
    readonly isFailedToExtractRuntimeVersion: boolean;
    readonly isNonDefaultComposite: boolean;
    readonly isNonZeroRefCount: boolean;
    readonly isCallFiltered: boolean;
    readonly type:
      | "InvalidSpecName"
      | "SpecVersionNeedsToIncrease"
      | "FailedToExtractRuntimeVersion"
      | "NonDefaultComposite"
      | "NonZeroRefCount"
      | "CallFiltered";
  }

  /** @name PalletTimestampCall (168) */
  interface PalletTimestampCall extends Enum {
    readonly isSet: boolean;
    readonly asSet: {
      readonly now: Compact<u64>;
    } & Struct;
    readonly type: "Set";
  }

  /** @name PalletUtilityCall (169) */
  interface PalletUtilityCall extends Enum {
    readonly isBatch: boolean;
    readonly asBatch: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly isAsDerivative: boolean;
    readonly asAsDerivative: {
      readonly index: u16;
      readonly call: Call;
    } & Struct;
    readonly isBatchAll: boolean;
    readonly asBatchAll: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly isDispatchAs: boolean;
    readonly asDispatchAs: {
      readonly asOrigin: TfchainRuntimeOriginCaller;
      readonly call: Call;
    } & Struct;
    readonly isForceBatch: boolean;
    readonly asForceBatch: {
      readonly calls: Vec<Call>;
    } & Struct;
    readonly isWithWeight: boolean;
    readonly asWithWeight: {
      readonly call: Call;
      readonly weight: SpWeightsWeightV2Weight;
    } & Struct;
    readonly type: "Batch" | "AsDerivative" | "BatchAll" | "DispatchAs" | "ForceBatch" | "WithWeight";
  }

  /** @name PalletSchedulerCall (172) */
  interface PalletSchedulerCall extends Enum {
    readonly isSchedule: boolean;
    readonly asSchedule: {
      readonly when: u32;
      readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
      readonly priority: u8;
      readonly call: Call;
    } & Struct;
    readonly isCancel: boolean;
    readonly asCancel: {
      readonly when: u32;
      readonly index: u32;
    } & Struct;
    readonly isScheduleNamed: boolean;
    readonly asScheduleNamed: {
      readonly id: U8aFixed;
      readonly when: u32;
      readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
      readonly priority: u8;
      readonly call: Call;
    } & Struct;
    readonly isCancelNamed: boolean;
    readonly asCancelNamed: {
      readonly id: U8aFixed;
    } & Struct;
    readonly isScheduleAfter: boolean;
    readonly asScheduleAfter: {
      readonly after: u32;
      readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
      readonly priority: u8;
      readonly call: Call;
    } & Struct;
    readonly isScheduleNamedAfter: boolean;
    readonly asScheduleNamedAfter: {
      readonly id: U8aFixed;
      readonly after: u32;
      readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
      readonly priority: u8;
      readonly call: Call;
    } & Struct;
    readonly type: "Schedule" | "Cancel" | "ScheduleNamed" | "CancelNamed" | "ScheduleAfter" | "ScheduleNamedAfter";
  }

  /** @name SubstrateValidatorSetCall (174) */
  interface SubstrateValidatorSetCall extends Enum {
    readonly isAddValidator: boolean;
    readonly asAddValidator: {
      readonly validatorId: AccountId32;
    } & Struct;
    readonly isRemoveValidator: boolean;
    readonly asRemoveValidator: {
      readonly validatorId: AccountId32;
    } & Struct;
    readonly isAddValidatorAgain: boolean;
    readonly asAddValidatorAgain: {
      readonly validatorId: AccountId32;
    } & Struct;
    readonly type: "AddValidator" | "RemoveValidator" | "AddValidatorAgain";
  }

  /** @name PalletSessionCall (175) */
  interface PalletSessionCall extends Enum {
    readonly isSetKeys: boolean;
    readonly asSetKeys: {
      readonly keys_: TfchainRuntimeOpaqueSessionKeys;
      readonly proof: Bytes;
    } & Struct;
    readonly isPurgeKeys: boolean;
    readonly type: "SetKeys" | "PurgeKeys";
  }

  /** @name TfchainRuntimeOpaqueSessionKeys (176) */
  interface TfchainRuntimeOpaqueSessionKeys extends Struct {
    readonly aura: SpConsensusAuraSr25519AppSr25519Public;
    readonly grandpa: SpConsensusGrandpaAppPublic;
  }

  /** @name SpConsensusAuraSr25519AppSr25519Public (177) */
  interface SpConsensusAuraSr25519AppSr25519Public extends SpCoreSr25519Public {}

  /** @name SpCoreSr25519Public (178) */
  interface SpCoreSr25519Public extends U8aFixed {}

  /** @name PalletGrandpaCall (179) */
  interface PalletGrandpaCall extends Enum {
    readonly isReportEquivocation: boolean;
    readonly asReportEquivocation: {
      readonly equivocationProof: SpConsensusGrandpaEquivocationProof;
      readonly keyOwnerProof: SpCoreVoid;
    } & Struct;
    readonly isReportEquivocationUnsigned: boolean;
    readonly asReportEquivocationUnsigned: {
      readonly equivocationProof: SpConsensusGrandpaEquivocationProof;
      readonly keyOwnerProof: SpCoreVoid;
    } & Struct;
    readonly isNoteStalled: boolean;
    readonly asNoteStalled: {
      readonly delay: u32;
      readonly bestFinalizedBlockNumber: u32;
    } & Struct;
    readonly type: "ReportEquivocation" | "ReportEquivocationUnsigned" | "NoteStalled";
  }

  /** @name SpConsensusGrandpaEquivocationProof (180) */
  interface SpConsensusGrandpaEquivocationProof extends Struct {
    readonly setId: u64;
    readonly equivocation: SpConsensusGrandpaEquivocation;
  }

  /** @name SpConsensusGrandpaEquivocation (181) */
  interface SpConsensusGrandpaEquivocation extends Enum {
    readonly isPrevote: boolean;
    readonly asPrevote: FinalityGrandpaEquivocationPrevote;
    readonly isPrecommit: boolean;
    readonly asPrecommit: FinalityGrandpaEquivocationPrecommit;
    readonly type: "Prevote" | "Precommit";
  }

  /** @name FinalityGrandpaEquivocationPrevote (182) */
  interface FinalityGrandpaEquivocationPrevote extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpConsensusGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrevote, SpConsensusGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrevote, SpConsensusGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrevote (183) */
  interface FinalityGrandpaPrevote extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u32;
  }

  /** @name SpConsensusGrandpaAppSignature (184) */
  interface SpConsensusGrandpaAppSignature extends SpCoreEd25519Signature {}

  /** @name SpCoreEd25519Signature (185) */
  interface SpCoreEd25519Signature extends U8aFixed {}

  /** @name FinalityGrandpaEquivocationPrecommit (188) */
  interface FinalityGrandpaEquivocationPrecommit extends Struct {
    readonly roundNumber: u64;
    readonly identity: SpConsensusGrandpaAppPublic;
    readonly first: ITuple<[FinalityGrandpaPrecommit, SpConsensusGrandpaAppSignature]>;
    readonly second: ITuple<[FinalityGrandpaPrecommit, SpConsensusGrandpaAppSignature]>;
  }

  /** @name FinalityGrandpaPrecommit (189) */
  interface FinalityGrandpaPrecommit extends Struct {
    readonly targetHash: H256;
    readonly targetNumber: u32;
  }

  /** @name SpCoreVoid (191) */
  type SpCoreVoid = Null;

  /** @name PalletBalancesCall (192) */
  interface PalletBalancesCall extends Enum {
    readonly isTransferAllowDeath: boolean;
    readonly asTransferAllowDeath: {
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isSetBalanceDeprecated: boolean;
    readonly asSetBalanceDeprecated: {
      readonly who: MultiAddress;
      readonly newFree: Compact<u128>;
      readonly oldReserved: Compact<u128>;
    } & Struct;
    readonly isForceTransfer: boolean;
    readonly asForceTransfer: {
      readonly source: MultiAddress;
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isTransferKeepAlive: boolean;
    readonly asTransferKeepAlive: {
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isTransferAll: boolean;
    readonly asTransferAll: {
      readonly dest: MultiAddress;
      readonly keepAlive: bool;
    } & Struct;
    readonly isForceUnreserve: boolean;
    readonly asForceUnreserve: {
      readonly who: MultiAddress;
      readonly amount: u128;
    } & Struct;
    readonly isUpgradeAccounts: boolean;
    readonly asUpgradeAccounts: {
      readonly who: Vec<AccountId32>;
    } & Struct;
    readonly isTransfer: boolean;
    readonly asTransfer: {
      readonly dest: MultiAddress;
      readonly value: Compact<u128>;
    } & Struct;
    readonly isForceSetBalance: boolean;
    readonly asForceSetBalance: {
      readonly who: MultiAddress;
      readonly newFree: Compact<u128>;
    } & Struct;
    readonly type:
      | "TransferAllowDeath"
      | "SetBalanceDeprecated"
      | "ForceTransfer"
      | "TransferKeepAlive"
      | "TransferAll"
      | "ForceUnreserve"
      | "UpgradeAccounts"
      | "Transfer"
      | "ForceSetBalance";
  }

  /** @name PalletTfgridCall (197) */
  interface PalletTfgridCall extends Enum {
    readonly isSetStorageVersion: boolean;
    readonly asSetStorageVersion: {
      readonly version: PalletTfgridStorageVersion;
    } & Struct;
    readonly isCreateFarm: boolean;
    readonly asCreateFarm: {
      readonly name: Bytes;
      readonly publicIps: Vec<TfchainSupportIp4>;
    } & Struct;
    readonly isUpdateFarm: boolean;
    readonly asUpdateFarm: {
      readonly farmId: u32;
      readonly name: Bytes;
    } & Struct;
    readonly isAddStellarPayoutV2address: boolean;
    readonly asAddStellarPayoutV2address: {
      readonly farmId: u32;
      readonly stellarAddress: Bytes;
    } & Struct;
    readonly isSetFarmCertification: boolean;
    readonly asSetFarmCertification: {
      readonly farmId: u32;
      readonly certification: TfchainSupportFarmCertification;
    } & Struct;
    readonly isAddFarmIp: boolean;
    readonly asAddFarmIp: {
      readonly farmId: u32;
      readonly ip: Bytes;
      readonly gw: Bytes;
    } & Struct;
    readonly isRemoveFarmIp: boolean;
    readonly asRemoveFarmIp: {
      readonly farmId: u32;
      readonly ip: Bytes;
    } & Struct;
    readonly isCreateNode: boolean;
    readonly asCreateNode: {
      readonly farmId: u32;
      readonly resources: TfchainSupportResources;
      readonly location: PalletTfgridLocationInput;
      readonly interfaces: Vec<TfchainSupportInterfaceBoundedVec>;
      readonly secureBoot: bool;
      readonly virtualized: bool;
      readonly serialNumber: Option<Bytes>;
    } & Struct;
    readonly isUpdateNode: boolean;
    readonly asUpdateNode: {
      readonly nodeId: u32;
      readonly farmId: u32;
      readonly resources: TfchainSupportResources;
      readonly location: PalletTfgridLocationInput;
      readonly interfaces: Vec<TfchainSupportInterfaceBoundedVec>;
      readonly secureBoot: bool;
      readonly virtualized: bool;
      readonly serialNumber: Option<Bytes>;
    } & Struct;
    readonly isSetNodeCertification: boolean;
    readonly asSetNodeCertification: {
      readonly nodeId: u32;
      readonly nodeCertification: TfchainSupportNodeCertification;
    } & Struct;
    readonly isReportUptime: boolean;
    readonly asReportUptime: {
      readonly uptime: u64;
    } & Struct;
    readonly isAddNodePublicConfig: boolean;
    readonly asAddNodePublicConfig: {
      readonly farmId: u32;
      readonly nodeId: u32;
      readonly publicConfig: Option<TfchainSupportPublicConfig>;
    } & Struct;
    readonly isDeleteNode: boolean;
    readonly asDeleteNode: {
      readonly nodeId: u32;
    } & Struct;
    readonly isCreateEntity: boolean;
    readonly asCreateEntity: {
      readonly target: AccountId32;
      readonly name: Bytes;
      readonly country: Bytes;
      readonly city: Bytes;
      readonly signature: Bytes;
    } & Struct;
    readonly isUpdateEntity: boolean;
    readonly asUpdateEntity: {
      readonly name: Bytes;
      readonly country: Bytes;
      readonly city: Bytes;
    } & Struct;
    readonly isDeleteEntity: boolean;
    readonly isCreateTwin: boolean;
    readonly asCreateTwin: {
      readonly relay: Option<Bytes>;
      readonly pk: Option<Bytes>;
    } & Struct;
    readonly isUpdateTwin: boolean;
    readonly asUpdateTwin: {
      readonly relay: Option<Bytes>;
      readonly pk: Option<Bytes>;
    } & Struct;
    readonly isAddTwinEntity: boolean;
    readonly asAddTwinEntity: {
      readonly twinId: u32;
      readonly entityId: u32;
      readonly signature: Bytes;
    } & Struct;
    readonly isDeleteTwinEntity: boolean;
    readonly asDeleteTwinEntity: {
      readonly twinId: u32;
      readonly entityId: u32;
    } & Struct;
    readonly isCreatePricingPolicy: boolean;
    readonly asCreatePricingPolicy: {
      readonly name: Bytes;
      readonly su: PalletTfgridPolicy;
      readonly cu: PalletTfgridPolicy;
      readonly nu: PalletTfgridPolicy;
      readonly ipu: PalletTfgridPolicy;
      readonly uniqueName: PalletTfgridPolicy;
      readonly domainName: PalletTfgridPolicy;
      readonly foundationAccount: AccountId32;
      readonly certifiedSalesAccount: AccountId32;
      readonly discountForDedicationNodes: u8;
    } & Struct;
    readonly isUpdatePricingPolicy: boolean;
    readonly asUpdatePricingPolicy: {
      readonly pricingPolicyId: u32;
      readonly name: Bytes;
      readonly su: PalletTfgridPolicy;
      readonly cu: PalletTfgridPolicy;
      readonly nu: PalletTfgridPolicy;
      readonly ipu: PalletTfgridPolicy;
      readonly uniqueName: PalletTfgridPolicy;
      readonly domainName: PalletTfgridPolicy;
      readonly foundationAccount: AccountId32;
      readonly certifiedSalesAccount: AccountId32;
      readonly discountForDedicationNodes: u8;
    } & Struct;
    readonly isCreateFarmingPolicy: boolean;
    readonly asCreateFarmingPolicy: {
      readonly name: Bytes;
      readonly su: u32;
      readonly cu: u32;
      readonly nu: u32;
      readonly ipv4: u32;
      readonly minimalUptime: u16;
      readonly policyEnd: u32;
      readonly immutable: bool;
      readonly default: bool;
      readonly nodeCertification: TfchainSupportNodeCertification;
      readonly farmCertification: TfchainSupportFarmCertification;
    } & Struct;
    readonly isUserAcceptTc: boolean;
    readonly asUserAcceptTc: {
      readonly documentLink: Bytes;
      readonly documentHash: Bytes;
    } & Struct;
    readonly isDeleteNodeFarm: boolean;
    readonly asDeleteNodeFarm: {
      readonly nodeId: u32;
    } & Struct;
    readonly isSetFarmDedicated: boolean;
    readonly asSetFarmDedicated: {
      readonly farmId: u32;
      readonly dedicated: bool;
    } & Struct;
    readonly isForceResetFarmIp: boolean;
    readonly asForceResetFarmIp: {
      readonly farmId: u32;
      readonly ip: Bytes;
    } & Struct;
    readonly isSetConnectionPrice: boolean;
    readonly asSetConnectionPrice: {
      readonly price: u32;
    } & Struct;
    readonly isAddNodeCertifier: boolean;
    readonly asAddNodeCertifier: {
      readonly certifier: AccountId32;
    } & Struct;
    readonly isRemoveNodeCertifier: boolean;
    readonly asRemoveNodeCertifier: {
      readonly certifier: AccountId32;
    } & Struct;
    readonly isUpdateFarmingPolicy: boolean;
    readonly asUpdateFarmingPolicy: {
      readonly farmingPolicyId: u32;
      readonly name: Bytes;
      readonly su: u32;
      readonly cu: u32;
      readonly nu: u32;
      readonly ipv4: u32;
      readonly minimalUptime: u16;
      readonly policyEnd: u32;
      readonly default: bool;
      readonly nodeCertification: TfchainSupportNodeCertification;
      readonly farmCertification: TfchainSupportFarmCertification;
    } & Struct;
    readonly isAttachPolicyToFarm: boolean;
    readonly asAttachPolicyToFarm: {
      readonly farmId: u32;
      readonly limits: Option<TfchainSupportFarmingPolicyLimit>;
    } & Struct;
    readonly isSetZosVersion: boolean;
    readonly asSetZosVersion: {
      readonly zosVersion: Bytes;
    } & Struct;
    readonly isChangePowerState: boolean;
    readonly asChangePowerState: {
      readonly powerState: TfchainSupportPower;
    } & Struct;
    readonly isChangePowerTarget: boolean;
    readonly asChangePowerTarget: {
      readonly nodeId: u32;
      readonly powerTarget: TfchainSupportPower;
    } & Struct;
    readonly isBondTwinAccount: boolean;
    readonly asBondTwinAccount: {
      readonly twinId: u32;
    } & Struct;
    readonly isReportUptimeV2: boolean;
    readonly asReportUptimeV2: {
      readonly uptime: u64;
      readonly timestampHint: u64;
    } & Struct;
    readonly type:
      | "SetStorageVersion"
      | "CreateFarm"
      | "UpdateFarm"
      | "AddStellarPayoutV2address"
      | "SetFarmCertification"
      | "AddFarmIp"
      | "RemoveFarmIp"
      | "CreateNode"
      | "UpdateNode"
      | "SetNodeCertification"
      | "ReportUptime"
      | "AddNodePublicConfig"
      | "DeleteNode"
      | "CreateEntity"
      | "UpdateEntity"
      | "DeleteEntity"
      | "CreateTwin"
      | "UpdateTwin"
      | "AddTwinEntity"
      | "DeleteTwinEntity"
      | "CreatePricingPolicy"
      | "UpdatePricingPolicy"
      | "CreateFarmingPolicy"
      | "UserAcceptTc"
      | "DeleteNodeFarm"
      | "SetFarmDedicated"
      | "ForceResetFarmIp"
      | "SetConnectionPrice"
      | "AddNodeCertifier"
      | "RemoveNodeCertifier"
      | "UpdateFarmingPolicy"
      | "AttachPolicyToFarm"
      | "SetZosVersion"
      | "ChangePowerState"
      | "ChangePowerTarget"
      | "BondTwinAccount"
      | "ReportUptimeV2";
  }

  /** @name PalletTfgridStorageVersion (198) */
  interface PalletTfgridStorageVersion extends Enum {
    readonly isV1Struct: boolean;
    readonly isV2Struct: boolean;
    readonly isV3Struct: boolean;
    readonly isV4Struct: boolean;
    readonly isV5Struct: boolean;
    readonly isV6Struct: boolean;
    readonly isV7Struct: boolean;
    readonly isV8Struct: boolean;
    readonly isV9Struct: boolean;
    readonly isV10Struct: boolean;
    readonly isV11Struct: boolean;
    readonly isV12Struct: boolean;
    readonly isV13Struct: boolean;
    readonly isV14Struct: boolean;
    readonly isV15Struct: boolean;
    readonly isV16Struct: boolean;
    readonly isV17Struct: boolean;
    readonly type:
      | "V1Struct"
      | "V2Struct"
      | "V3Struct"
      | "V4Struct"
      | "V5Struct"
      | "V6Struct"
      | "V7Struct"
      | "V8Struct"
      | "V9Struct"
      | "V10Struct"
      | "V11Struct"
      | "V12Struct"
      | "V13Struct"
      | "V14Struct"
      | "V15Struct"
      | "V16Struct"
      | "V17Struct";
  }

  /** @name PalletTfgridLocationInput (201) */
  interface PalletTfgridLocationInput extends Struct {
    readonly city: Bytes;
    readonly country: Bytes;
    readonly latitude: Bytes;
    readonly longitude: Bytes;
  }

  /** @name TfchainSupportInterfaceBoundedVec (203) */
  interface TfchainSupportInterfaceBoundedVec extends Struct {
    readonly name: Bytes;
    readonly mac: Bytes;
    readonly ips: Vec<Bytes>;
  }

  /** @name PalletSmartContractCall (208) */
  interface PalletSmartContractCall extends Enum {
    readonly isCreateNodeContract: boolean;
    readonly asCreateNodeContract: {
      readonly nodeId: u32;
      readonly deploymentHash: U8aFixed;
      readonly deploymentData: Bytes;
      readonly publicIps: u32;
      readonly solutionProviderId: Option<u64>;
    } & Struct;
    readonly isUpdateNodeContract: boolean;
    readonly asUpdateNodeContract: {
      readonly contractId: u64;
      readonly deploymentHash: U8aFixed;
      readonly deploymentData: Bytes;
    } & Struct;
    readonly isCancelContract: boolean;
    readonly asCancelContract: {
      readonly contractId: u64;
    } & Struct;
    readonly isCreateNameContract: boolean;
    readonly asCreateNameContract: {
      readonly name: Bytes;
    } & Struct;
    readonly isAddNruReports: boolean;
    readonly asAddNruReports: {
      readonly reports: Vec<PalletSmartContractNruConsumption>;
    } & Struct;
    readonly isReportContractResources: boolean;
    readonly asReportContractResources: {
      readonly contractResources: Vec<PalletSmartContractContractResources>;
    } & Struct;
    readonly isCreateRentContract: boolean;
    readonly asCreateRentContract: {
      readonly nodeId: u32;
      readonly solutionProviderId: Option<u64>;
    } & Struct;
    readonly isCreateSolutionProvider: boolean;
    readonly asCreateSolutionProvider: {
      readonly description: Bytes;
      readonly link: Bytes;
      readonly providers: Vec<PalletSmartContractProvider>;
    } & Struct;
    readonly isApproveSolutionProvider: boolean;
    readonly asApproveSolutionProvider: {
      readonly solutionProviderId: u64;
      readonly approve: bool;
    } & Struct;
    readonly isBillContractForBlock: boolean;
    readonly asBillContractForBlock: {
      readonly contractId: u64;
    } & Struct;
    readonly isServiceContractCreate: boolean;
    readonly asServiceContractCreate: {
      readonly serviceAccount: AccountId32;
      readonly consumerAccount: AccountId32;
    } & Struct;
    readonly isServiceContractSetMetadata: boolean;
    readonly asServiceContractSetMetadata: {
      readonly serviceContractId: u64;
      readonly metadata: Bytes;
    } & Struct;
    readonly isServiceContractSetFees: boolean;
    readonly asServiceContractSetFees: {
      readonly serviceContractId: u64;
      readonly baseFee: u64;
      readonly variableFee: u64;
    } & Struct;
    readonly isServiceContractApprove: boolean;
    readonly asServiceContractApprove: {
      readonly serviceContractId: u64;
    } & Struct;
    readonly isServiceContractReject: boolean;
    readonly asServiceContractReject: {
      readonly serviceContractId: u64;
    } & Struct;
    readonly isServiceContractCancel: boolean;
    readonly asServiceContractCancel: {
      readonly serviceContractId: u64;
    } & Struct;
    readonly isServiceContractBill: boolean;
    readonly asServiceContractBill: {
      readonly serviceContractId: u64;
      readonly variableAmount: u64;
      readonly metadata: Bytes;
    } & Struct;
    readonly isChangeBillingFrequency: boolean;
    readonly asChangeBillingFrequency: {
      readonly frequency: u64;
    } & Struct;
    readonly isAttachSolutionProviderId: boolean;
    readonly asAttachSolutionProviderId: {
      readonly contractId: u64;
      readonly solutionProviderId: u64;
    } & Struct;
    readonly isSetDedicatedNodeExtraFee: boolean;
    readonly asSetDedicatedNodeExtraFee: {
      readonly nodeId: u32;
      readonly extraFee: u64;
    } & Struct;
    readonly isCancelContractCollective: boolean;
    readonly asCancelContractCollective: {
      readonly contractId: u64;
    } & Struct;
    readonly type:
      | "CreateNodeContract"
      | "UpdateNodeContract"
      | "CancelContract"
      | "CreateNameContract"
      | "AddNruReports"
      | "ReportContractResources"
      | "CreateRentContract"
      | "CreateSolutionProvider"
      | "ApproveSolutionProvider"
      | "BillContractForBlock"
      | "ServiceContractCreate"
      | "ServiceContractSetMetadata"
      | "ServiceContractSetFees"
      | "ServiceContractApprove"
      | "ServiceContractReject"
      | "ServiceContractCancel"
      | "ServiceContractBill"
      | "ChangeBillingFrequency"
      | "AttachSolutionProviderId"
      | "SetDedicatedNodeExtraFee"
      | "CancelContractCollective";
  }

  /** @name PalletTftBridgeCall (211) */
  interface PalletTftBridgeCall extends Enum {
    readonly isAddBridgeValidator: boolean;
    readonly asAddBridgeValidator: {
      readonly target: AccountId32;
    } & Struct;
    readonly isRemoveBridgeValidator: boolean;
    readonly asRemoveBridgeValidator: {
      readonly target: AccountId32;
    } & Struct;
    readonly isSetFeeAccount: boolean;
    readonly asSetFeeAccount: {
      readonly target: AccountId32;
    } & Struct;
    readonly isSetWithdrawFee: boolean;
    readonly asSetWithdrawFee: {
      readonly amount: u64;
    } & Struct;
    readonly isSetDepositFee: boolean;
    readonly asSetDepositFee: {
      readonly amount: u64;
    } & Struct;
    readonly isSwapToStellar: boolean;
    readonly asSwapToStellar: {
      readonly targetStellarAddress: Bytes;
      readonly amount: u128;
    } & Struct;
    readonly isProposeOrVoteMintTransaction: boolean;
    readonly asProposeOrVoteMintTransaction: {
      readonly transaction: Bytes;
      readonly target: AccountId32;
      readonly amount: u64;
    } & Struct;
    readonly isProposeBurnTransactionOrAddSig: boolean;
    readonly asProposeBurnTransactionOrAddSig: {
      readonly transactionId: u64;
      readonly target: Bytes;
      readonly amount: u64;
      readonly signature: Bytes;
      readonly stellarPubKey: Bytes;
      readonly sequenceNumber: u64;
    } & Struct;
    readonly isSetBurnTransactionExecuted: boolean;
    readonly asSetBurnTransactionExecuted: {
      readonly transactionId: u64;
    } & Struct;
    readonly isCreateRefundTransactionOrAddSig: boolean;
    readonly asCreateRefundTransactionOrAddSig: {
      readonly txHash: Bytes;
      readonly target: Bytes;
      readonly amount: u64;
      readonly signature: Bytes;
      readonly stellarPubKey: Bytes;
      readonly sequenceNumber: u64;
    } & Struct;
    readonly isSetRefundTransactionExecuted: boolean;
    readonly asSetRefundTransactionExecuted: {
      readonly txHash: Bytes;
    } & Struct;
    readonly type:
      | "AddBridgeValidator"
      | "RemoveBridgeValidator"
      | "SetFeeAccount"
      | "SetWithdrawFee"
      | "SetDepositFee"
      | "SwapToStellar"
      | "ProposeOrVoteMintTransaction"
      | "ProposeBurnTransactionOrAddSig"
      | "SetBurnTransactionExecuted"
      | "CreateRefundTransactionOrAddSig"
      | "SetRefundTransactionExecuted";
  }

  /** @name PalletTftPriceCall (212) */
  interface PalletTftPriceCall extends Enum {
    readonly isSetPrices: boolean;
    readonly asSetPrices: {
      readonly price: u32;
      readonly blockNumber: u32;
    } & Struct;
    readonly isSetMinTftPrice: boolean;
    readonly asSetMinTftPrice: {
      readonly price: u32;
    } & Struct;
    readonly isSetMaxTftPrice: boolean;
    readonly asSetMaxTftPrice: {
      readonly price: u32;
    } & Struct;
    readonly type: "SetPrices" | "SetMinTftPrice" | "SetMaxTftPrice";
  }

  /** @name PalletBurningCall (213) */
  interface PalletBurningCall extends Enum {
    readonly isBurnTft: boolean;
    readonly asBurnTft: {
      readonly amount: u128;
      readonly message: Bytes;
    } & Struct;
    readonly type: "BurnTft";
  }

  /** @name PalletKvstoreCall (214) */
  interface PalletKvstoreCall extends Enum {
    readonly isSet: boolean;
    readonly asSet: {
      readonly key: Bytes;
      readonly value: Bytes;
    } & Struct;
    readonly isDelete: boolean;
    readonly asDelete: {
      readonly key: Bytes;
    } & Struct;
    readonly type: "Set" | "Delete";
  }

  /** @name PalletRuntimeUpgradeCall (215) */
  interface PalletRuntimeUpgradeCall extends Enum {
    readonly isSetCode: boolean;
    readonly asSetCode: {
      readonly code: Bytes;
    } & Struct;
    readonly type: "SetCode";
  }

  /** @name PalletCollectiveCall (216) */
  interface PalletCollectiveCall extends Enum {
    readonly isSetMembers: boolean;
    readonly asSetMembers: {
      readonly newMembers: Vec<AccountId32>;
      readonly prime: Option<AccountId32>;
      readonly oldCount: u32;
    } & Struct;
    readonly isExecute: boolean;
    readonly asExecute: {
      readonly proposal: Call;
      readonly lengthBound: Compact<u32>;
    } & Struct;
    readonly isPropose: boolean;
    readonly asPropose: {
      readonly threshold: Compact<u32>;
      readonly proposal: Call;
      readonly lengthBound: Compact<u32>;
    } & Struct;
    readonly isVote: boolean;
    readonly asVote: {
      readonly proposal: H256;
      readonly index: Compact<u32>;
      readonly approve: bool;
    } & Struct;
    readonly isDisapproveProposal: boolean;
    readonly asDisapproveProposal: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isClose: boolean;
    readonly asClose: {
      readonly proposalHash: H256;
      readonly index: Compact<u32>;
      readonly proposalWeightBound: SpWeightsWeightV2Weight;
      readonly lengthBound: Compact<u32>;
    } & Struct;
    readonly type: "SetMembers" | "Execute" | "Propose" | "Vote" | "DisapproveProposal" | "Close";
  }

  /** @name PalletMembershipCall (217) */
  interface PalletMembershipCall extends Enum {
    readonly isAddMember: boolean;
    readonly asAddMember: {
      readonly who: MultiAddress;
    } & Struct;
    readonly isRemoveMember: boolean;
    readonly asRemoveMember: {
      readonly who: MultiAddress;
    } & Struct;
    readonly isSwapMember: boolean;
    readonly asSwapMember: {
      readonly remove: MultiAddress;
      readonly add: MultiAddress;
    } & Struct;
    readonly isResetMembers: boolean;
    readonly asResetMembers: {
      readonly members: Vec<AccountId32>;
    } & Struct;
    readonly isChangeKey: boolean;
    readonly asChangeKey: {
      readonly new_: MultiAddress;
    } & Struct;
    readonly isSetPrime: boolean;
    readonly asSetPrime: {
      readonly who: MultiAddress;
    } & Struct;
    readonly isClearPrime: boolean;
    readonly type:
      | "AddMember"
      | "RemoveMember"
      | "SwapMember"
      | "ResetMembers"
      | "ChangeKey"
      | "SetPrime"
      | "ClearPrime";
  }

  /** @name PalletDaoCall (218) */
  interface PalletDaoCall extends Enum {
    readonly isPropose: boolean;
    readonly asPropose: {
      readonly threshold: Compact<u32>;
      readonly action: Call;
      readonly description: Bytes;
      readonly link: Bytes;
      readonly duration: Option<u32>;
    } & Struct;
    readonly isVote: boolean;
    readonly asVote: {
      readonly farmId: u32;
      readonly proposalHash: H256;
      readonly approve: bool;
    } & Struct;
    readonly isVeto: boolean;
    readonly asVeto: {
      readonly proposalHash: H256;
    } & Struct;
    readonly isClose: boolean;
    readonly asClose: {
      readonly proposalHash: H256;
      readonly proposalIndex: Compact<u32>;
    } & Struct;
    readonly type: "Propose" | "Vote" | "Veto" | "Close";
  }

  /** @name PalletValidatorCall (219) */
  interface PalletValidatorCall extends Enum {
    readonly isCreateValidatorRequest: boolean;
    readonly asCreateValidatorRequest: {
      readonly validatorNodeAccount: AccountId32;
      readonly stashAccount: AccountId32;
      readonly description: Bytes;
      readonly tfConnectId: Bytes;
      readonly info: Bytes;
    } & Struct;
    readonly isActivateValidatorNode: boolean;
    readonly isChangeValidatorNodeAccount: boolean;
    readonly asChangeValidatorNodeAccount: {
      readonly newNodeValidatorAccount: AccountId32;
    } & Struct;
    readonly isBond: boolean;
    readonly asBond: {
      readonly validator: MultiAddress;
    } & Struct;
    readonly isApproveValidator: boolean;
    readonly asApproveValidator: {
      readonly validatorAccount: MultiAddress;
    } & Struct;
    readonly isRemoveValidator: boolean;
    readonly asRemoveValidator: {
      readonly validatorAccount: MultiAddress;
    } & Struct;
    readonly type:
      | "CreateValidatorRequest"
      | "ActivateValidatorNode"
      | "ChangeValidatorNodeAccount"
      | "Bond"
      | "ApproveValidator"
      | "RemoveValidator";
  }

  /** @name TfchainRuntimeOriginCaller (220) */
  interface TfchainRuntimeOriginCaller extends Enum {
    readonly isSystem: boolean;
    readonly asSystem: FrameSupportDispatchRawOrigin;
    readonly isVoid: boolean;
    readonly isCouncil: boolean;
    readonly asCouncil: PalletCollectiveRawOrigin;
    readonly type: "System" | "Void" | "Council";
  }

  /** @name FrameSupportDispatchRawOrigin (221) */
  interface FrameSupportDispatchRawOrigin extends Enum {
    readonly isRoot: boolean;
    readonly isSigned: boolean;
    readonly asSigned: AccountId32;
    readonly isNone: boolean;
    readonly type: "Root" | "Signed" | "None";
  }

  /** @name PalletCollectiveRawOrigin (222) */
  interface PalletCollectiveRawOrigin extends Enum {
    readonly isMembers: boolean;
    readonly asMembers: ITuple<[u32, u32]>;
    readonly isMember: boolean;
    readonly asMember: AccountId32;
    readonly isPhantom: boolean;
    readonly type: "Members" | "Member" | "Phantom";
  }

  /** @name PalletUtilityError (223) */
  interface PalletUtilityError extends Enum {
    readonly isTooManyCalls: boolean;
    readonly type: "TooManyCalls";
  }

  /** @name PalletSchedulerScheduled (226) */
  interface PalletSchedulerScheduled extends Struct {
    readonly maybeId: Option<U8aFixed>;
    readonly priority: u8;
    readonly call: FrameSupportPreimagesBounded;
    readonly maybePeriodic: Option<ITuple<[u32, u32]>>;
    readonly origin: TfchainRuntimeOriginCaller;
  }

  /** @name FrameSupportPreimagesBounded (227) */
  interface FrameSupportPreimagesBounded extends Enum {
    readonly isLegacy: boolean;
    readonly asLegacy: {
      readonly hash_: H256;
    } & Struct;
    readonly isInline: boolean;
    readonly asInline: Bytes;
    readonly isLookup: boolean;
    readonly asLookup: {
      readonly hash_: H256;
      readonly len: u32;
    } & Struct;
    readonly type: "Legacy" | "Inline" | "Lookup";
  }

  /** @name PalletSchedulerError (229) */
  interface PalletSchedulerError extends Enum {
    readonly isFailedToSchedule: boolean;
    readonly isNotFound: boolean;
    readonly isTargetBlockNumberInPast: boolean;
    readonly isRescheduleNoChange: boolean;
    readonly isNamed: boolean;
    readonly type: "FailedToSchedule" | "NotFound" | "TargetBlockNumberInPast" | "RescheduleNoChange" | "Named";
  }

  /** @name SubstrateValidatorSetError (230) */
  interface SubstrateValidatorSetError extends Enum {
    readonly isTooLowValidatorCount: boolean;
    readonly isDuplicate: boolean;
    readonly isValidatorNotApproved: boolean;
    readonly isBadOrigin: boolean;
    readonly type: "TooLowValidatorCount" | "Duplicate" | "ValidatorNotApproved" | "BadOrigin";
  }

  /** @name SpCoreCryptoKeyTypeId (235) */
  interface SpCoreCryptoKeyTypeId extends U8aFixed {}

  /** @name PalletSessionError (236) */
  interface PalletSessionError extends Enum {
    readonly isInvalidProof: boolean;
    readonly isNoAssociatedValidatorId: boolean;
    readonly isDuplicatedKey: boolean;
    readonly isNoKeys: boolean;
    readonly isNoAccount: boolean;
    readonly type: "InvalidProof" | "NoAssociatedValidatorId" | "DuplicatedKey" | "NoKeys" | "NoAccount";
  }

  /** @name PalletGrandpaStoredState (240) */
  interface PalletGrandpaStoredState extends Enum {
    readonly isLive: boolean;
    readonly isPendingPause: boolean;
    readonly asPendingPause: {
      readonly scheduledAt: u32;
      readonly delay: u32;
    } & Struct;
    readonly isPaused: boolean;
    readonly isPendingResume: boolean;
    readonly asPendingResume: {
      readonly scheduledAt: u32;
      readonly delay: u32;
    } & Struct;
    readonly type: "Live" | "PendingPause" | "Paused" | "PendingResume";
  }

  /** @name PalletGrandpaStoredPendingChange (241) */
  interface PalletGrandpaStoredPendingChange extends Struct {
    readonly scheduledAt: u32;
    readonly delay: u32;
    readonly nextAuthorities: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>;
    readonly forced: Option<u32>;
  }

  /** @name PalletGrandpaError (243) */
  interface PalletGrandpaError extends Enum {
    readonly isPauseFailed: boolean;
    readonly isResumeFailed: boolean;
    readonly isChangePending: boolean;
    readonly isTooSoon: boolean;
    readonly isInvalidKeyOwnershipProof: boolean;
    readonly isInvalidEquivocationProof: boolean;
    readonly isDuplicateOffenceReport: boolean;
    readonly type:
      | "PauseFailed"
      | "ResumeFailed"
      | "ChangePending"
      | "TooSoon"
      | "InvalidKeyOwnershipProof"
      | "InvalidEquivocationProof"
      | "DuplicateOffenceReport";
  }

  /** @name PalletBalancesBalanceLock (245) */
  interface PalletBalancesBalanceLock extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
    readonly reasons: PalletBalancesReasons;
  }

  /** @name PalletBalancesReasons (246) */
  interface PalletBalancesReasons extends Enum {
    readonly isFee: boolean;
    readonly isMisc: boolean;
    readonly isAll: boolean;
    readonly type: "Fee" | "Misc" | "All";
  }

  /** @name PalletBalancesReserveData (249) */
  interface PalletBalancesReserveData extends Struct {
    readonly id: U8aFixed;
    readonly amount: u128;
  }

  /** @name PalletBalancesIdAmount (252) */
  interface PalletBalancesIdAmount extends Struct {
    readonly id: Null;
    readonly amount: u128;
  }

  /** @name PalletBalancesError (254) */
  interface PalletBalancesError extends Enum {
    readonly isVestingBalance: boolean;
    readonly isLiquidityRestrictions: boolean;
    readonly isInsufficientBalance: boolean;
    readonly isExistentialDeposit: boolean;
    readonly isExpendability: boolean;
    readonly isExistingVestingSchedule: boolean;
    readonly isDeadAccount: boolean;
    readonly isTooManyReserves: boolean;
    readonly isTooManyHolds: boolean;
    readonly isTooManyFreezes: boolean;
    readonly type:
      | "VestingBalance"
      | "LiquidityRestrictions"
      | "InsufficientBalance"
      | "ExistentialDeposit"
      | "Expendability"
      | "ExistingVestingSchedule"
      | "DeadAccount"
      | "TooManyReserves"
      | "TooManyHolds"
      | "TooManyFreezes";
  }

  /** @name PalletTransactionPaymentReleases (256) */
  interface PalletTransactionPaymentReleases extends Enum {
    readonly isV1Ancient: boolean;
    readonly isV2: boolean;
    readonly type: "V1Ancient" | "V2";
  }

  /** @name PalletTfgridTermsCondTermsAndConditions (258) */
  interface PalletTfgridTermsCondTermsAndConditions extends Struct {
    readonly accountId: AccountId32;
    readonly timestamp: u64;
    readonly documentLink: Bytes;
    readonly documentHash: Bytes;
  }

  /** @name TfchainSupportNodePower (259) */
  interface TfchainSupportNodePower extends Struct {
    readonly state: TfchainSupportPowerState;
    readonly target: TfchainSupportPower;
  }

  /** @name PalletTfgridError (260) */
  interface PalletTfgridError extends Enum {
    readonly isNoneValue: boolean;
    readonly isStorageOverflow: boolean;
    readonly isCannotCreateNode: boolean;
    readonly isNodeNotExists: boolean;
    readonly isNodeWithTwinIdExists: boolean;
    readonly isCannotDeleteNode: boolean;
    readonly isNodeDeleteNotAuthorized: boolean;
    readonly isNodeUpdateNotAuthorized: boolean;
    readonly isFarmExists: boolean;
    readonly isFarmNotExists: boolean;
    readonly isCannotCreateFarmWrongTwin: boolean;
    readonly isCannotUpdateFarmWrongTwin: boolean;
    readonly isCannotDeleteFarm: boolean;
    readonly isCannotDeleteFarmWithPublicIPs: boolean;
    readonly isCannotDeleteFarmWithNodesAssigned: boolean;
    readonly isCannotDeleteFarmWrongTwin: boolean;
    readonly isIpExists: boolean;
    readonly isIpNotExists: boolean;
    readonly isEntityWithNameExists: boolean;
    readonly isEntityWithPubkeyExists: boolean;
    readonly isEntityNotExists: boolean;
    readonly isEntitySignatureDoesNotMatch: boolean;
    readonly isEntityWithSignatureAlreadyExists: boolean;
    readonly isCannotUpdateEntity: boolean;
    readonly isCannotDeleteEntity: boolean;
    readonly isSignatureLengthIsIncorrect: boolean;
    readonly isTwinExists: boolean;
    readonly isTwinNotExists: boolean;
    readonly isTwinWithPubkeyExists: boolean;
    readonly isCannotCreateTwin: boolean;
    readonly isUnauthorizedToUpdateTwin: boolean;
    readonly isTwinCannotBoundToItself: boolean;
    readonly isPricingPolicyExists: boolean;
    readonly isPricingPolicyNotExists: boolean;
    readonly isPricingPolicyWithDifferentIdExists: boolean;
    readonly isCertificationCodeExists: boolean;
    readonly isFarmingPolicyAlreadyExists: boolean;
    readonly isFarmPayoutAdressAlreadyRegistered: boolean;
    readonly isFarmerDoesNotHaveEnoughFunds: boolean;
    readonly isUserDidNotSignTermsAndConditions: boolean;
    readonly isFarmerDidNotSignTermsAndConditions: boolean;
    readonly isFarmerNotAuthorized: boolean;
    readonly isInvalidFarmName: boolean;
    readonly isAlreadyCertifier: boolean;
    readonly isNotCertifier: boolean;
    readonly isNotAllowedToCertifyNode: boolean;
    readonly isFarmingPolicyNotExists: boolean;
    readonly isRelayTooShort: boolean;
    readonly isRelayTooLong: boolean;
    readonly isInvalidRelay: boolean;
    readonly isFarmNameTooShort: boolean;
    readonly isFarmNameTooLong: boolean;
    readonly isInvalidPublicIP: boolean;
    readonly isPublicIPTooShort: boolean;
    readonly isPublicIPTooLong: boolean;
    readonly isGatewayIPTooShort: boolean;
    readonly isGatewayIPTooLong: boolean;
    readonly isIp4TooShort: boolean;
    readonly isIp4TooLong: boolean;
    readonly isInvalidIP4: boolean;
    readonly isGw4TooShort: boolean;
    readonly isGw4TooLong: boolean;
    readonly isInvalidGW4: boolean;
    readonly isIp6TooShort: boolean;
    readonly isIp6TooLong: boolean;
    readonly isInvalidIP6: boolean;
    readonly isGw6TooShort: boolean;
    readonly isGw6TooLong: boolean;
    readonly isInvalidGW6: boolean;
    readonly isDomainTooShort: boolean;
    readonly isDomainTooLong: boolean;
    readonly isInvalidDomain: boolean;
    readonly isMethodIsDeprecated: boolean;
    readonly isInterfaceNameTooShort: boolean;
    readonly isInterfaceNameTooLong: boolean;
    readonly isInvalidInterfaceName: boolean;
    readonly isInterfaceMacTooShort: boolean;
    readonly isInterfaceMacTooLong: boolean;
    readonly isInvalidMacAddress: boolean;
    readonly isInterfaceIpTooShort: boolean;
    readonly isInterfaceIpTooLong: boolean;
    readonly isInvalidInterfaceIP: boolean;
    readonly isInvalidZosVersion: boolean;
    readonly isFarmingPolicyExpired: boolean;
    readonly isInvalidHRUInput: boolean;
    readonly isInvalidSRUInput: boolean;
    readonly isInvalidCRUInput: boolean;
    readonly isInvalidMRUInput: boolean;
    readonly isLatitudeInputTooShort: boolean;
    readonly isLatitudeInputTooLong: boolean;
    readonly isInvalidLatitudeInput: boolean;
    readonly isLongitudeInputTooShort: boolean;
    readonly isLongitudeInputTooLong: boolean;
    readonly isInvalidLongitudeInput: boolean;
    readonly isCountryNameTooShort: boolean;
    readonly isCountryNameTooLong: boolean;
    readonly isInvalidCountryName: boolean;
    readonly isCityNameTooShort: boolean;
    readonly isCityNameTooLong: boolean;
    readonly isInvalidCityName: boolean;
    readonly isInvalidCountryCityPair: boolean;
    readonly isSerialNumberTooShort: boolean;
    readonly isSerialNumberTooLong: boolean;
    readonly isInvalidSerialNumber: boolean;
    readonly isDocumentLinkInputTooShort: boolean;
    readonly isDocumentLinkInputTooLong: boolean;
    readonly isInvalidDocumentLinkInput: boolean;
    readonly isDocumentHashInputTooShort: boolean;
    readonly isDocumentHashInputTooLong: boolean;
    readonly isInvalidDocumentHashInput: boolean;
    readonly isInvalidPublicConfig: boolean;
    readonly isUnauthorizedToChangePowerTarget: boolean;
    readonly isNodeHasActiveContracts: boolean;
    readonly isInvalidRelayAddress: boolean;
    readonly isInvalidTimestampHint: boolean;
    readonly isInvalidStorageInput: boolean;
    readonly type:
      | "NoneValue"
      | "StorageOverflow"
      | "CannotCreateNode"
      | "NodeNotExists"
      | "NodeWithTwinIdExists"
      | "CannotDeleteNode"
      | "NodeDeleteNotAuthorized"
      | "NodeUpdateNotAuthorized"
      | "FarmExists"
      | "FarmNotExists"
      | "CannotCreateFarmWrongTwin"
      | "CannotUpdateFarmWrongTwin"
      | "CannotDeleteFarm"
      | "CannotDeleteFarmWithPublicIPs"
      | "CannotDeleteFarmWithNodesAssigned"
      | "CannotDeleteFarmWrongTwin"
      | "IpExists"
      | "IpNotExists"
      | "EntityWithNameExists"
      | "EntityWithPubkeyExists"
      | "EntityNotExists"
      | "EntitySignatureDoesNotMatch"
      | "EntityWithSignatureAlreadyExists"
      | "CannotUpdateEntity"
      | "CannotDeleteEntity"
      | "SignatureLengthIsIncorrect"
      | "TwinExists"
      | "TwinNotExists"
      | "TwinWithPubkeyExists"
      | "CannotCreateTwin"
      | "UnauthorizedToUpdateTwin"
      | "TwinCannotBoundToItself"
      | "PricingPolicyExists"
      | "PricingPolicyNotExists"
      | "PricingPolicyWithDifferentIdExists"
      | "CertificationCodeExists"
      | "FarmingPolicyAlreadyExists"
      | "FarmPayoutAdressAlreadyRegistered"
      | "FarmerDoesNotHaveEnoughFunds"
      | "UserDidNotSignTermsAndConditions"
      | "FarmerDidNotSignTermsAndConditions"
      | "FarmerNotAuthorized"
      | "InvalidFarmName"
      | "AlreadyCertifier"
      | "NotCertifier"
      | "NotAllowedToCertifyNode"
      | "FarmingPolicyNotExists"
      | "RelayTooShort"
      | "RelayTooLong"
      | "InvalidRelay"
      | "FarmNameTooShort"
      | "FarmNameTooLong"
      | "InvalidPublicIP"
      | "PublicIPTooShort"
      | "PublicIPTooLong"
      | "GatewayIPTooShort"
      | "GatewayIPTooLong"
      | "Ip4TooShort"
      | "Ip4TooLong"
      | "InvalidIP4"
      | "Gw4TooShort"
      | "Gw4TooLong"
      | "InvalidGW4"
      | "Ip6TooShort"
      | "Ip6TooLong"
      | "InvalidIP6"
      | "Gw6TooShort"
      | "Gw6TooLong"
      | "InvalidGW6"
      | "DomainTooShort"
      | "DomainTooLong"
      | "InvalidDomain"
      | "MethodIsDeprecated"
      | "InterfaceNameTooShort"
      | "InterfaceNameTooLong"
      | "InvalidInterfaceName"
      | "InterfaceMacTooShort"
      | "InterfaceMacTooLong"
      | "InvalidMacAddress"
      | "InterfaceIpTooShort"
      | "InterfaceIpTooLong"
      | "InvalidInterfaceIP"
      | "InvalidZosVersion"
      | "FarmingPolicyExpired"
      | "InvalidHRUInput"
      | "InvalidSRUInput"
      | "InvalidCRUInput"
      | "InvalidMRUInput"
      | "LatitudeInputTooShort"
      | "LatitudeInputTooLong"
      | "InvalidLatitudeInput"
      | "LongitudeInputTooShort"
      | "LongitudeInputTooLong"
      | "InvalidLongitudeInput"
      | "CountryNameTooShort"
      | "CountryNameTooLong"
      | "InvalidCountryName"
      | "CityNameTooShort"
      | "CityNameTooLong"
      | "InvalidCityName"
      | "InvalidCountryCityPair"
      | "SerialNumberTooShort"
      | "SerialNumberTooLong"
      | "InvalidSerialNumber"
      | "DocumentLinkInputTooShort"
      | "DocumentLinkInputTooLong"
      | "InvalidDocumentLinkInput"
      | "DocumentHashInputTooShort"
      | "DocumentHashInputTooLong"
      | "InvalidDocumentHashInput"
      | "InvalidPublicConfig"
      | "UnauthorizedToChangePowerTarget"
      | "NodeHasActiveContracts"
      | "InvalidRelayAddress"
      | "InvalidTimestampHint"
      | "InvalidStorageInput";
  }

  /** @name PalletSmartContractContractBillingInformation (261) */
  interface PalletSmartContractContractBillingInformation extends Struct {
    readonly previousNuReported: u64;
    readonly lastUpdated: u64;
    readonly amountUnbilled: u64;
  }

  /** @name PalletSmartContractContractLock (264) */
  interface PalletSmartContractContractLock extends Struct {
    readonly amountLocked: u128;
    readonly extraAmountLocked: u128;
    readonly lockUpdated: u64;
    readonly cycles: u16;
  }

  /** @name PalletSmartContractStorageVersion (265) */
  interface PalletSmartContractStorageVersion extends Enum {
    readonly isV1: boolean;
    readonly isV2: boolean;
    readonly isV3: boolean;
    readonly isV4: boolean;
    readonly isV5: boolean;
    readonly isV6: boolean;
    readonly isV7: boolean;
    readonly isV8: boolean;
    readonly isV9: boolean;
    readonly isV10: boolean;
    readonly isV11: boolean;
    readonly isV12: boolean;
    readonly type: "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7" | "V8" | "V9" | "V10" | "V11" | "V12";
  }

  /** @name PalletSmartContractContractPaymentState (266) */
  interface PalletSmartContractContractPaymentState extends Struct {
    readonly standardReserve: u128;
    readonly additionalReserve: u128;
    readonly standardOverdraft: u128;
    readonly additionalOverdraft: u128;
    readonly lastUpdatedSeconds: u64;
    readonly cycles: u16;
  }

  /** @name PalletSmartContractError (267) */
  interface PalletSmartContractError extends Enum {
    readonly isTwinNotExists: boolean;
    readonly isNodeNotExists: boolean;
    readonly isFarmNotExists: boolean;
    readonly isFarmHasNotEnoughPublicIPs: boolean;
    readonly isFarmHasNotEnoughPublicIPsFree: boolean;
    readonly isFailedToReserveIP: boolean;
    readonly isFailedToFreeIPs: boolean;
    readonly isContractNotExists: boolean;
    readonly isTwinNotAuthorizedToUpdateContract: boolean;
    readonly isTwinNotAuthorizedToCancelContract: boolean;
    readonly isNodeNotAuthorizedToDeployContract: boolean;
    readonly isNodeNotAuthorizedToComputeReport: boolean;
    readonly isPricingPolicyNotExists: boolean;
    readonly isContractIsNotUnique: boolean;
    readonly isContractWrongBillingLoopIndex: boolean;
    readonly isNameExists: boolean;
    readonly isNameNotValid: boolean;
    readonly isInvalidContractType: boolean;
    readonly isTftPriceValueError: boolean;
    readonly isNotEnoughResourcesOnNode: boolean;
    readonly isNodeNotAuthorizedToReportResources: boolean;
    readonly isMethodIsDeprecated: boolean;
    readonly isNodeHasActiveContracts: boolean;
    readonly isNodeHasRentContract: boolean;
    readonly isFarmIsNotDedicated: boolean;
    readonly isNodeNotAvailableToDeploy: boolean;
    readonly isCannotUpdateContractInGraceState: boolean;
    readonly isNumOverflow: boolean;
    readonly isOffchainSignedTxCannotSign: boolean;
    readonly isOffchainSignedTxAlreadySent: boolean;
    readonly isOffchainSignedTxNoLocalAccountAvailable: boolean;
    readonly isNameContractNameTooShort: boolean;
    readonly isNameContractNameTooLong: boolean;
    readonly isInvalidProviderConfiguration: boolean;
    readonly isNoSuchSolutionProvider: boolean;
    readonly isSolutionProviderNotApproved: boolean;
    readonly isTwinNotAuthorized: boolean;
    readonly isServiceContractNotExists: boolean;
    readonly isServiceContractCreationNotAllowed: boolean;
    readonly isServiceContractModificationNotAllowed: boolean;
    readonly isServiceContractApprovalNotAllowed: boolean;
    readonly isServiceContractRejectionNotAllowed: boolean;
    readonly isServiceContractBillingNotApprovedByBoth: boolean;
    readonly isServiceContractBillingVariableAmountTooHigh: boolean;
    readonly isServiceContractBillMetadataTooLong: boolean;
    readonly isServiceContractMetadataTooLong: boolean;
    readonly isServiceContractNotEnoughFundsToPayBill: boolean;
    readonly isCanOnlyIncreaseFrequency: boolean;
    readonly isIsNotAnAuthority: boolean;
    readonly isWrongAuthority: boolean;
    readonly isUnauthorizedToChangeSolutionProviderId: boolean;
    readonly isUnauthorizedToSetExtraFee: boolean;
    readonly isRewardDistributionError: boolean;
    readonly isContractPaymentStateNotExists: boolean;
    readonly type:
      | "TwinNotExists"
      | "NodeNotExists"
      | "FarmNotExists"
      | "FarmHasNotEnoughPublicIPs"
      | "FarmHasNotEnoughPublicIPsFree"
      | "FailedToReserveIP"
      | "FailedToFreeIPs"
      | "ContractNotExists"
      | "TwinNotAuthorizedToUpdateContract"
      | "TwinNotAuthorizedToCancelContract"
      | "NodeNotAuthorizedToDeployContract"
      | "NodeNotAuthorizedToComputeReport"
      | "PricingPolicyNotExists"
      | "ContractIsNotUnique"
      | "ContractWrongBillingLoopIndex"
      | "NameExists"
      | "NameNotValid"
      | "InvalidContractType"
      | "TftPriceValueError"
      | "NotEnoughResourcesOnNode"
      | "NodeNotAuthorizedToReportResources"
      | "MethodIsDeprecated"
      | "NodeHasActiveContracts"
      | "NodeHasRentContract"
      | "FarmIsNotDedicated"
      | "NodeNotAvailableToDeploy"
      | "CannotUpdateContractInGraceState"
      | "NumOverflow"
      | "OffchainSignedTxCannotSign"
      | "OffchainSignedTxAlreadySent"
      | "OffchainSignedTxNoLocalAccountAvailable"
      | "NameContractNameTooShort"
      | "NameContractNameTooLong"
      | "InvalidProviderConfiguration"
      | "NoSuchSolutionProvider"
      | "SolutionProviderNotApproved"
      | "TwinNotAuthorized"
      | "ServiceContractNotExists"
      | "ServiceContractCreationNotAllowed"
      | "ServiceContractModificationNotAllowed"
      | "ServiceContractApprovalNotAllowed"
      | "ServiceContractRejectionNotAllowed"
      | "ServiceContractBillingNotApprovedByBoth"
      | "ServiceContractBillingVariableAmountTooHigh"
      | "ServiceContractBillMetadataTooLong"
      | "ServiceContractMetadataTooLong"
      | "ServiceContractNotEnoughFundsToPayBill"
      | "CanOnlyIncreaseFrequency"
      | "IsNotAnAuthority"
      | "WrongAuthority"
      | "UnauthorizedToChangeSolutionProviderId"
      | "UnauthorizedToSetExtraFee"
      | "RewardDistributionError"
      | "ContractPaymentStateNotExists";
  }

  /** @name PalletTftBridgeStorageVersion (268) */
  interface PalletTftBridgeStorageVersion extends Enum {
    readonly isV1: boolean;
    readonly isV2: boolean;
    readonly type: "V1" | "V2";
  }

  /** @name PalletTftBridgeError (269) */
  interface PalletTftBridgeError extends Enum {
    readonly isValidatorExists: boolean;
    readonly isValidatorNotExists: boolean;
    readonly isTransactionValidatorExists: boolean;
    readonly isTransactionValidatorNotExists: boolean;
    readonly isMintTransactionExists: boolean;
    readonly isMintTransactionAlreadyExecuted: boolean;
    readonly isMintTransactionNotExists: boolean;
    readonly isBurnTransactionExists: boolean;
    readonly isBurnTransactionNotExists: boolean;
    readonly isBurnSignatureExists: boolean;
    readonly isEnoughBurnSignaturesPresent: boolean;
    readonly isRefundSignatureExists: boolean;
    readonly isBurnTransactionAlreadyExecuted: boolean;
    readonly isRefundTransactionNotExists: boolean;
    readonly isRefundTransactionAlreadyExecuted: boolean;
    readonly isEnoughRefundSignaturesPresent: boolean;
    readonly isNotEnoughBalanceToSwap: boolean;
    readonly isAmountIsLessThanWithdrawFee: boolean;
    readonly isAmountIsLessThanDepositFee: boolean;
    readonly isWrongParametersProvided: boolean;
    readonly isInvalidStellarPublicKey: boolean;
    readonly type:
      | "ValidatorExists"
      | "ValidatorNotExists"
      | "TransactionValidatorExists"
      | "TransactionValidatorNotExists"
      | "MintTransactionExists"
      | "MintTransactionAlreadyExecuted"
      | "MintTransactionNotExists"
      | "BurnTransactionExists"
      | "BurnTransactionNotExists"
      | "BurnSignatureExists"
      | "EnoughBurnSignaturesPresent"
      | "RefundSignatureExists"
      | "BurnTransactionAlreadyExecuted"
      | "RefundTransactionNotExists"
      | "RefundTransactionAlreadyExecuted"
      | "EnoughRefundSignaturesPresent"
      | "NotEnoughBalanceToSwap"
      | "AmountIsLessThanWithdrawFee"
      | "AmountIsLessThanDepositFee"
      | "WrongParametersProvided"
      | "InvalidStellarPublicKey";
  }

  /** @name PalletTftPriceError (271) */
  interface PalletTftPriceError extends Enum {
    readonly isErrFetchingPrice: boolean;
    readonly isOffchainSignedTxError: boolean;
    readonly isNoLocalAcctForSigning: boolean;
    readonly isAccountUnauthorizedToSetPrice: boolean;
    readonly isMaxPriceBelowMinPriceError: boolean;
    readonly isMinPriceAboveMaxPriceError: boolean;
    readonly isIsNotAnAuthority: boolean;
    readonly isWrongAuthority: boolean;
    readonly type:
      | "ErrFetchingPrice"
      | "OffchainSignedTxError"
      | "NoLocalAcctForSigning"
      | "AccountUnauthorizedToSetPrice"
      | "MaxPriceBelowMinPriceError"
      | "MinPriceAboveMaxPriceError"
      | "IsNotAnAuthority"
      | "WrongAuthority";
  }

  /** @name PalletBurningBurn (273) */
  interface PalletBurningBurn extends Struct {
    readonly target: AccountId32;
    readonly amount: u128;
    readonly block: u32;
    readonly message: Bytes;
  }

  /** @name PalletBurningError (274) */
  interface PalletBurningError extends Enum {
    readonly isNotEnoughBalanceToBurn: boolean;
    readonly type: "NotEnoughBalanceToBurn";
  }

  /** @name PalletKvstoreError (276) */
  interface PalletKvstoreError extends Enum {
    readonly isNoValueStored: boolean;
    readonly isKeyIsTooLarge: boolean;
    readonly isValueIsTooLarge: boolean;
    readonly type: "NoValueStored" | "KeyIsTooLarge" | "ValueIsTooLarge";
  }

  /** @name PalletCollectiveVotes (278) */
  interface PalletCollectiveVotes extends Struct {
    readonly index: u32;
    readonly threshold: u32;
    readonly ayes: Vec<AccountId32>;
    readonly nays: Vec<AccountId32>;
    readonly end: u32;
  }

  /** @name PalletCollectiveError (279) */
  interface PalletCollectiveError extends Enum {
    readonly isNotMember: boolean;
    readonly isDuplicateProposal: boolean;
    readonly isProposalMissing: boolean;
    readonly isWrongIndex: boolean;
    readonly isDuplicateVote: boolean;
    readonly isAlreadyInitialized: boolean;
    readonly isTooEarly: boolean;
    readonly isTooManyProposals: boolean;
    readonly isWrongProposalWeight: boolean;
    readonly isWrongProposalLength: boolean;
    readonly isPrimeAccountNotMember: boolean;
    readonly type:
      | "NotMember"
      | "DuplicateProposal"
      | "ProposalMissing"
      | "WrongIndex"
      | "DuplicateVote"
      | "AlreadyInitialized"
      | "TooEarly"
      | "TooManyProposals"
      | "WrongProposalWeight"
      | "WrongProposalLength"
      | "PrimeAccountNotMember";
  }

  /** @name PalletMembershipError (281) */
  interface PalletMembershipError extends Enum {
    readonly isAlreadyMember: boolean;
    readonly isNotMember: boolean;
    readonly isTooManyMembers: boolean;
    readonly type: "AlreadyMember" | "NotMember" | "TooManyMembers";
  }

  /** @name PalletDaoProposalDaoProposal (282) */
  interface PalletDaoProposalDaoProposal extends Struct {
    readonly index: u32;
    readonly description: Bytes;
    readonly link: Bytes;
  }

  /** @name PalletDaoProposalDaoVotes (283) */
  interface PalletDaoProposalDaoVotes extends Struct {
    readonly index: u32;
    readonly threshold: u32;
    readonly ayes: Vec<PalletDaoProposalVoteWeight>;
    readonly nays: Vec<PalletDaoProposalVoteWeight>;
    readonly end: u32;
    readonly vetos: Vec<AccountId32>;
  }

  /** @name PalletDaoProposalVoteWeight (285) */
  interface PalletDaoProposalVoteWeight extends Struct {
    readonly farmId: u32;
    readonly weight: u64;
  }

  /** @name PalletDaoError (286) */
  interface PalletDaoError extends Enum {
    readonly isNoneValue: boolean;
    readonly isStorageOverflow: boolean;
    readonly isFarmNotExists: boolean;
    readonly isNotCouncilMember: boolean;
    readonly isWrongProposalLength: boolean;
    readonly isDuplicateProposal: boolean;
    readonly isNotAuthorizedToVote: boolean;
    readonly isProposalMissing: boolean;
    readonly isWrongIndex: boolean;
    readonly isDuplicateVote: boolean;
    readonly isDuplicateVeto: boolean;
    readonly isWrongProposalWeight: boolean;
    readonly isTooEarly: boolean;
    readonly isTimeLimitReached: boolean;
    readonly isOngoingVoteAndTresholdStillNotMet: boolean;
    readonly isFarmHasNoNodes: boolean;
    readonly isInvalidProposalDuration: boolean;
    readonly isThresholdTooLow: boolean;
    readonly type:
      | "NoneValue"
      | "StorageOverflow"
      | "FarmNotExists"
      | "NotCouncilMember"
      | "WrongProposalLength"
      | "DuplicateProposal"
      | "NotAuthorizedToVote"
      | "ProposalMissing"
      | "WrongIndex"
      | "DuplicateVote"
      | "DuplicateVeto"
      | "WrongProposalWeight"
      | "TooEarly"
      | "TimeLimitReached"
      | "OngoingVoteAndTresholdStillNotMet"
      | "FarmHasNoNodes"
      | "InvalidProposalDuration"
      | "ThresholdTooLow";
  }

  /** @name PalletValidatorError (287) */
  interface PalletValidatorError extends Enum {
    readonly isBadOrigin: boolean;
    readonly isNotCouncilMember: boolean;
    readonly isAlreadyBonded: boolean;
    readonly isStashNotBonded: boolean;
    readonly isStashBondedWithWrongValidator: boolean;
    readonly isCannotBondWithSameAccount: boolean;
    readonly isDuplicateValidator: boolean;
    readonly isValidatorNotFound: boolean;
    readonly isValidatorNotApproved: boolean;
    readonly isUnauthorizedToActivateValidator: boolean;
    readonly isValidatorValidatingAlready: boolean;
    readonly isValidatorNotValidating: boolean;
    readonly type:
      | "BadOrigin"
      | "NotCouncilMember"
      | "AlreadyBonded"
      | "StashNotBonded"
      | "StashBondedWithWrongValidator"
      | "CannotBondWithSameAccount"
      | "DuplicateValidator"
      | "ValidatorNotFound"
      | "ValidatorNotApproved"
      | "UnauthorizedToActivateValidator"
      | "ValidatorValidatingAlready"
      | "ValidatorNotValidating";
  }

  /** @name SpRuntimeMultiSignature (289) */
  interface SpRuntimeMultiSignature extends Enum {
    readonly isEd25519: boolean;
    readonly asEd25519: SpCoreEd25519Signature;
    readonly isSr25519: boolean;
    readonly asSr25519: SpCoreSr25519Signature;
    readonly isEcdsa: boolean;
    readonly asEcdsa: SpCoreEcdsaSignature;
    readonly type: "Ed25519" | "Sr25519" | "Ecdsa";
  }

  /** @name SpCoreSr25519Signature (290) */
  interface SpCoreSr25519Signature extends U8aFixed {}

  /** @name SpCoreEcdsaSignature (291) */
  interface SpCoreEcdsaSignature extends U8aFixed {}

  /** @name FrameSystemExtensionsCheckNonZeroSender (294) */
  type FrameSystemExtensionsCheckNonZeroSender = Null;

  /** @name FrameSystemExtensionsCheckSpecVersion (295) */
  type FrameSystemExtensionsCheckSpecVersion = Null;

  /** @name FrameSystemExtensionsCheckTxVersion (296) */
  type FrameSystemExtensionsCheckTxVersion = Null;

  /** @name FrameSystemExtensionsCheckGenesis (297) */
  type FrameSystemExtensionsCheckGenesis = Null;

  /** @name FrameSystemExtensionsCheckNonce (300) */
  interface FrameSystemExtensionsCheckNonce extends Compact<u32> {}

  /** @name FrameSystemExtensionsCheckWeight (301) */
  type FrameSystemExtensionsCheckWeight = Null;

  /** @name PalletTransactionPaymentChargeTransactionPayment (302) */
  interface PalletTransactionPaymentChargeTransactionPayment extends Compact<u128> {}

  /** @name PalletSmartContractContractIdProvides (303) */
  type PalletSmartContractContractIdProvides = Null;

  /** @name TfchainRuntimeRuntime (304) */
  type TfchainRuntimeRuntime = Null;
} // declare module
