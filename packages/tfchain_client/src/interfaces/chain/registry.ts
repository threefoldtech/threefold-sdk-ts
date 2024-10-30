// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import "@polkadot/types/types/registry";

import type {
  FinalityGrandpaEquivocationPrecommit,
  FinalityGrandpaEquivocationPrevote,
  FinalityGrandpaPrecommit,
  FinalityGrandpaPrevote,
  FrameSupportDispatchDispatchClass,
  FrameSupportDispatchDispatchInfo,
  FrameSupportDispatchPays,
  FrameSupportDispatchPerDispatchClassU32,
  FrameSupportDispatchPerDispatchClassWeight,
  FrameSupportDispatchPerDispatchClassWeightsPerClass,
  FrameSupportDispatchRawOrigin,
  FrameSupportPreimagesBounded,
  FrameSupportTokensMiscBalanceStatus,
  FrameSystemAccountInfo,
  FrameSystemCall,
  FrameSystemError,
  FrameSystemEvent,
  FrameSystemEventRecord,
  FrameSystemExtensionsCheckGenesis,
  FrameSystemExtensionsCheckNonZeroSender,
  FrameSystemExtensionsCheckNonce,
  FrameSystemExtensionsCheckSpecVersion,
  FrameSystemExtensionsCheckTxVersion,
  FrameSystemExtensionsCheckWeight,
  FrameSystemLastRuntimeUpgradeInfo,
  FrameSystemLimitsBlockLength,
  FrameSystemLimitsBlockWeights,
  FrameSystemLimitsWeightsPerClass,
  FrameSystemPhase,
  PalletBalancesAccountData,
  PalletBalancesBalanceLock,
  PalletBalancesCall,
  PalletBalancesError,
  PalletBalancesEvent,
  PalletBalancesIdAmount,
  PalletBalancesReasons,
  PalletBalancesReserveData,
  PalletBurningBurn,
  PalletBurningCall,
  PalletBurningError,
  PalletBurningEvent,
  PalletCollectiveCall,
  PalletCollectiveError,
  PalletCollectiveEvent,
  PalletCollectiveRawOrigin,
  PalletCollectiveVotes,
  PalletDaoCall,
  PalletDaoError,
  PalletDaoEvent,
  PalletDaoProposalDaoProposal,
  PalletDaoProposalDaoVotes,
  PalletDaoProposalVoteWeight,
  PalletGrandpaCall,
  PalletGrandpaError,
  PalletGrandpaEvent,
  PalletGrandpaStoredPendingChange,
  PalletGrandpaStoredState,
  PalletKvstoreCall,
  PalletKvstoreError,
  PalletKvstoreEvent,
  PalletMembershipCall,
  PalletMembershipError,
  PalletMembershipEvent,
  PalletRuntimeUpgradeCall,
  PalletSchedulerCall,
  PalletSchedulerError,
  PalletSchedulerEvent,
  PalletSchedulerScheduled,
  PalletSessionCall,
  PalletSessionError,
  PalletSessionEvent,
  PalletSmartContractCall,
  PalletSmartContractCause,
  PalletSmartContractConsumption,
  PalletSmartContractContract,
  PalletSmartContractContractBill,
  PalletSmartContractContractBillingInformation,
  PalletSmartContractContractData,
  PalletSmartContractContractIdProvides,
  PalletSmartContractContractLock,
  PalletSmartContractContractPaymentState,
  PalletSmartContractContractResources,
  PalletSmartContractContractState,
  PalletSmartContractDiscountLevel,
  PalletSmartContractError,
  PalletSmartContractEvent,
  PalletSmartContractNameContract,
  PalletSmartContractNodeContract,
  PalletSmartContractNruConsumption,
  PalletSmartContractProvider,
  PalletSmartContractRentContract,
  PalletSmartContractServiceContract,
  PalletSmartContractServiceContractBill,
  PalletSmartContractServiceContractState,
  PalletSmartContractSolutionProvider,
  PalletSmartContractStorageVersion,
  PalletTfgridCall,
  PalletTfgridEntity,
  PalletTfgridEntityProof,
  PalletTfgridError,
  PalletTfgridEvent,
  PalletTfgridFarmingPolicy,
  PalletTfgridLocationInput,
  PalletTfgridNodeLocation,
  PalletTfgridPolicy,
  PalletTfgridPricingPolicy,
  PalletTfgridStorageVersion,
  PalletTfgridTermsCondTermsAndConditions,
  PalletTfgridTwin,
  PalletTfgridUnit,
  PalletTftBridgeBurnTransaction,
  PalletTftBridgeCall,
  PalletTftBridgeError,
  PalletTftBridgeEvent,
  PalletTftBridgeMintTransaction,
  PalletTftBridgeRefundTransaction,
  PalletTftBridgeStellarSignature,
  PalletTftBridgeStorageVersion,
  PalletTftPriceCall,
  PalletTftPriceError,
  PalletTftPriceEvent,
  PalletTimestampCall,
  PalletTransactionPaymentChargeTransactionPayment,
  PalletTransactionPaymentEvent,
  PalletTransactionPaymentReleases,
  PalletUtilityCall,
  PalletUtilityError,
  PalletUtilityEvent,
  PalletValidatorCall,
  PalletValidatorError,
  PalletValidatorEvent,
  PalletValidatorValidator,
  PalletValidatorValidatorRequestState,
  SpArithmeticArithmeticError,
  SpConsensusAuraSr25519AppSr25519Public,
  SpConsensusGrandpaAppPublic,
  SpConsensusGrandpaAppSignature,
  SpConsensusGrandpaEquivocation,
  SpConsensusGrandpaEquivocationProof,
  SpCoreCryptoKeyTypeId,
  SpCoreEcdsaSignature,
  SpCoreEd25519Public,
  SpCoreEd25519Signature,
  SpCoreSr25519Public,
  SpCoreSr25519Signature,
  SpCoreVoid,
  SpRuntimeDigest,
  SpRuntimeDigestDigestItem,
  SpRuntimeDispatchError,
  SpRuntimeModuleError,
  SpRuntimeMultiSignature,
  SpRuntimeTokenError,
  SpRuntimeTransactionalError,
  SpVersionRuntimeVersion,
  SpWeightsRuntimeDbWeight,
  SpWeightsWeightV2Weight,
  SubstrateValidatorSetCall,
  SubstrateValidatorSetError,
  SubstrateValidatorSetEvent,
  TfchainRuntimeOpaqueSessionKeys,
  TfchainRuntimeOriginCaller,
  TfchainRuntimeRuntime,
  TfchainSupportFarm,
  TfchainSupportFarmCertification,
  TfchainSupportFarmingPolicyLimit,
  TfchainSupportInterfaceBoundedVec,
  TfchainSupportInterfaceInterfaceName,
  TfchainSupportIp4,
  TfchainSupportIp6,
  TfchainSupportNode,
  TfchainSupportNodeCertification,
  TfchainSupportNodePower,
  TfchainSupportPower,
  TfchainSupportPowerState,
  TfchainSupportPublicConfig,
  TfchainSupportPublicIP,
  TfchainSupportResources,
} from "@polkadot/types/lookup";

declare module "@polkadot/types/types/registry" {
  interface InterfaceTypes {
    FinalityGrandpaEquivocationPrecommit: FinalityGrandpaEquivocationPrecommit;
    FinalityGrandpaEquivocationPrevote: FinalityGrandpaEquivocationPrevote;
    FinalityGrandpaPrecommit: FinalityGrandpaPrecommit;
    FinalityGrandpaPrevote: FinalityGrandpaPrevote;
    FrameSupportDispatchDispatchClass: FrameSupportDispatchDispatchClass;
    FrameSupportDispatchDispatchInfo: FrameSupportDispatchDispatchInfo;
    FrameSupportDispatchPays: FrameSupportDispatchPays;
    FrameSupportDispatchPerDispatchClassU32: FrameSupportDispatchPerDispatchClassU32;
    FrameSupportDispatchPerDispatchClassWeight: FrameSupportDispatchPerDispatchClassWeight;
    FrameSupportDispatchPerDispatchClassWeightsPerClass: FrameSupportDispatchPerDispatchClassWeightsPerClass;
    FrameSupportDispatchRawOrigin: FrameSupportDispatchRawOrigin;
    FrameSupportPreimagesBounded: FrameSupportPreimagesBounded;
    FrameSupportTokensMiscBalanceStatus: FrameSupportTokensMiscBalanceStatus;
    FrameSystemAccountInfo: FrameSystemAccountInfo;
    FrameSystemCall: FrameSystemCall;
    FrameSystemError: FrameSystemError;
    FrameSystemEvent: FrameSystemEvent;
    FrameSystemEventRecord: FrameSystemEventRecord;
    FrameSystemExtensionsCheckGenesis: FrameSystemExtensionsCheckGenesis;
    FrameSystemExtensionsCheckNonZeroSender: FrameSystemExtensionsCheckNonZeroSender;
    FrameSystemExtensionsCheckNonce: FrameSystemExtensionsCheckNonce;
    FrameSystemExtensionsCheckSpecVersion: FrameSystemExtensionsCheckSpecVersion;
    FrameSystemExtensionsCheckTxVersion: FrameSystemExtensionsCheckTxVersion;
    FrameSystemExtensionsCheckWeight: FrameSystemExtensionsCheckWeight;
    FrameSystemLastRuntimeUpgradeInfo: FrameSystemLastRuntimeUpgradeInfo;
    FrameSystemLimitsBlockLength: FrameSystemLimitsBlockLength;
    FrameSystemLimitsBlockWeights: FrameSystemLimitsBlockWeights;
    FrameSystemLimitsWeightsPerClass: FrameSystemLimitsWeightsPerClass;
    FrameSystemPhase: FrameSystemPhase;
    PalletBalancesAccountData: PalletBalancesAccountData;
    PalletBalancesBalanceLock: PalletBalancesBalanceLock;
    PalletBalancesCall: PalletBalancesCall;
    PalletBalancesError: PalletBalancesError;
    PalletBalancesEvent: PalletBalancesEvent;
    PalletBalancesIdAmount: PalletBalancesIdAmount;
    PalletBalancesReasons: PalletBalancesReasons;
    PalletBalancesReserveData: PalletBalancesReserveData;
    PalletBurningBurn: PalletBurningBurn;
    PalletBurningCall: PalletBurningCall;
    PalletBurningError: PalletBurningError;
    PalletBurningEvent: PalletBurningEvent;
    PalletCollectiveCall: PalletCollectiveCall;
    PalletCollectiveError: PalletCollectiveError;
    PalletCollectiveEvent: PalletCollectiveEvent;
    PalletCollectiveRawOrigin: PalletCollectiveRawOrigin;
    PalletCollectiveVotes: PalletCollectiveVotes;
    PalletDaoCall: PalletDaoCall;
    PalletDaoError: PalletDaoError;
    PalletDaoEvent: PalletDaoEvent;
    PalletDaoProposalDaoProposal: PalletDaoProposalDaoProposal;
    PalletDaoProposalDaoVotes: PalletDaoProposalDaoVotes;
    PalletDaoProposalVoteWeight: PalletDaoProposalVoteWeight;
    PalletGrandpaCall: PalletGrandpaCall;
    PalletGrandpaError: PalletGrandpaError;
    PalletGrandpaEvent: PalletGrandpaEvent;
    PalletGrandpaStoredPendingChange: PalletGrandpaStoredPendingChange;
    PalletGrandpaStoredState: PalletGrandpaStoredState;
    PalletKvstoreCall: PalletKvstoreCall;
    PalletKvstoreError: PalletKvstoreError;
    PalletKvstoreEvent: PalletKvstoreEvent;
    PalletMembershipCall: PalletMembershipCall;
    PalletMembershipError: PalletMembershipError;
    PalletMembershipEvent: PalletMembershipEvent;
    PalletRuntimeUpgradeCall: PalletRuntimeUpgradeCall;
    PalletSchedulerCall: PalletSchedulerCall;
    PalletSchedulerError: PalletSchedulerError;
    PalletSchedulerEvent: PalletSchedulerEvent;
    PalletSchedulerScheduled: PalletSchedulerScheduled;
    PalletSessionCall: PalletSessionCall;
    PalletSessionError: PalletSessionError;
    PalletSessionEvent: PalletSessionEvent;
    PalletSmartContractCall: PalletSmartContractCall;
    PalletSmartContractCause: PalletSmartContractCause;
    PalletSmartContractConsumption: PalletSmartContractConsumption;
    PalletSmartContractContract: PalletSmartContractContract;
    PalletSmartContractContractBill: PalletSmartContractContractBill;
    PalletSmartContractContractBillingInformation: PalletSmartContractContractBillingInformation;
    PalletSmartContractContractData: PalletSmartContractContractData;
    PalletSmartContractContractIdProvides: PalletSmartContractContractIdProvides;
    PalletSmartContractContractLock: PalletSmartContractContractLock;
    PalletSmartContractContractPaymentState: PalletSmartContractContractPaymentState;
    PalletSmartContractContractResources: PalletSmartContractContractResources;
    PalletSmartContractContractState: PalletSmartContractContractState;
    PalletSmartContractDiscountLevel: PalletSmartContractDiscountLevel;
    PalletSmartContractError: PalletSmartContractError;
    PalletSmartContractEvent: PalletSmartContractEvent;
    PalletSmartContractNameContract: PalletSmartContractNameContract;
    PalletSmartContractNodeContract: PalletSmartContractNodeContract;
    PalletSmartContractNruConsumption: PalletSmartContractNruConsumption;
    PalletSmartContractProvider: PalletSmartContractProvider;
    PalletSmartContractRentContract: PalletSmartContractRentContract;
    PalletSmartContractServiceContract: PalletSmartContractServiceContract;
    PalletSmartContractServiceContractBill: PalletSmartContractServiceContractBill;
    PalletSmartContractServiceContractState: PalletSmartContractServiceContractState;
    PalletSmartContractSolutionProvider: PalletSmartContractSolutionProvider;
    PalletSmartContractStorageVersion: PalletSmartContractStorageVersion;
    PalletTfgridCall: PalletTfgridCall;
    PalletTfgridEntity: PalletTfgridEntity;
    PalletTfgridEntityProof: PalletTfgridEntityProof;
    PalletTfgridError: PalletTfgridError;
    PalletTfgridEvent: PalletTfgridEvent;
    PalletTfgridFarmingPolicy: PalletTfgridFarmingPolicy;
    PalletTfgridLocationInput: PalletTfgridLocationInput;
    PalletTfgridNodeLocation: PalletTfgridNodeLocation;
    PalletTfgridPolicy: PalletTfgridPolicy;
    PalletTfgridPricingPolicy: PalletTfgridPricingPolicy;
    PalletTfgridStorageVersion: PalletTfgridStorageVersion;
    PalletTfgridTermsCondTermsAndConditions: PalletTfgridTermsCondTermsAndConditions;
    PalletTfgridTwin: PalletTfgridTwin;
    PalletTfgridUnit: PalletTfgridUnit;
    PalletTftBridgeBurnTransaction: PalletTftBridgeBurnTransaction;
    PalletTftBridgeCall: PalletTftBridgeCall;
    PalletTftBridgeError: PalletTftBridgeError;
    PalletTftBridgeEvent: PalletTftBridgeEvent;
    PalletTftBridgeMintTransaction: PalletTftBridgeMintTransaction;
    PalletTftBridgeRefundTransaction: PalletTftBridgeRefundTransaction;
    PalletTftBridgeStellarSignature: PalletTftBridgeStellarSignature;
    PalletTftBridgeStorageVersion: PalletTftBridgeStorageVersion;
    PalletTftPriceCall: PalletTftPriceCall;
    PalletTftPriceError: PalletTftPriceError;
    PalletTftPriceEvent: PalletTftPriceEvent;
    PalletTimestampCall: PalletTimestampCall;
    PalletTransactionPaymentChargeTransactionPayment: PalletTransactionPaymentChargeTransactionPayment;
    PalletTransactionPaymentEvent: PalletTransactionPaymentEvent;
    PalletTransactionPaymentReleases: PalletTransactionPaymentReleases;
    PalletUtilityCall: PalletUtilityCall;
    PalletUtilityError: PalletUtilityError;
    PalletUtilityEvent: PalletUtilityEvent;
    PalletValidatorCall: PalletValidatorCall;
    PalletValidatorError: PalletValidatorError;
    PalletValidatorEvent: PalletValidatorEvent;
    PalletValidatorValidator: PalletValidatorValidator;
    PalletValidatorValidatorRequestState: PalletValidatorValidatorRequestState;
    SpArithmeticArithmeticError: SpArithmeticArithmeticError;
    SpConsensusAuraSr25519AppSr25519Public: SpConsensusAuraSr25519AppSr25519Public;
    SpConsensusGrandpaAppPublic: SpConsensusGrandpaAppPublic;
    SpConsensusGrandpaAppSignature: SpConsensusGrandpaAppSignature;
    SpConsensusGrandpaEquivocation: SpConsensusGrandpaEquivocation;
    SpConsensusGrandpaEquivocationProof: SpConsensusGrandpaEquivocationProof;
    SpCoreCryptoKeyTypeId: SpCoreCryptoKeyTypeId;
    SpCoreEcdsaSignature: SpCoreEcdsaSignature;
    SpCoreEd25519Public: SpCoreEd25519Public;
    SpCoreEd25519Signature: SpCoreEd25519Signature;
    SpCoreSr25519Public: SpCoreSr25519Public;
    SpCoreSr25519Signature: SpCoreSr25519Signature;
    SpCoreVoid: SpCoreVoid;
    SpRuntimeDigest: SpRuntimeDigest;
    SpRuntimeDigestDigestItem: SpRuntimeDigestDigestItem;
    SpRuntimeDispatchError: SpRuntimeDispatchError;
    SpRuntimeModuleError: SpRuntimeModuleError;
    SpRuntimeMultiSignature: SpRuntimeMultiSignature;
    SpRuntimeTokenError: SpRuntimeTokenError;
    SpRuntimeTransactionalError: SpRuntimeTransactionalError;
    SpVersionRuntimeVersion: SpVersionRuntimeVersion;
    SpWeightsRuntimeDbWeight: SpWeightsRuntimeDbWeight;
    SpWeightsWeightV2Weight: SpWeightsWeightV2Weight;
    SubstrateValidatorSetCall: SubstrateValidatorSetCall;
    SubstrateValidatorSetError: SubstrateValidatorSetError;
    SubstrateValidatorSetEvent: SubstrateValidatorSetEvent;
    TfchainRuntimeOpaqueSessionKeys: TfchainRuntimeOpaqueSessionKeys;
    TfchainRuntimeOriginCaller: TfchainRuntimeOriginCaller;
    TfchainRuntimeRuntime: TfchainRuntimeRuntime;
    TfchainSupportFarm: TfchainSupportFarm;
    TfchainSupportFarmCertification: TfchainSupportFarmCertification;
    TfchainSupportFarmingPolicyLimit: TfchainSupportFarmingPolicyLimit;
    TfchainSupportInterfaceBoundedVec: TfchainSupportInterfaceBoundedVec;
    TfchainSupportInterfaceInterfaceName: TfchainSupportInterfaceInterfaceName;
    TfchainSupportIp4: TfchainSupportIp4;
    TfchainSupportIp6: TfchainSupportIp6;
    TfchainSupportNode: TfchainSupportNode;
    TfchainSupportNodeCertification: TfchainSupportNodeCertification;
    TfchainSupportNodePower: TfchainSupportNodePower;
    TfchainSupportPower: TfchainSupportPower;
    TfchainSupportPowerState: TfchainSupportPowerState;
    TfchainSupportPublicConfig: TfchainSupportPublicConfig;
    TfchainSupportPublicIP: TfchainSupportPublicIP;
    TfchainSupportResources: TfchainSupportResources;
  } // InterfaceTypes
} // declare module
