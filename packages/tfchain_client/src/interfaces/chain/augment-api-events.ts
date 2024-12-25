// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import "@polkadot/api-base/types/events";

import type { ApiTypes, AugmentedEvent } from "@polkadot/api-base/types";
import type { Bytes, Null, Option, Result, U8aFixed, Vec, bool, u128, u32, u64 } from "@polkadot/types-codec";
import type { ITuple } from "@polkadot/types-codec/types";
import type { AccountId32, H256 } from "@polkadot/types/interfaces/runtime";
import type {
  FrameSupportDispatchDispatchInfo,
  FrameSupportTokensMiscBalanceStatus,
  PalletSmartContractCause,
  PalletSmartContractConsumption,
  PalletSmartContractContract,
  PalletSmartContractContractBill,
  PalletSmartContractContractResources,
  PalletSmartContractNruConsumption,
  PalletSmartContractServiceContract,
  PalletSmartContractServiceContractBill,
  PalletSmartContractSolutionProvider,
  PalletTfgridEntity,
  PalletTfgridFarmingPolicy,
  PalletTfgridPricingPolicy,
  PalletTfgridTwin,
  PalletTftBridgeBurnTransaction,
  PalletTftBridgeMintTransaction,
  PalletTftBridgeRefundTransaction,
  PalletTftBridgeStellarSignature,
  PalletValidatorValidator,
  SpConsensusGrandpaAppPublic,
  SpRuntimeDispatchError,
  TfchainSupportFarm,
  TfchainSupportFarmCertification,
  TfchainSupportFarmingPolicyLimit,
  TfchainSupportNode,
  TfchainSupportNodeCertification,
  TfchainSupportPower,
  TfchainSupportPowerState,
  TfchainSupportPublicConfig,
  TfchainSupportPublicIP,
} from "@polkadot/types/lookup";

export type __AugmentedEvent<ApiType extends ApiTypes> = AugmentedEvent<ApiType>;

declare module "@polkadot/api-base/types/events" {
  interface AugmentedEvents<ApiType extends ApiTypes> {
    balances: {
      /**
       * A balance was set by root.
       **/
      BalanceSet: AugmentedEvent<ApiType, [who: AccountId32, free: u128], { who: AccountId32; free: u128 }>;
      /**
       * Some amount was burned from an account.
       **/
      Burned: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Some amount was deposited (e.g. for transaction fees).
       **/
      Deposit: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * An account was removed whose balance was non-zero but below ExistentialDeposit,
       * resulting in an outright loss.
       **/
      DustLost: AugmentedEvent<ApiType, [account: AccountId32, amount: u128], { account: AccountId32; amount: u128 }>;
      /**
       * An account was created with some free balance.
       **/
      Endowed: AugmentedEvent<
        ApiType,
        [account: AccountId32, freeBalance: u128],
        { account: AccountId32; freeBalance: u128 }
      >;
      /**
       * Some balance was frozen.
       **/
      Frozen: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Total issuance was increased by `amount`, creating a credit to be balanced.
       **/
      Issued: AugmentedEvent<ApiType, [amount: u128], { amount: u128 }>;
      /**
       * Some balance was locked.
       **/
      Locked: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Some amount was minted into an account.
       **/
      Minted: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Total issuance was decreased by `amount`, creating a debt to be balanced.
       **/
      Rescinded: AugmentedEvent<ApiType, [amount: u128], { amount: u128 }>;
      /**
       * Some balance was reserved (moved from free to reserved).
       **/
      Reserved: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Some balance was moved from the reserve of the first account to the second account.
       * Final argument indicates the destination balance type.
       **/
      ReserveRepatriated: AugmentedEvent<
        ApiType,
        [from: AccountId32, to: AccountId32, amount: u128, destinationStatus: FrameSupportTokensMiscBalanceStatus],
        { from: AccountId32; to: AccountId32; amount: u128; destinationStatus: FrameSupportTokensMiscBalanceStatus }
      >;
      /**
       * Some amount was restored into an account.
       **/
      Restored: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Some amount was removed from the account (e.g. for misbehavior).
       **/
      Slashed: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Some amount was suspended from an account (it can be restored later).
       **/
      Suspended: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Some balance was thawed.
       **/
      Thawed: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Transfer succeeded.
       **/
      Transfer: AugmentedEvent<
        ApiType,
        [from: AccountId32, to: AccountId32, amount: u128],
        { from: AccountId32; to: AccountId32; amount: u128 }
      >;
      /**
       * Some balance was unlocked.
       **/
      Unlocked: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Some balance was unreserved (moved from reserved to free).
       **/
      Unreserved: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * An account was upgraded.
       **/
      Upgraded: AugmentedEvent<ApiType, [who: AccountId32], { who: AccountId32 }>;
      /**
       * Some amount was withdrawn from the account (e.g. for transaction fees).
       **/
      Withdraw: AugmentedEvent<ApiType, [who: AccountId32, amount: u128], { who: AccountId32; amount: u128 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    burningModule: {
      BurnTransactionCreated: AugmentedEvent<ApiType, [AccountId32, u128, u32, Bytes]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    council: {
      /**
       * A motion was approved by the required threshold.
       **/
      Approved: AugmentedEvent<ApiType, [proposalHash: H256], { proposalHash: H256 }>;
      /**
       * A proposal was closed because its threshold was reached or after its duration was up.
       **/
      Closed: AugmentedEvent<
        ApiType,
        [proposalHash: H256, yes: u32, no: u32],
        { proposalHash: H256; yes: u32; no: u32 }
      >;
      /**
       * A motion was not approved by the required threshold.
       **/
      Disapproved: AugmentedEvent<ApiType, [proposalHash: H256], { proposalHash: H256 }>;
      /**
       * A motion was executed; result will be `Ok` if it returned without error.
       **/
      Executed: AugmentedEvent<
        ApiType,
        [proposalHash: H256, result: Result<Null, SpRuntimeDispatchError>],
        { proposalHash: H256; result: Result<Null, SpRuntimeDispatchError> }
      >;
      /**
       * A single member did some action; result will be `Ok` if it returned without error.
       **/
      MemberExecuted: AugmentedEvent<
        ApiType,
        [proposalHash: H256, result: Result<Null, SpRuntimeDispatchError>],
        { proposalHash: H256; result: Result<Null, SpRuntimeDispatchError> }
      >;
      /**
       * A motion (given hash) has been proposed (by given account) with a threshold (given
       * `MemberCount`).
       **/
      Proposed: AugmentedEvent<
        ApiType,
        [account: AccountId32, proposalIndex: u32, proposalHash: H256, threshold: u32],
        { account: AccountId32; proposalIndex: u32; proposalHash: H256; threshold: u32 }
      >;
      /**
       * A motion (given hash) has been voted on by given account, leaving
       * a tally (yes votes and no votes given respectively as `MemberCount`).
       **/
      Voted: AugmentedEvent<
        ApiType,
        [account: AccountId32, proposalHash: H256, voted: bool, yes: u32, no: u32],
        { account: AccountId32; proposalHash: H256; voted: bool; yes: u32; no: u32 }
      >;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    councilMembership: {
      /**
       * Phantom member, never used.
       **/
      Dummy: AugmentedEvent<ApiType, []>;
      /**
       * One of the members' keys changed.
       **/
      KeyChanged: AugmentedEvent<ApiType, []>;
      /**
       * The given member was added; see the transaction for who.
       **/
      MemberAdded: AugmentedEvent<ApiType, []>;
      /**
       * The given member was removed; see the transaction for who.
       **/
      MemberRemoved: AugmentedEvent<ApiType, []>;
      /**
       * The membership was reset; see the transaction for who the new set is.
       **/
      MembersReset: AugmentedEvent<ApiType, []>;
      /**
       * Two members were swapped; see the transaction for who.
       **/
      MembersSwapped: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    dao: {
      /**
       * A motion was approved by the required threshold.
       **/
      Approved: AugmentedEvent<ApiType, [proposalHash: H256], { proposalHash: H256 }>;
      /**
       * A proposal_hash was closed because its threshold was reached or after its duration was up.
       **/
      Closed: AugmentedEvent<
        ApiType,
        [proposalHash: H256, yes: u32, yesWeight: u64, no: u32, noWeight: u64],
        { proposalHash: H256; yes: u32; yesWeight: u64; no: u32; noWeight: u64 }
      >;
      ClosedByCouncil: AugmentedEvent<
        ApiType,
        [proposalHash: H256, vetos: Vec<AccountId32>],
        { proposalHash: H256; vetos: Vec<AccountId32> }
      >;
      CouncilMemberVeto: AugmentedEvent<
        ApiType,
        [proposalHash: H256, who: AccountId32],
        { proposalHash: H256; who: AccountId32 }
      >;
      /**
       * A motion was not approved by the required threshold.
       **/
      Disapproved: AugmentedEvent<ApiType, [proposalHash: H256], { proposalHash: H256 }>;
      /**
       * A motion was executed; result will be `Ok` if it returned without error.
       **/
      Executed: AugmentedEvent<
        ApiType,
        [proposalHash: H256, result: Result<Null, SpRuntimeDispatchError>],
        { proposalHash: H256; result: Result<Null, SpRuntimeDispatchError> }
      >;
      /**
       * A motion (given hash) has been proposed (by given account) with a threshold (given
       * `MemberCount`).
       **/
      Proposed: AugmentedEvent<
        ApiType,
        [account: AccountId32, proposalIndex: u32, proposalHash: H256, threshold: u32],
        { account: AccountId32; proposalIndex: u32; proposalHash: H256; threshold: u32 }
      >;
      Voted: AugmentedEvent<
        ApiType,
        [account: AccountId32, proposalHash: H256, voted: bool, yes: u32, no: u32],
        { account: AccountId32; proposalHash: H256; voted: bool; yes: u32; no: u32 }
      >;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    grandpa: {
      /**
       * New authority set has been applied.
       **/
      NewAuthorities: AugmentedEvent<
        ApiType,
        [authoritySet: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>>],
        { authoritySet: Vec<ITuple<[SpConsensusGrandpaAppPublic, u64]>> }
      >;
      /**
       * Current authority set has been paused.
       **/
      Paused: AugmentedEvent<ApiType, []>;
      /**
       * Current authority set has been resumed.
       **/
      Resumed: AugmentedEvent<ApiType, []>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    scheduler: {
      /**
       * The call for the provided hash was not found so the task has been aborted.
       **/
      CallUnavailable: AugmentedEvent<
        ApiType,
        [task: ITuple<[u32, u32]>, id: Option<U8aFixed>],
        { task: ITuple<[u32, u32]>; id: Option<U8aFixed> }
      >;
      /**
       * Canceled some task.
       **/
      Canceled: AugmentedEvent<ApiType, [when: u32, index: u32], { when: u32; index: u32 }>;
      /**
       * Dispatched some task.
       **/
      Dispatched: AugmentedEvent<
        ApiType,
        [task: ITuple<[u32, u32]>, id: Option<U8aFixed>, result: Result<Null, SpRuntimeDispatchError>],
        { task: ITuple<[u32, u32]>; id: Option<U8aFixed>; result: Result<Null, SpRuntimeDispatchError> }
      >;
      /**
       * The given task was unable to be renewed since the agenda is full at that block.
       **/
      PeriodicFailed: AugmentedEvent<
        ApiType,
        [task: ITuple<[u32, u32]>, id: Option<U8aFixed>],
        { task: ITuple<[u32, u32]>; id: Option<U8aFixed> }
      >;
      /**
       * The given task can never be executed since it is overweight.
       **/
      PermanentlyOverweight: AugmentedEvent<
        ApiType,
        [task: ITuple<[u32, u32]>, id: Option<U8aFixed>],
        { task: ITuple<[u32, u32]>; id: Option<U8aFixed> }
      >;
      /**
       * Scheduled some task.
       **/
      Scheduled: AugmentedEvent<ApiType, [when: u32, index: u32], { when: u32; index: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    session: {
      /**
       * New session has happened. Note that the argument is the session index, not the
       * block number as the type might suggest.
       **/
      NewSession: AugmentedEvent<ApiType, [sessionIndex: u32], { sessionIndex: u32 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    smartContractModule: {
      BillingFrequencyChanged: AugmentedEvent<ApiType, [u64]>;
      /**
       * Deprecated event
       **/
      ConsumptionReportReceived: AugmentedEvent<ApiType, [PalletSmartContractConsumption]>;
      ContractBilled: AugmentedEvent<ApiType, [PalletSmartContractContractBill]>;
      /**
       * A contract got created
       **/
      ContractCreated: AugmentedEvent<ApiType, [PalletSmartContractContract]>;
      /**
       * Deprecated event
       **/
      ContractDeployed: AugmentedEvent<ApiType, [u64, AccountId32]>;
      ContractGracePeriodElapsed: AugmentedEvent<
        ApiType,
        [contractId: u64, gracePeriod: u64],
        { contractId: u64; gracePeriod: u64 }
      >;
      /**
       * A Contract grace period was ended due to overdarfted being settled
       **/
      ContractGracePeriodEnded: AugmentedEvent<
        ApiType,
        [contractId: u64, nodeId: u32, twinId: u32],
        { contractId: u64; nodeId: u32; twinId: u32 }
      >;
      /**
       * A Contract grace period is triggered due to overdarfted
       **/
      ContractGracePeriodStarted: AugmentedEvent<
        ApiType,
        [contractId: u64, nodeId: u32, twinId: u32, blockNumber: u64],
        { contractId: u64; nodeId: u32; twinId: u32; blockNumber: u64 }
      >;
      ContractPaymentOverdrawn: AugmentedEvent<
        ApiType,
        [contractId: u64, timestamp: u64, partiallyBilledAmount: u128, overdraft: u128],
        { contractId: u64; timestamp: u64; partiallyBilledAmount: u128; overdraft: u128 }
      >;
      /**
       * A contract was updated
       **/
      ContractUpdated: AugmentedEvent<ApiType, [PalletSmartContractContract]>;
      /**
       * IP got freed by a Node contract
       **/
      IPsFreed: AugmentedEvent<
        ApiType,
        [contractId: u64, publicIps: Vec<TfchainSupportPublicIP>],
        { contractId: u64; publicIps: Vec<TfchainSupportPublicIP> }
      >;
      /**
       * IP got reserved by a Node contract
       **/
      IPsReserved: AugmentedEvent<
        ApiType,
        [contractId: u64, publicIps: Vec<TfchainSupportPublicIP>],
        { contractId: u64; publicIps: Vec<TfchainSupportPublicIP> }
      >;
      /**
       * A Name contract is canceled
       **/
      NameContractCanceled: AugmentedEvent<ApiType, [contractId: u64], { contractId: u64 }>;
      /**
       * A Node contract is canceled
       **/
      NodeContractCanceled: AugmentedEvent<
        ApiType,
        [contractId: u64, nodeId: u32, twinId: u32],
        { contractId: u64; nodeId: u32; twinId: u32 }
      >;
      NodeExtraFeeSet: AugmentedEvent<ApiType, [nodeId: u32, extraFee: u64], { nodeId: u32; extraFee: u64 }>;
      /**
       * Network resources report received for contract
       **/
      NruConsumptionReportReceived: AugmentedEvent<ApiType, [PalletSmartContractNruConsumption]>;
      /**
       * a Rent contract is canceled
       **/
      RentContractCanceled: AugmentedEvent<ApiType, [contractId: u64], { contractId: u64 }>;
      RentWaived: AugmentedEvent<ApiType, [contractId: u64], { contractId: u64 }>;
      RewardDistributed: AugmentedEvent<
        ApiType,
        [contractId: u64, standardRewards: u128, additionalRewards: u128],
        { contractId: u64; standardRewards: u128; additionalRewards: u128 }
      >;
      /**
       * A Service contract is approved
       **/
      ServiceContractApproved: AugmentedEvent<ApiType, [PalletSmartContractServiceContract]>;
      /**
       * A Service contract is billed
       **/
      ServiceContractBilled: AugmentedEvent<
        ApiType,
        [
          serviceContract: PalletSmartContractServiceContract,
          bill: PalletSmartContractServiceContractBill,
          amount: u128,
        ],
        {
          serviceContract: PalletSmartContractServiceContract;
          bill: PalletSmartContractServiceContractBill;
          amount: u128;
        }
      >;
      /**
       * A Service contract is canceled
       **/
      ServiceContractCanceled: AugmentedEvent<
        ApiType,
        [serviceContractId: u64, cause: PalletSmartContractCause],
        { serviceContractId: u64; cause: PalletSmartContractCause }
      >;
      /**
       * A Service contract is created
       **/
      ServiceContractCreated: AugmentedEvent<ApiType, [PalletSmartContractServiceContract]>;
      /**
       * A Service contract fees are set
       **/
      ServiceContractFeesSet: AugmentedEvent<ApiType, [PalletSmartContractServiceContract]>;
      /**
       * A Service contract metadata is set
       **/
      ServiceContractMetadataSet: AugmentedEvent<ApiType, [PalletSmartContractServiceContract]>;
      SolutionProviderApproved: AugmentedEvent<ApiType, [u64, bool]>;
      SolutionProviderCreated: AugmentedEvent<ApiType, [PalletSmartContractSolutionProvider]>;
      /**
       * A certain amount of tokens got burned by a contract
       **/
      TokensBurned: AugmentedEvent<ApiType, [contractId: u64, amount: u128], { contractId: u64; amount: u128 }>;
      /**
       * Contract resources got updated
       **/
      UpdatedUsedResources: AugmentedEvent<ApiType, [PalletSmartContractContractResources]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    system: {
      /**
       * `:code` was updated.
       **/
      CodeUpdated: AugmentedEvent<ApiType, []>;
      /**
       * An extrinsic failed.
       **/
      ExtrinsicFailed: AugmentedEvent<
        ApiType,
        [dispatchError: SpRuntimeDispatchError, dispatchInfo: FrameSupportDispatchDispatchInfo],
        { dispatchError: SpRuntimeDispatchError; dispatchInfo: FrameSupportDispatchDispatchInfo }
      >;
      /**
       * An extrinsic completed successfully.
       **/
      ExtrinsicSuccess: AugmentedEvent<
        ApiType,
        [dispatchInfo: FrameSupportDispatchDispatchInfo],
        { dispatchInfo: FrameSupportDispatchDispatchInfo }
      >;
      /**
       * An account was reaped.
       **/
      KilledAccount: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * A new account was created.
       **/
      NewAccount: AugmentedEvent<ApiType, [account: AccountId32], { account: AccountId32 }>;
      /**
       * On on-chain remark happened.
       **/
      Remarked: AugmentedEvent<ApiType, [sender: AccountId32, hash_: H256], { sender: AccountId32; hash_: H256 }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    tfgridModule: {
      ConnectionPriceSet: AugmentedEvent<ApiType, [u32]>;
      EntityDeleted: AugmentedEvent<ApiType, [u32]>;
      EntityStored: AugmentedEvent<ApiType, [PalletTfgridEntity]>;
      EntityUpdated: AugmentedEvent<ApiType, [PalletTfgridEntity]>;
      FarmCertificationSet: AugmentedEvent<ApiType, [u32, TfchainSupportFarmCertification]>;
      FarmDeleted: AugmentedEvent<ApiType, [u32]>;
      FarmingPolicySet: AugmentedEvent<ApiType, [u32, Option<TfchainSupportFarmingPolicyLimit>]>;
      FarmingPolicyStored: AugmentedEvent<ApiType, [PalletTfgridFarmingPolicy]>;
      FarmingPolicyUpdated: AugmentedEvent<ApiType, [PalletTfgridFarmingPolicy]>;
      FarmMarkedAsDedicated: AugmentedEvent<ApiType, [u32]>;
      FarmPayoutV2AddressRegistered: AugmentedEvent<ApiType, [u32, Bytes]>;
      FarmStored: AugmentedEvent<ApiType, [TfchainSupportFarm]>;
      FarmUpdated: AugmentedEvent<ApiType, [TfchainSupportFarm]>;
      NodeCertificationSet: AugmentedEvent<ApiType, [u32, TfchainSupportNodeCertification]>;
      NodeCertifierAdded: AugmentedEvent<ApiType, [AccountId32]>;
      NodeCertifierRemoved: AugmentedEvent<ApiType, [AccountId32]>;
      NodeDeleted: AugmentedEvent<ApiType, [u32]>;
      NodePublicConfigStored: AugmentedEvent<ApiType, [u32, Option<TfchainSupportPublicConfig>]>;
      NodeStored: AugmentedEvent<ApiType, [TfchainSupportNode]>;
      NodeUpdated: AugmentedEvent<ApiType, [TfchainSupportNode]>;
      NodeUptimeReported: AugmentedEvent<ApiType, [u32, u64, u64]>;
      PowerStateChanged: AugmentedEvent<
        ApiType,
        [farmId: u32, nodeId: u32, powerState: TfchainSupportPowerState],
        { farmId: u32; nodeId: u32; powerState: TfchainSupportPowerState }
      >;
      /**
       * Send an event to zero os to change its state
       **/
      PowerTargetChanged: AugmentedEvent<
        ApiType,
        [farmId: u32, nodeId: u32, powerTarget: TfchainSupportPower],
        { farmId: u32; nodeId: u32; powerTarget: TfchainSupportPower }
      >;
      PricingPolicyStored: AugmentedEvent<ApiType, [PalletTfgridPricingPolicy]>;
      TwinAccountBounded: AugmentedEvent<ApiType, [u32, AccountId32]>;
      TwinDeleted: AugmentedEvent<ApiType, [u32]>;
      TwinEntityRemoved: AugmentedEvent<ApiType, [u32, u32]>;
      TwinEntityStored: AugmentedEvent<ApiType, [u32, u32, Bytes]>;
      TwinStored: AugmentedEvent<ApiType, [PalletTfgridTwin]>;
      TwinUpdated: AugmentedEvent<ApiType, [PalletTfgridTwin]>;
      ZosVersionUpdated: AugmentedEvent<ApiType, [Bytes]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    tfkvStore: {
      /**
       * A user has read their entry, leaving it in storage
       **/
      EntryGot: AugmentedEvent<ApiType, [AccountId32, Bytes, Bytes]>;
      /**
       * A user has set their entry
       **/
      EntrySet: AugmentedEvent<ApiType, [AccountId32, Bytes, Bytes]>;
      /**
       * A user has read their entry, removing it from storage
       **/
      EntryTaken: AugmentedEvent<ApiType, [AccountId32, Bytes, Bytes]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    tftBridgeModule: {
      BurnTransactionCreated: AugmentedEvent<ApiType, [u64, AccountId32, Bytes, u64]>;
      BurnTransactionExpired: AugmentedEvent<ApiType, [u64, Option<AccountId32>, Bytes, u64]>;
      BurnTransactionProcessed: AugmentedEvent<ApiType, [PalletTftBridgeBurnTransaction]>;
      BurnTransactionProposed: AugmentedEvent<ApiType, [u64, Bytes, u64]>;
      BurnTransactionReady: AugmentedEvent<ApiType, [u64]>;
      BurnTransactionSignatureAdded: AugmentedEvent<ApiType, [u64, PalletTftBridgeStellarSignature]>;
      MintCompleted: AugmentedEvent<ApiType, [PalletTftBridgeMintTransaction, Bytes]>;
      MintTransactionExpired: AugmentedEvent<ApiType, [Bytes, u64, AccountId32]>;
      MintTransactionProposed: AugmentedEvent<ApiType, [Bytes, AccountId32, u64]>;
      MintTransactionVoted: AugmentedEvent<ApiType, [Bytes]>;
      RefundTransactionCreated: AugmentedEvent<ApiType, [Bytes, Bytes, u64]>;
      RefundTransactionExpired: AugmentedEvent<ApiType, [Bytes, Bytes, u64]>;
      RefundTransactionProcessed: AugmentedEvent<ApiType, [PalletTftBridgeRefundTransaction]>;
      RefundTransactionReady: AugmentedEvent<ApiType, [Bytes]>;
      RefundTransactionsignatureAdded: AugmentedEvent<ApiType, [Bytes, PalletTftBridgeStellarSignature]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    tftPriceModule: {
      AveragePriceIsAboveMaxPrice: AugmentedEvent<ApiType, [u32, u32]>;
      AveragePriceIsBelowMinPrice: AugmentedEvent<ApiType, [u32, u32]>;
      AveragePriceStored: AugmentedEvent<ApiType, [u32]>;
      OffchainWorkerExecuted: AugmentedEvent<ApiType, [AccountId32]>;
      PriceStored: AugmentedEvent<ApiType, [u32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    transactionPayment: {
      /**
       * A transaction fee `actual_fee`, of which `tip` was added to the minimum inclusion fee,
       * has been paid by `who`.
       **/
      TransactionFeePaid: AugmentedEvent<
        ApiType,
        [who: AccountId32, actualFee: u128, tip: u128],
        { who: AccountId32; actualFee: u128; tip: u128 }
      >;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    utility: {
      /**
       * Batch of dispatches completed fully with no error.
       **/
      BatchCompleted: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches completed but has errors.
       **/
      BatchCompletedWithErrors: AugmentedEvent<ApiType, []>;
      /**
       * Batch of dispatches did not complete fully. Index of first failing dispatch given, as
       * well as the error.
       **/
      BatchInterrupted: AugmentedEvent<
        ApiType,
        [index: u32, error: SpRuntimeDispatchError],
        { index: u32; error: SpRuntimeDispatchError }
      >;
      /**
       * A call was dispatched.
       **/
      DispatchedAs: AugmentedEvent<
        ApiType,
        [result: Result<Null, SpRuntimeDispatchError>],
        { result: Result<Null, SpRuntimeDispatchError> }
      >;
      /**
       * A single item within a Batch of dispatches has completed with no error.
       **/
      ItemCompleted: AugmentedEvent<ApiType, []>;
      /**
       * A single item within a Batch of dispatches has completed with error.
       **/
      ItemFailed: AugmentedEvent<ApiType, [error: SpRuntimeDispatchError], { error: SpRuntimeDispatchError }>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    validator: {
      Bonded: AugmentedEvent<ApiType, [AccountId32]>;
      NodeValidatorChanged: AugmentedEvent<ApiType, [AccountId32]>;
      NodeValidatorRemoved: AugmentedEvent<ApiType, [AccountId32]>;
      ValidatorActivated: AugmentedEvent<ApiType, [PalletValidatorValidator]>;
      ValidatorRemoved: AugmentedEvent<ApiType, [PalletValidatorValidator]>;
      ValidatorRequestApproved: AugmentedEvent<ApiType, [PalletValidatorValidator]>;
      ValidatorRequestCreated: AugmentedEvent<ApiType, [AccountId32, PalletValidatorValidator]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
    validatorSet: {
      /**
       * New validator addition initiated. Effective in ~2 sessions.
       **/
      ValidatorAdditionInitiated: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * Validator removal initiated. Effective in ~2 sessions.
       **/
      ValidatorRemovalInitiated: AugmentedEvent<ApiType, [AccountId32]>;
      /**
       * Generic event
       **/
      [key: string]: AugmentedEvent<ApiType>;
    };
  } // AugmentedEvents
} // declare module
