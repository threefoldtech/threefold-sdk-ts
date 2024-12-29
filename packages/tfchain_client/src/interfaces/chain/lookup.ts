// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

/* eslint-disable sort-keys */

export default {
  /**
   * Lookup3: frame_system::AccountInfo<Nonce, pallet_balances::types::AccountData<Balance>>
   **/
  FrameSystemAccountInfo: {
    nonce: "u32",
    consumers: "u32",
    providers: "u32",
    sufficients: "u32",
    data: "PalletBalancesAccountData",
  },
  /**
   * Lookup5: pallet_balances::types::AccountData<Balance>
   **/
  PalletBalancesAccountData: {
    free: "u128",
    reserved: "u128",
    frozen: "u128",
    flags: "u128",
  },
  /**
   * Lookup8: frame_support::dispatch::PerDispatchClass<sp_weights::weight_v2::Weight>
   **/
  FrameSupportDispatchPerDispatchClassWeight: {
    normal: "SpWeightsWeightV2Weight",
    operational: "SpWeightsWeightV2Weight",
    mandatory: "SpWeightsWeightV2Weight",
  },
  /**
   * Lookup9: sp_weights::weight_v2::Weight
   **/
  SpWeightsWeightV2Weight: {
    refTime: "Compact<u64>",
    proofSize: "Compact<u64>",
  },
  /**
   * Lookup14: sp_runtime::generic::digest::Digest
   **/
  SpRuntimeDigest: {
    logs: "Vec<SpRuntimeDigestDigestItem>",
  },
  /**
   * Lookup16: sp_runtime::generic::digest::DigestItem
   **/
  SpRuntimeDigestDigestItem: {
    _enum: {
      Other: "Bytes",
      __Unused1: "Null",
      __Unused2: "Null",
      __Unused3: "Null",
      Consensus: "([u8;4],Bytes)",
      Seal: "([u8;4],Bytes)",
      PreRuntime: "([u8;4],Bytes)",
      __Unused7: "Null",
      RuntimeEnvironmentUpdated: "Null",
    },
  },
  /**
   * Lookup19: frame_system::EventRecord<tfchain_runtime::RuntimeEvent, primitive_types::H256>
   **/
  FrameSystemEventRecord: {
    phase: "FrameSystemPhase",
    event: "Event",
    topics: "Vec<H256>",
  },
  /**
   * Lookup21: frame_system::pallet::Event<T>
   **/
  FrameSystemEvent: {
    _enum: {
      ExtrinsicSuccess: {
        dispatchInfo: "FrameSupportDispatchDispatchInfo",
      },
      ExtrinsicFailed: {
        dispatchError: "SpRuntimeDispatchError",
        dispatchInfo: "FrameSupportDispatchDispatchInfo",
      },
      CodeUpdated: "Null",
      NewAccount: {
        account: "AccountId32",
      },
      KilledAccount: {
        account: "AccountId32",
      },
      Remarked: {
        _alias: {
          hash_: "hash",
        },
        sender: "AccountId32",
        hash_: "H256",
      },
    },
  },
  /**
   * Lookup22: frame_support::dispatch::DispatchInfo
   **/
  FrameSupportDispatchDispatchInfo: {
    weight: "SpWeightsWeightV2Weight",
    class: "FrameSupportDispatchDispatchClass",
    paysFee: "FrameSupportDispatchPays",
  },
  /**
   * Lookup23: frame_support::dispatch::DispatchClass
   **/
  FrameSupportDispatchDispatchClass: {
    _enum: ["Normal", "Operational", "Mandatory"],
  },
  /**
   * Lookup24: frame_support::dispatch::Pays
   **/
  FrameSupportDispatchPays: {
    _enum: ["Yes", "No"],
  },
  /**
   * Lookup25: sp_runtime::DispatchError
   **/
  SpRuntimeDispatchError: {
    _enum: {
      Other: "Null",
      CannotLookup: "Null",
      BadOrigin: "Null",
      Module: "SpRuntimeModuleError",
      ConsumerRemaining: "Null",
      NoProviders: "Null",
      TooManyConsumers: "Null",
      Token: "SpRuntimeTokenError",
      Arithmetic: "SpArithmeticArithmeticError",
      Transactional: "SpRuntimeTransactionalError",
      Exhausted: "Null",
      Corruption: "Null",
      Unavailable: "Null",
      RootNotAllowed: "Null",
    },
  },
  /**
   * Lookup26: sp_runtime::ModuleError
   **/
  SpRuntimeModuleError: {
    index: "u8",
    error: "[u8;4]",
  },
  /**
   * Lookup27: sp_runtime::TokenError
   **/
  SpRuntimeTokenError: {
    _enum: [
      "FundsUnavailable",
      "OnlyProvider",
      "BelowMinimum",
      "CannotCreate",
      "UnknownAsset",
      "Frozen",
      "Unsupported",
      "CannotCreateHold",
      "NotExpendable",
      "Blocked",
    ],
  },
  /**
   * Lookup28: sp_arithmetic::ArithmeticError
   **/
  SpArithmeticArithmeticError: {
    _enum: ["Underflow", "Overflow", "DivisionByZero"],
  },
  /**
   * Lookup29: sp_runtime::TransactionalError
   **/
  SpRuntimeTransactionalError: {
    _enum: ["LimitReached", "NoLayer"],
  },
  /**
   * Lookup30: pallet_utility::pallet::Event
   **/
  PalletUtilityEvent: {
    _enum: {
      BatchInterrupted: {
        index: "u32",
        error: "SpRuntimeDispatchError",
      },
      BatchCompleted: "Null",
      BatchCompletedWithErrors: "Null",
      ItemCompleted: "Null",
      ItemFailed: {
        error: "SpRuntimeDispatchError",
      },
      DispatchedAs: {
        result: "Result<Null, SpRuntimeDispatchError>",
      },
    },
  },
  /**
   * Lookup33: pallet_scheduler::pallet::Event<T>
   **/
  PalletSchedulerEvent: {
    _enum: {
      Scheduled: {
        when: "u32",
        index: "u32",
      },
      Canceled: {
        when: "u32",
        index: "u32",
      },
      Dispatched: {
        task: "(u32,u32)",
        id: "Option<[u8;32]>",
        result: "Result<Null, SpRuntimeDispatchError>",
      },
      CallUnavailable: {
        task: "(u32,u32)",
        id: "Option<[u8;32]>",
      },
      PeriodicFailed: {
        task: "(u32,u32)",
        id: "Option<[u8;32]>",
      },
      PermanentlyOverweight: {
        task: "(u32,u32)",
        id: "Option<[u8;32]>",
      },
    },
  },
  /**
   * Lookup36: substrate_validator_set::pallet::Event<T>
   **/
  SubstrateValidatorSetEvent: {
    _enum: {
      ValidatorAdditionInitiated: "AccountId32",
      ValidatorRemovalInitiated: "AccountId32",
    },
  },
  /**
   * Lookup37: pallet_session::pallet::Event
   **/
  PalletSessionEvent: {
    _enum: {
      NewSession: {
        sessionIndex: "u32",
      },
    },
  },
  /**
   * Lookup38: pallet_grandpa::pallet::Event
   **/
  PalletGrandpaEvent: {
    _enum: {
      NewAuthorities: {
        authoritySet: "Vec<(SpConsensusGrandpaAppPublic,u64)>",
      },
      Paused: "Null",
      Resumed: "Null",
    },
  },
  /**
   * Lookup41: sp_consensus_grandpa::app::Public
   **/
  SpConsensusGrandpaAppPublic: "SpCoreEd25519Public",
  /**
   * Lookup42: sp_core::ed25519::Public
   **/
  SpCoreEd25519Public: "[u8;32]",
  /**
   * Lookup43: pallet_balances::pallet::Event<T, I>
   **/
  PalletBalancesEvent: {
    _enum: {
      Endowed: {
        account: "AccountId32",
        freeBalance: "u128",
      },
      DustLost: {
        account: "AccountId32",
        amount: "u128",
      },
      Transfer: {
        from: "AccountId32",
        to: "AccountId32",
        amount: "u128",
      },
      BalanceSet: {
        who: "AccountId32",
        free: "u128",
      },
      Reserved: {
        who: "AccountId32",
        amount: "u128",
      },
      Unreserved: {
        who: "AccountId32",
        amount: "u128",
      },
      ReserveRepatriated: {
        from: "AccountId32",
        to: "AccountId32",
        amount: "u128",
        destinationStatus: "FrameSupportTokensMiscBalanceStatus",
      },
      Deposit: {
        who: "AccountId32",
        amount: "u128",
      },
      Withdraw: {
        who: "AccountId32",
        amount: "u128",
      },
      Slashed: {
        who: "AccountId32",
        amount: "u128",
      },
      Minted: {
        who: "AccountId32",
        amount: "u128",
      },
      Burned: {
        who: "AccountId32",
        amount: "u128",
      },
      Suspended: {
        who: "AccountId32",
        amount: "u128",
      },
      Restored: {
        who: "AccountId32",
        amount: "u128",
      },
      Upgraded: {
        who: "AccountId32",
      },
      Issued: {
        amount: "u128",
      },
      Rescinded: {
        amount: "u128",
      },
      Locked: {
        who: "AccountId32",
        amount: "u128",
      },
      Unlocked: {
        who: "AccountId32",
        amount: "u128",
      },
      Frozen: {
        who: "AccountId32",
        amount: "u128",
      },
      Thawed: {
        who: "AccountId32",
        amount: "u128",
      },
    },
  },
  /**
   * Lookup44: frame_support::traits::tokens::misc::BalanceStatus
   **/
  FrameSupportTokensMiscBalanceStatus: {
    _enum: ["Free", "Reserved"],
  },
  /**
   * Lookup45: pallet_transaction_payment::pallet::Event<T>
   **/
  PalletTransactionPaymentEvent: {
    _enum: {
      TransactionFeePaid: {
        who: "AccountId32",
        actualFee: "u128",
        tip: "u128",
      },
    },
  },
  /**
   * Lookup46: pallet_tfgrid::pallet::Event<T>
   **/
  PalletTfgridEvent: {
    _enum: {
      FarmStored: "TfchainSupportFarm",
      FarmUpdated: "TfchainSupportFarm",
      FarmDeleted: "u32",
      NodeStored: "TfchainSupportNode",
      NodeUpdated: "TfchainSupportNode",
      NodeDeleted: "u32",
      NodeUptimeReported: "(u32,u64,u64)",
      NodePublicConfigStored: "(u32,Option<TfchainSupportPublicConfig>)",
      EntityStored: "PalletTfgridEntity",
      EntityUpdated: "PalletTfgridEntity",
      EntityDeleted: "u32",
      TwinStored: "PalletTfgridTwin",
      TwinUpdated: "PalletTfgridTwin",
      TwinEntityStored: "(u32,u32,Bytes)",
      TwinEntityRemoved: "(u32,u32)",
      TwinDeleted: "u32",
      TwinAccountBounded: "(u32,AccountId32)",
      PricingPolicyStored: "PalletTfgridPricingPolicy",
      FarmingPolicyStored: "PalletTfgridFarmingPolicy",
      FarmPayoutV2AddressRegistered: "(u32,Bytes)",
      FarmMarkedAsDedicated: "u32",
      ConnectionPriceSet: "u32",
      NodeCertificationSet: "(u32,TfchainSupportNodeCertification)",
      NodeCertifierAdded: "AccountId32",
      NodeCertifierRemoved: "AccountId32",
      FarmingPolicyUpdated: "PalletTfgridFarmingPolicy",
      FarmingPolicySet: "(u32,Option<TfchainSupportFarmingPolicyLimit>)",
      FarmCertificationSet: "(u32,TfchainSupportFarmCertification)",
      ZosVersionUpdated: "Bytes",
      PowerTargetChanged: {
        farmId: "u32",
        nodeId: "u32",
        powerTarget: "TfchainSupportPower",
      },
      PowerStateChanged: {
        farmId: "u32",
        nodeId: "u32",
        powerState: "TfchainSupportPowerState",
      },
    },
  },
  /**
   * Lookup47: tfchain_support::types::Farm<pallet_tfgrid::farm::FarmName<T>>
   **/
  TfchainSupportFarm: {
    version: "u32",
    id: "u32",
    name: "Bytes",
    twinId: "u32",
    pricingPolicyId: "u32",
    certification: "TfchainSupportFarmCertification",
    publicIps: "Vec<TfchainSupportPublicIP>",
    dedicatedFarm: "bool",
    farmingPolicyLimits: "Option<TfchainSupportFarmingPolicyLimit>",
  },
  /**
   * Lookup50: tfchain_support::types::FarmCertification
   **/
  TfchainSupportFarmCertification: {
    _enum: ["NotCertified", "Gold"],
  },
  /**
   * Lookup52: tfchain_support::types::PublicIP
   **/
  TfchainSupportPublicIP: {
    ip: "Bytes",
    gateway: "Bytes",
    contractId: "u64",
  },
  /**
   * Lookup58: tfchain_support::types::FarmingPolicyLimit
   **/
  TfchainSupportFarmingPolicyLimit: {
    farmingPolicyId: "u32",
    cu: "Option<u64>",
    su: "Option<u64>",
    end: "Option<u64>",
    nodeCount: "Option<u32>",
    nodeCertification: "bool",
  },
  /**
   * Lookup61: tfchain_support::types::Node<pallet_tfgrid::node::Location<T>, tfchain_support::types::Interface<pallet_tfgrid::interface::InterfaceName<T>, pallet_tfgrid::interface::InterfaceMac<T>, bounded_collections::bounded_vec::BoundedVec<pallet_tfgrid::interface::InterfaceIp<T>, S>>, pallet_tfgrid::node::SerialNumber<T>>
   **/
  TfchainSupportNode: {
    version: "u32",
    id: "u32",
    farmId: "u32",
    twinId: "u32",
    resources: "TfchainSupportResources",
    location: "PalletTfgridNodeLocation",
    publicConfig: "Option<TfchainSupportPublicConfig>",
    created: "u64",
    farmingPolicyId: "u32",
    interfaces: "Vec<TfchainSupportInterfaceInterfaceName>",
    certification: "TfchainSupportNodeCertification",
    secureBoot: "bool",
    virtualized: "bool",
    serialNumber: "Option<Bytes>",
    connectionPrice: "u32",
  },
  /**
   * Lookup62: pallet_tfgrid::node::Location<T>
   **/
  PalletTfgridNodeLocation: {
    city: "Bytes",
    country: "Bytes",
    latitude: "Bytes",
    longitude: "Bytes",
  },
  /**
   * Lookup68: tfchain_support::types::Interface<pallet_tfgrid::interface::InterfaceName<T>, pallet_tfgrid::interface::InterfaceMac<T>, bounded_collections::bounded_vec::BoundedVec<pallet_tfgrid::interface::InterfaceIp<T>, S>>
   **/
  TfchainSupportInterfaceInterfaceName: {
    name: "Bytes",
    mac: "Bytes",
    ips: "Vec<Bytes>",
  },
  /**
   * Lookup79: tfchain_support::resources::Resources
   **/
  TfchainSupportResources: {
    hru: "u64",
    sru: "u64",
    cru: "u64",
    mru: "u64",
  },
  /**
   * Lookup81: tfchain_support::types::PublicConfig
   **/
  TfchainSupportPublicConfig: {
    ip4: "TfchainSupportIp4",
    ip6: "Option<TfchainSupportIp6>",
    domain: "Option<Bytes>",
  },
  /**
   * Lookup82: tfchain_support::types::IP4
   **/
  TfchainSupportIp4: {
    ip: "Bytes",
    gw: "Bytes",
  },
  /**
   * Lookup84: tfchain_support::types::IP6
   **/
  TfchainSupportIp6: {
    ip: "Bytes",
    gw: "Bytes",
  },
  /**
   * Lookup89: tfchain_support::types::NodeCertification
   **/
  TfchainSupportNodeCertification: {
    _enum: ["Diy", "Certified"],
  },
  /**
   * Lookup91: pallet_tfgrid::types::Entity<sp_core::crypto::AccountId32, pallet_tfgrid::node::CityName<T>, pallet_tfgrid::node::CountryName<T>>
   **/
  PalletTfgridEntity: {
    version: "u32",
    id: "u32",
    name: "Bytes",
    accountId: "AccountId32",
    country: "Bytes",
    city: "Bytes",
  },
  /**
   * Lookup92: pallet_tfgrid::types::Twin<sp_core::crypto::AccountId32>
   **/
  PalletTfgridTwin: {
    id: "u32",
    accountId: "AccountId32",
    relay: "Option<Bytes>",
    entities: "Vec<PalletTfgridEntityProof>",
    pk: "Option<Bytes>",
  },
  /**
   * Lookup96: pallet_tfgrid::types::EntityProof
   **/
  PalletTfgridEntityProof: {
    entityId: "u32",
    signature: "Bytes",
  },
  /**
   * Lookup97: pallet_tfgrid::types::PricingPolicy<sp_core::crypto::AccountId32>
   **/
  PalletTfgridPricingPolicy: {
    version: "u32",
    id: "u32",
    name: "Bytes",
    su: "PalletTfgridPolicy",
    cu: "PalletTfgridPolicy",
    nu: "PalletTfgridPolicy",
    ipu: "PalletTfgridPolicy",
    uniqueName: "PalletTfgridPolicy",
    domainName: "PalletTfgridPolicy",
    foundationAccount: "AccountId32",
    certifiedSalesAccount: "AccountId32",
    discountForDedicationNodes: "u8",
  },
  /**
   * Lookup98: pallet_tfgrid::types::Policy
   **/
  PalletTfgridPolicy: {
    value: "u32",
    unit: "PalletTfgridUnit",
  },
  /**
   * Lookup99: pallet_tfgrid::types::Unit
   **/
  PalletTfgridUnit: {
    _enum: ["Bytes", "Kilobytes", "Megabytes", "Gigabytes", "Terrabytes"],
  },
  /**
   * Lookup100: pallet_tfgrid::types::FarmingPolicy<BlockNumber>
   **/
  PalletTfgridFarmingPolicy: {
    version: "u32",
    id: "u32",
    name: "Bytes",
    cu: "u32",
    su: "u32",
    nu: "u32",
    ipv4: "u32",
    minimalUptime: "u16",
    policyCreated: "u32",
    policyEnd: "u32",
    immutable: "bool",
    default: "bool",
    nodeCertification: "TfchainSupportNodeCertification",
    farmCertification: "TfchainSupportFarmCertification",
  },
  /**
   * Lookup102: tfchain_support::types::Power
   **/
  TfchainSupportPower: {
    _enum: ["Up", "Down"],
  },
  /**
   * Lookup103: tfchain_support::types::PowerState<B>
   **/
  TfchainSupportPowerState: {
    _enum: {
      Up: "Null",
      Down: "u32",
    },
  },
  /**
   * Lookup104: pallet_smart_contract::pallet::Event<T>
   **/
  PalletSmartContractEvent: {
    _enum: {
      ContractCreated: "PalletSmartContractContract",
      ContractUpdated: "PalletSmartContractContract",
      NodeContractCanceled: {
        contractId: "u64",
        nodeId: "u32",
        twinId: "u32",
      },
      NameContractCanceled: {
        contractId: "u64",
      },
      IPsReserved: {
        contractId: "u64",
        publicIps: "Vec<TfchainSupportPublicIP>",
      },
      IPsFreed: {
        contractId: "u64",
        publicIps: "Vec<TfchainSupportPublicIP>",
      },
      ContractDeployed: "(u64,AccountId32)",
      ConsumptionReportReceived: "PalletSmartContractConsumption",
      ContractBilled: "PalletSmartContractContractBill",
      TokensBurned: {
        contractId: "u64",
        amount: "u128",
      },
      UpdatedUsedResources: "PalletSmartContractContractResources",
      NruConsumptionReportReceived: "PalletSmartContractNruConsumption",
      RentContractCanceled: {
        contractId: "u64",
      },
      ContractGracePeriodStarted: {
        contractId: "u64",
        nodeId: "u32",
        twinId: "u32",
        blockNumber: "u64",
      },
      ContractGracePeriodEnded: {
        contractId: "u64",
        nodeId: "u32",
        twinId: "u32",
      },
      SolutionProviderCreated: "PalletSmartContractSolutionProvider",
      SolutionProviderApproved: "(u64,bool)",
      ServiceContractCreated: "PalletSmartContractServiceContract",
      ServiceContractMetadataSet: "PalletSmartContractServiceContract",
      ServiceContractFeesSet: "PalletSmartContractServiceContract",
      ServiceContractApproved: "PalletSmartContractServiceContract",
      ServiceContractCanceled: {
        serviceContractId: "u64",
        cause: "PalletSmartContractCause",
      },
      ServiceContractBilled: {
        serviceContract: "PalletSmartContractServiceContract",
        bill: "PalletSmartContractServiceContractBill",
        amount: "u128",
      },
      BillingFrequencyChanged: "u64",
      NodeExtraFeeSet: {
        nodeId: "u32",
        extraFee: "u64",
      },
      RentWaived: {
        contractId: "u64",
      },
      ContractGracePeriodElapsed: {
        contractId: "u64",
        gracePeriod: "u64",
      },
      ContractPaymentOverdrawn: {
        contractId: "u64",
        timestamp: "u64",
        partiallyBilledAmount: "u128",
        overdraft: "u128",
      },
      RewardDistributed: {
        contractId: "u64",
        standardRewards: "u128",
        additionalRewards: "u128",
      },
    },
  },
  /**
   * Lookup105: pallet_smart_contract::types::Contract<T>
   **/
  PalletSmartContractContract: {
    version: "u32",
    state: "PalletSmartContractContractState",
    contractId: "u64",
    twinId: "u32",
    contractType: "PalletSmartContractContractData",
    solutionProviderId: "Option<u64>",
  },
  /**
   * Lookup106: pallet_smart_contract::types::ContractState
   **/
  PalletSmartContractContractState: {
    _enum: {
      Created: "Null",
      Deleted: "PalletSmartContractCause",
      GracePeriod: "u64",
    },
  },
  /**
   * Lookup107: pallet_smart_contract::types::Cause
   **/
  PalletSmartContractCause: {
    _enum: ["CanceledByUser", "OutOfFunds", "CanceledByCollective"],
  },
  /**
   * Lookup108: pallet_smart_contract::types::ContractData<T>
   **/
  PalletSmartContractContractData: {
    _enum: {
      NodeContract: "PalletSmartContractNodeContract",
      NameContract: "PalletSmartContractNameContract",
      RentContract: "PalletSmartContractRentContract",
    },
  },
  /**
   * Lookup109: pallet_smart_contract::types::NodeContract<T>
   **/
  PalletSmartContractNodeContract: {
    nodeId: "u32",
    deploymentHash: "[u8;32]",
    deploymentData: "Bytes",
    publicIps: "u32",
    publicIpsList: "Vec<TfchainSupportPublicIP>",
  },
  /**
   * Lookup112: pallet_smart_contract::types::NameContract<T>
   **/
  PalletSmartContractNameContract: {
    name: "Bytes",
  },
  /**
   * Lookup115: pallet_smart_contract::types::RentContract
   **/
  PalletSmartContractRentContract: {
    nodeId: "u32",
  },
  /**
   * Lookup116: pallet_smart_contract::types::Consumption
   **/
  PalletSmartContractConsumption: {
    contractId: "u64",
    timestamp: "u64",
    cru: "u64",
    sru: "u64",
    hru: "u64",
    mru: "u64",
    nru: "u64",
  },
  /**
   * Lookup117: pallet_smart_contract::types::ContractBill
   **/
  PalletSmartContractContractBill: {
    contractId: "u64",
    timestamp: "u64",
    discountLevel: "PalletSmartContractDiscountLevel",
    amountBilled: "u128",
  },
  /**
   * Lookup118: pallet_smart_contract::types::DiscountLevel
   **/
  PalletSmartContractDiscountLevel: {
    _enum: ["None", "Default", "Bronze", "Silver", "Gold"],
  },
  /**
   * Lookup119: pallet_smart_contract::types::ContractResources
   **/
  PalletSmartContractContractResources: {
    contractId: "u64",
    used: "TfchainSupportResources",
  },
  /**
   * Lookup120: pallet_smart_contract::types::NruConsumption
   **/
  PalletSmartContractNruConsumption: {
    contractId: "u64",
    timestamp: "u64",
    window: "u64",
    nru: "u64",
  },
  /**
   * Lookup121: pallet_smart_contract::types::SolutionProvider<sp_core::crypto::AccountId32>
   **/
  PalletSmartContractSolutionProvider: {
    solutionProviderId: "u64",
    providers: "Vec<PalletSmartContractProvider>",
    description: "Bytes",
    link: "Bytes",
    approved: "bool",
  },
  /**
   * Lookup123: pallet_smart_contract::types::Provider<sp_core::crypto::AccountId32>
   **/
  PalletSmartContractProvider: {
    who: "AccountId32",
    take: "u8",
  },
  /**
   * Lookup124: pallet_smart_contract::types::ServiceContract
   **/
  PalletSmartContractServiceContract: {
    serviceContractId: "u64",
    serviceTwinId: "u32",
    consumerTwinId: "u32",
    baseFee: "u64",
    variableFee: "u64",
    metadata: "Bytes",
    acceptedByService: "bool",
    acceptedByConsumer: "bool",
    lastBill: "u64",
    state: "PalletSmartContractServiceContractState",
  },
  /**
   * Lookup126: pallet_smart_contract::types::ServiceContractState
   **/
  PalletSmartContractServiceContractState: {
    _enum: ["Created", "AgreementReady", "ApprovedByBoth"],
  },
  /**
   * Lookup127: pallet_smart_contract::types::ServiceContractBill
   **/
  PalletSmartContractServiceContractBill: {
    variableAmount: "u64",
    window: "u64",
    metadata: "Bytes",
  },
  /**
   * Lookup128: pallet_tft_bridge::pallet::Event<T>
   **/
  PalletTftBridgeEvent: {
    _enum: {
      MintTransactionProposed: "(Bytes,AccountId32,u64)",
      MintTransactionVoted: "Bytes",
      MintCompleted: "(PalletTftBridgeMintTransaction,Bytes)",
      MintTransactionExpired: "(Bytes,u64,AccountId32)",
      BurnTransactionCreated: "(u64,AccountId32,Bytes,u64)",
      BurnTransactionProposed: "(u64,Bytes,u64)",
      BurnTransactionSignatureAdded: "(u64,PalletTftBridgeStellarSignature)",
      BurnTransactionReady: "u64",
      BurnTransactionProcessed: "PalletTftBridgeBurnTransaction",
      BurnTransactionExpired: "(u64,Option<AccountId32>,Bytes,u64)",
      RefundTransactionCreated: "(Bytes,Bytes,u64)",
      RefundTransactionsignatureAdded: "(Bytes,PalletTftBridgeStellarSignature)",
      RefundTransactionReady: "Bytes",
      RefundTransactionProcessed: "PalletTftBridgeRefundTransaction",
      RefundTransactionExpired: "(Bytes,Bytes,u64)",
    },
  },
  /**
   * Lookup129: pallet_tft_bridge::types::MintTransaction<sp_core::crypto::AccountId32, BlockNumber>
   **/
  PalletTftBridgeMintTransaction: {
    amount: "u64",
    target: "AccountId32",
    block: "u32",
    votes: "u32",
  },
  /**
   * Lookup130: pallet_tft_bridge::types::StellarSignature
   **/
  PalletTftBridgeStellarSignature: {
    signature: "Bytes",
    stellarPubKey: "Bytes",
  },
  /**
   * Lookup131: pallet_tft_bridge::types::BurnTransaction<sp_core::crypto::AccountId32, BlockNumber>
   **/
  PalletTftBridgeBurnTransaction: {
    block: "u32",
    amount: "u64",
    source: "Option<AccountId32>",
    target: "Bytes",
    signatures: "Vec<PalletTftBridgeStellarSignature>",
    sequenceNumber: "u64",
  },
  /**
   * Lookup134: pallet_tft_bridge::types::RefundTransaction<BlockNumber>
   **/
  PalletTftBridgeRefundTransaction: {
    block: "u32",
    amount: "u64",
    target: "Bytes",
    txHash: "Bytes",
    signatures: "Vec<PalletTftBridgeStellarSignature>",
    sequenceNumber: "u64",
  },
  /**
   * Lookup135: pallet_tft_price::pallet::Event<T>
   **/
  PalletTftPriceEvent: {
    _enum: {
      PriceStored: "u32",
      OffchainWorkerExecuted: "AccountId32",
      AveragePriceStored: "u32",
      AveragePriceIsAboveMaxPrice: "(u32,u32)",
      AveragePriceIsBelowMinPrice: "(u32,u32)",
    },
  },
  /**
   * Lookup136: pallet_burning::pallet::Event<T>
   **/
  PalletBurningEvent: {
    _enum: {
      BurnTransactionCreated: "(AccountId32,u128,u32,Bytes)",
    },
  },
  /**
   * Lookup137: pallet_kvstore::pallet::Event<T>
   **/
  PalletKvstoreEvent: {
    _enum: {
      EntrySet: "(AccountId32,Bytes,Bytes)",
      EntryGot: "(AccountId32,Bytes,Bytes)",
      EntryTaken: "(AccountId32,Bytes,Bytes)",
    },
  },
  /**
   * Lookup138: pallet_collective::pallet::Event<T, I>
   **/
  PalletCollectiveEvent: {
    _enum: {
      Proposed: {
        account: "AccountId32",
        proposalIndex: "u32",
        proposalHash: "H256",
        threshold: "u32",
      },
      Voted: {
        account: "AccountId32",
        proposalHash: "H256",
        voted: "bool",
        yes: "u32",
        no: "u32",
      },
      Approved: {
        proposalHash: "H256",
      },
      Disapproved: {
        proposalHash: "H256",
      },
      Executed: {
        proposalHash: "H256",
        result: "Result<Null, SpRuntimeDispatchError>",
      },
      MemberExecuted: {
        proposalHash: "H256",
        result: "Result<Null, SpRuntimeDispatchError>",
      },
      Closed: {
        proposalHash: "H256",
        yes: "u32",
        no: "u32",
      },
    },
  },
  /**
   * Lookup139: pallet_membership::pallet::Event<T, I>
   **/
  PalletMembershipEvent: {
    _enum: ["MemberAdded", "MemberRemoved", "MembersSwapped", "MembersReset", "KeyChanged", "Dummy"],
  },
  /**
   * Lookup140: pallet_dao::pallet::Event<T>
   **/
  PalletDaoEvent: {
    _enum: {
      Voted: {
        account: "AccountId32",
        proposalHash: "H256",
        voted: "bool",
        yes: "u32",
        no: "u32",
      },
      Proposed: {
        account: "AccountId32",
        proposalIndex: "u32",
        proposalHash: "H256",
        threshold: "u32",
      },
      Approved: {
        proposalHash: "H256",
      },
      Disapproved: {
        proposalHash: "H256",
      },
      Executed: {
        proposalHash: "H256",
        result: "Result<Null, SpRuntimeDispatchError>",
      },
      Closed: {
        proposalHash: "H256",
        yes: "u32",
        yesWeight: "u64",
        no: "u32",
        noWeight: "u64",
      },
      ClosedByCouncil: {
        proposalHash: "H256",
        vetos: "Vec<AccountId32>",
      },
      CouncilMemberVeto: {
        proposalHash: "H256",
        who: "AccountId32",
      },
    },
  },
  /**
   * Lookup142: pallet_validator::pallet::Event<T>
   **/
  PalletValidatorEvent: {
    _enum: {
      Bonded: "AccountId32",
      ValidatorRequestCreated: "(AccountId32,PalletValidatorValidator)",
      ValidatorRequestApproved: "PalletValidatorValidator",
      ValidatorActivated: "PalletValidatorValidator",
      ValidatorRemoved: "PalletValidatorValidator",
      NodeValidatorChanged: "AccountId32",
      NodeValidatorRemoved: "AccountId32",
    },
  },
  /**
   * Lookup143: pallet_validator::types::Validator<sp_core::crypto::AccountId32>
   **/
  PalletValidatorValidator: {
    validatorNodeAccount: "AccountId32",
    stashAccount: "AccountId32",
    description: "Bytes",
    tfConnectId: "Bytes",
    info: "Bytes",
    state: "PalletValidatorValidatorRequestState",
  },
  /**
   * Lookup144: pallet_validator::types::ValidatorRequestState
   **/
  PalletValidatorValidatorRequestState: {
    _enum: ["Created", "Approved", "Validating"],
  },
  /**
   * Lookup145: frame_system::Phase
   **/
  FrameSystemPhase: {
    _enum: {
      ApplyExtrinsic: "u32",
      Finalization: "Null",
      Initialization: "Null",
    },
  },
  /**
   * Lookup148: frame_system::LastRuntimeUpgradeInfo
   **/
  FrameSystemLastRuntimeUpgradeInfo: {
    specVersion: "Compact<u32>",
    specName: "Text",
  },
  /**
   * Lookup151: frame_system::pallet::Call<T>
   **/
  FrameSystemCall: {
    _enum: {
      remark: {
        remark: "Bytes",
      },
      set_heap_pages: {
        pages: "u64",
      },
      set_code: {
        code: "Bytes",
      },
      set_code_without_checks: {
        code: "Bytes",
      },
      set_storage: {
        items: "Vec<(Bytes,Bytes)>",
      },
      kill_storage: {
        _alias: {
          keys_: "keys",
        },
        keys_: "Vec<Bytes>",
      },
      kill_prefix: {
        prefix: "Bytes",
        subkeys: "u32",
      },
      remark_with_event: {
        remark: "Bytes",
      },
    },
  },
  /**
   * Lookup155: frame_system::limits::BlockWeights
   **/
  FrameSystemLimitsBlockWeights: {
    baseBlock: "SpWeightsWeightV2Weight",
    maxBlock: "SpWeightsWeightV2Weight",
    perClass: "FrameSupportDispatchPerDispatchClassWeightsPerClass",
  },
  /**
   * Lookup156: frame_support::dispatch::PerDispatchClass<frame_system::limits::WeightsPerClass>
   **/
  FrameSupportDispatchPerDispatchClassWeightsPerClass: {
    normal: "FrameSystemLimitsWeightsPerClass",
    operational: "FrameSystemLimitsWeightsPerClass",
    mandatory: "FrameSystemLimitsWeightsPerClass",
  },
  /**
   * Lookup157: frame_system::limits::WeightsPerClass
   **/
  FrameSystemLimitsWeightsPerClass: {
    baseExtrinsic: "SpWeightsWeightV2Weight",
    maxExtrinsic: "Option<SpWeightsWeightV2Weight>",
    maxTotal: "Option<SpWeightsWeightV2Weight>",
    reserved: "Option<SpWeightsWeightV2Weight>",
  },
  /**
   * Lookup159: frame_system::limits::BlockLength
   **/
  FrameSystemLimitsBlockLength: {
    max: "FrameSupportDispatchPerDispatchClassU32",
  },
  /**
   * Lookup160: frame_support::dispatch::PerDispatchClass<T>
   **/
  FrameSupportDispatchPerDispatchClassU32: {
    normal: "u32",
    operational: "u32",
    mandatory: "u32",
  },
  /**
   * Lookup161: sp_weights::RuntimeDbWeight
   **/
  SpWeightsRuntimeDbWeight: {
    read: "u64",
    write: "u64",
  },
  /**
   * Lookup162: sp_version::RuntimeVersion
   **/
  SpVersionRuntimeVersion: {
    specName: "Text",
    implName: "Text",
    authoringVersion: "u32",
    specVersion: "u32",
    implVersion: "u32",
    apis: "Vec<([u8;8],u32)>",
    transactionVersion: "u32",
    stateVersion: "u8",
  },
  /**
   * Lookup167: frame_system::pallet::Error<T>
   **/
  FrameSystemError: {
    _enum: [
      "InvalidSpecName",
      "SpecVersionNeedsToIncrease",
      "FailedToExtractRuntimeVersion",
      "NonDefaultComposite",
      "NonZeroRefCount",
      "CallFiltered",
    ],
  },
  /**
   * Lookup168: pallet_timestamp::pallet::Call<T>
   **/
  PalletTimestampCall: {
    _enum: {
      set: {
        now: "Compact<u64>",
      },
    },
  },
  /**
   * Lookup169: pallet_utility::pallet::Call<T>
   **/
  PalletUtilityCall: {
    _enum: {
      batch: {
        calls: "Vec<Call>",
      },
      as_derivative: {
        index: "u16",
        call: "Call",
      },
      batch_all: {
        calls: "Vec<Call>",
      },
      dispatch_as: {
        asOrigin: "TfchainRuntimeOriginCaller",
        call: "Call",
      },
      force_batch: {
        calls: "Vec<Call>",
      },
      with_weight: {
        call: "Call",
        weight: "SpWeightsWeightV2Weight",
      },
    },
  },
  /**
   * Lookup172: pallet_scheduler::pallet::Call<T>
   **/
  PalletSchedulerCall: {
    _enum: {
      schedule: {
        when: "u32",
        maybePeriodic: "Option<(u32,u32)>",
        priority: "u8",
        call: "Call",
      },
      cancel: {
        when: "u32",
        index: "u32",
      },
      schedule_named: {
        id: "[u8;32]",
        when: "u32",
        maybePeriodic: "Option<(u32,u32)>",
        priority: "u8",
        call: "Call",
      },
      cancel_named: {
        id: "[u8;32]",
      },
      schedule_after: {
        after: "u32",
        maybePeriodic: "Option<(u32,u32)>",
        priority: "u8",
        call: "Call",
      },
      schedule_named_after: {
        id: "[u8;32]",
        after: "u32",
        maybePeriodic: "Option<(u32,u32)>",
        priority: "u8",
        call: "Call",
      },
    },
  },
  /**
   * Lookup174: substrate_validator_set::pallet::Call<T>
   **/
  SubstrateValidatorSetCall: {
    _enum: {
      add_validator: {
        validatorId: "AccountId32",
      },
      remove_validator: {
        validatorId: "AccountId32",
      },
      add_validator_again: {
        validatorId: "AccountId32",
      },
    },
  },
  /**
   * Lookup175: pallet_session::pallet::Call<T>
   **/
  PalletSessionCall: {
    _enum: {
      set_keys: {
        _alias: {
          keys_: "keys",
        },
        keys_: "TfchainRuntimeOpaqueSessionKeys",
        proof: "Bytes",
      },
      purge_keys: "Null",
    },
  },
  /**
   * Lookup176: tfchain_runtime::opaque::SessionKeys
   **/
  TfchainRuntimeOpaqueSessionKeys: {
    aura: "SpConsensusAuraSr25519AppSr25519Public",
    grandpa: "SpConsensusGrandpaAppPublic",
  },
  /**
   * Lookup177: sp_consensus_aura::sr25519::app_sr25519::Public
   **/
  SpConsensusAuraSr25519AppSr25519Public: "SpCoreSr25519Public",
  /**
   * Lookup178: sp_core::sr25519::Public
   **/
  SpCoreSr25519Public: "[u8;32]",
  /**
   * Lookup179: pallet_grandpa::pallet::Call<T>
   **/
  PalletGrandpaCall: {
    _enum: {
      report_equivocation: {
        equivocationProof: "SpConsensusGrandpaEquivocationProof",
        keyOwnerProof: "SpCoreVoid",
      },
      report_equivocation_unsigned: {
        equivocationProof: "SpConsensusGrandpaEquivocationProof",
        keyOwnerProof: "SpCoreVoid",
      },
      note_stalled: {
        delay: "u32",
        bestFinalizedBlockNumber: "u32",
      },
    },
  },
  /**
   * Lookup180: sp_consensus_grandpa::EquivocationProof<primitive_types::H256, N>
   **/
  SpConsensusGrandpaEquivocationProof: {
    setId: "u64",
    equivocation: "SpConsensusGrandpaEquivocation",
  },
  /**
   * Lookup181: sp_consensus_grandpa::Equivocation<primitive_types::H256, N>
   **/
  SpConsensusGrandpaEquivocation: {
    _enum: {
      Prevote: "FinalityGrandpaEquivocationPrevote",
      Precommit: "FinalityGrandpaEquivocationPrecommit",
    },
  },
  /**
   * Lookup182: finality_grandpa::Equivocation<sp_consensus_grandpa::app::Public, finality_grandpa::Prevote<primitive_types::H256, N>, sp_consensus_grandpa::app::Signature>
   **/
  FinalityGrandpaEquivocationPrevote: {
    roundNumber: "u64",
    identity: "SpConsensusGrandpaAppPublic",
    first: "(FinalityGrandpaPrevote,SpConsensusGrandpaAppSignature)",
    second: "(FinalityGrandpaPrevote,SpConsensusGrandpaAppSignature)",
  },
  /**
   * Lookup183: finality_grandpa::Prevote<primitive_types::H256, N>
   **/
  FinalityGrandpaPrevote: {
    targetHash: "H256",
    targetNumber: "u32",
  },
  /**
   * Lookup184: sp_consensus_grandpa::app::Signature
   **/
  SpConsensusGrandpaAppSignature: "SpCoreEd25519Signature",
  /**
   * Lookup185: sp_core::ed25519::Signature
   **/
  SpCoreEd25519Signature: "[u8;64]",
  /**
   * Lookup188: finality_grandpa::Equivocation<sp_consensus_grandpa::app::Public, finality_grandpa::Precommit<primitive_types::H256, N>, sp_consensus_grandpa::app::Signature>
   **/
  FinalityGrandpaEquivocationPrecommit: {
    roundNumber: "u64",
    identity: "SpConsensusGrandpaAppPublic",
    first: "(FinalityGrandpaPrecommit,SpConsensusGrandpaAppSignature)",
    second: "(FinalityGrandpaPrecommit,SpConsensusGrandpaAppSignature)",
  },
  /**
   * Lookup189: finality_grandpa::Precommit<primitive_types::H256, N>
   **/
  FinalityGrandpaPrecommit: {
    targetHash: "H256",
    targetNumber: "u32",
  },
  /**
   * Lookup191: sp_core::Void
   **/
  SpCoreVoid: "Null",
  /**
   * Lookup192: pallet_balances::pallet::Call<T, I>
   **/
  PalletBalancesCall: {
    _enum: {
      transfer_allow_death: {
        dest: "MultiAddress",
        value: "Compact<u128>",
      },
      set_balance_deprecated: {
        who: "MultiAddress",
        newFree: "Compact<u128>",
        oldReserved: "Compact<u128>",
      },
      force_transfer: {
        source: "MultiAddress",
        dest: "MultiAddress",
        value: "Compact<u128>",
      },
      transfer_keep_alive: {
        dest: "MultiAddress",
        value: "Compact<u128>",
      },
      transfer_all: {
        dest: "MultiAddress",
        keepAlive: "bool",
      },
      force_unreserve: {
        who: "MultiAddress",
        amount: "u128",
      },
      upgrade_accounts: {
        who: "Vec<AccountId32>",
      },
      transfer: {
        dest: "MultiAddress",
        value: "Compact<u128>",
      },
      force_set_balance: {
        who: "MultiAddress",
        newFree: "Compact<u128>",
      },
    },
  },
  /**
   * Lookup197: pallet_tfgrid::pallet::Call<T>
   **/
  PalletTfgridCall: {
    _enum: {
      set_storage_version: {
        version: "PalletTfgridStorageVersion",
      },
      create_farm: {
        name: "Bytes",
        publicIps: "Vec<TfchainSupportIp4>",
      },
      update_farm: {
        farmId: "u32",
        name: "Bytes",
      },
      add_stellar_payout_v2address: {
        farmId: "u32",
        stellarAddress: "Bytes",
      },
      set_farm_certification: {
        farmId: "u32",
        certification: "TfchainSupportFarmCertification",
      },
      add_farm_ip: {
        farmId: "u32",
        ip: "Bytes",
        gw: "Bytes",
      },
      remove_farm_ip: {
        farmId: "u32",
        ip: "Bytes",
      },
      __Unused7: "Null",
      create_node: {
        farmId: "u32",
        resources: "TfchainSupportResources",
        location: "PalletTfgridLocationInput",
        interfaces: "Vec<TfchainSupportInterfaceBoundedVec>",
        secureBoot: "bool",
        virtualized: "bool",
        serialNumber: "Option<Bytes>",
      },
      update_node: {
        nodeId: "u32",
        farmId: "u32",
        resources: "TfchainSupportResources",
        location: "PalletTfgridLocationInput",
        interfaces: "Vec<TfchainSupportInterfaceBoundedVec>",
        secureBoot: "bool",
        virtualized: "bool",
        serialNumber: "Option<Bytes>",
      },
      set_node_certification: {
        nodeId: "u32",
        nodeCertification: "TfchainSupportNodeCertification",
      },
      report_uptime: {
        uptime: "u64",
      },
      add_node_public_config: {
        farmId: "u32",
        nodeId: "u32",
        publicConfig: "Option<TfchainSupportPublicConfig>",
      },
      delete_node: {
        nodeId: "u32",
      },
      create_entity: {
        target: "AccountId32",
        name: "Bytes",
        country: "Bytes",
        city: "Bytes",
        signature: "Bytes",
      },
      update_entity: {
        name: "Bytes",
        country: "Bytes",
        city: "Bytes",
      },
      delete_entity: "Null",
      create_twin: {
        relay: "Option<Bytes>",
        pk: "Option<Bytes>",
      },
      update_twin: {
        relay: "Option<Bytes>",
        pk: "Option<Bytes>",
      },
      add_twin_entity: {
        twinId: "u32",
        entityId: "u32",
        signature: "Bytes",
      },
      delete_twin_entity: {
        twinId: "u32",
        entityId: "u32",
      },
      __Unused21: "Null",
      create_pricing_policy: {
        name: "Bytes",
        su: "PalletTfgridPolicy",
        cu: "PalletTfgridPolicy",
        nu: "PalletTfgridPolicy",
        ipu: "PalletTfgridPolicy",
        uniqueName: "PalletTfgridPolicy",
        domainName: "PalletTfgridPolicy",
        foundationAccount: "AccountId32",
        certifiedSalesAccount: "AccountId32",
        discountForDedicationNodes: "u8",
      },
      update_pricing_policy: {
        pricingPolicyId: "u32",
        name: "Bytes",
        su: "PalletTfgridPolicy",
        cu: "PalletTfgridPolicy",
        nu: "PalletTfgridPolicy",
        ipu: "PalletTfgridPolicy",
        uniqueName: "PalletTfgridPolicy",
        domainName: "PalletTfgridPolicy",
        foundationAccount: "AccountId32",
        certifiedSalesAccount: "AccountId32",
        discountForDedicationNodes: "u8",
      },
      create_farming_policy: {
        name: "Bytes",
        su: "u32",
        cu: "u32",
        nu: "u32",
        ipv4: "u32",
        minimalUptime: "u16",
        policyEnd: "u32",
        immutable: "bool",
        default: "bool",
        nodeCertification: "TfchainSupportNodeCertification",
        farmCertification: "TfchainSupportFarmCertification",
      },
      user_accept_tc: {
        documentLink: "Bytes",
        documentHash: "Bytes",
      },
      delete_node_farm: {
        nodeId: "u32",
      },
      set_farm_dedicated: {
        farmId: "u32",
        dedicated: "bool",
      },
      force_reset_farm_ip: {
        farmId: "u32",
        ip: "Bytes",
      },
      set_connection_price: {
        price: "u32",
      },
      add_node_certifier: {
        certifier: "AccountId32",
      },
      remove_node_certifier: {
        certifier: "AccountId32",
      },
      update_farming_policy: {
        farmingPolicyId: "u32",
        name: "Bytes",
        su: "u32",
        cu: "u32",
        nu: "u32",
        ipv4: "u32",
        minimalUptime: "u16",
        policyEnd: "u32",
        default: "bool",
        nodeCertification: "TfchainSupportNodeCertification",
        farmCertification: "TfchainSupportFarmCertification",
      },
      attach_policy_to_farm: {
        farmId: "u32",
        limits: "Option<TfchainSupportFarmingPolicyLimit>",
      },
      set_zos_version: {
        zosVersion: "Bytes",
      },
      change_power_state: {
        powerState: "TfchainSupportPower",
      },
      change_power_target: {
        nodeId: "u32",
        powerTarget: "TfchainSupportPower",
      },
      bond_twin_account: {
        twinId: "u32",
      },
      report_uptime_v2: {
        uptime: "u64",
        timestampHint: "u64",
      },
    },
  },
  /**
   * Lookup198: pallet_tfgrid::types::StorageVersion
   **/
  PalletTfgridStorageVersion: {
    _enum: [
      "V1Struct",
      "V2Struct",
      "V3Struct",
      "V4Struct",
      "V5Struct",
      "V6Struct",
      "V7Struct",
      "V8Struct",
      "V9Struct",
      "V10Struct",
      "V11Struct",
      "V12Struct",
      "V13Struct",
      "V14Struct",
      "V15Struct",
      "V16Struct",
      "V17Struct",
    ],
  },
  /**
   * Lookup201: pallet_tfgrid::types::LocationInput<bounded_collections::bounded_vec::BoundedVec<T, S>, bounded_collections::bounded_vec::BoundedVec<T, S>, bounded_collections::bounded_vec::BoundedVec<T, S>, bounded_collections::bounded_vec::BoundedVec<T, S>>
   **/
  PalletTfgridLocationInput: {
    city: "Bytes",
    country: "Bytes",
    latitude: "Bytes",
    longitude: "Bytes",
  },
  /**
   * Lookup203: tfchain_support::types::Interface<bounded_collections::bounded_vec::BoundedVec<T, S>, bounded_collections::bounded_vec::BoundedVec<T, S>, bounded_collections::bounded_vec::BoundedVec<bounded_collections::bounded_vec::BoundedVec<T, S>, S>>
   **/
  TfchainSupportInterfaceBoundedVec: {
    name: "Bytes",
    mac: "Bytes",
    ips: "Vec<Bytes>",
  },
  /**
   * Lookup208: pallet_smart_contract::pallet::Call<T>
   **/
  PalletSmartContractCall: {
    _enum: {
      create_node_contract: {
        nodeId: "u32",
        deploymentHash: "[u8;32]",
        deploymentData: "Bytes",
        publicIps: "u32",
        solutionProviderId: "Option<u64>",
      },
      update_node_contract: {
        contractId: "u64",
        deploymentHash: "[u8;32]",
        deploymentData: "Bytes",
      },
      cancel_contract: {
        contractId: "u64",
      },
      __Unused3: "Null",
      create_name_contract: {
        name: "Bytes",
      },
      add_nru_reports: {
        reports: "Vec<PalletSmartContractNruConsumption>",
      },
      report_contract_resources: {
        contractResources: "Vec<PalletSmartContractContractResources>",
      },
      create_rent_contract: {
        nodeId: "u32",
        solutionProviderId: "Option<u64>",
      },
      create_solution_provider: {
        description: "Bytes",
        link: "Bytes",
        providers: "Vec<PalletSmartContractProvider>",
      },
      approve_solution_provider: {
        solutionProviderId: "u64",
        approve: "bool",
      },
      bill_contract_for_block: {
        contractId: "u64",
      },
      service_contract_create: {
        serviceAccount: "AccountId32",
        consumerAccount: "AccountId32",
      },
      service_contract_set_metadata: {
        serviceContractId: "u64",
        metadata: "Bytes",
      },
      service_contract_set_fees: {
        serviceContractId: "u64",
        baseFee: "u64",
        variableFee: "u64",
      },
      service_contract_approve: {
        serviceContractId: "u64",
      },
      service_contract_reject: {
        serviceContractId: "u64",
      },
      service_contract_cancel: {
        serviceContractId: "u64",
      },
      service_contract_bill: {
        serviceContractId: "u64",
        variableAmount: "u64",
        metadata: "Bytes",
      },
      change_billing_frequency: {
        frequency: "u64",
      },
      attach_solution_provider_id: {
        contractId: "u64",
        solutionProviderId: "u64",
      },
      set_dedicated_node_extra_fee: {
        nodeId: "u32",
        extraFee: "u64",
      },
      cancel_contract_collective: {
        contractId: "u64",
      },
    },
  },
  /**
   * Lookup211: pallet_tft_bridge::pallet::Call<T>
   **/
  PalletTftBridgeCall: {
    _enum: {
      add_bridge_validator: {
        target: "AccountId32",
      },
      remove_bridge_validator: {
        target: "AccountId32",
      },
      set_fee_account: {
        target: "AccountId32",
      },
      set_withdraw_fee: {
        amount: "u64",
      },
      set_deposit_fee: {
        amount: "u64",
      },
      swap_to_stellar: {
        targetStellarAddress: "Bytes",
        amount: "u128",
      },
      propose_or_vote_mint_transaction: {
        transaction: "Bytes",
        target: "AccountId32",
        amount: "u64",
      },
      propose_burn_transaction_or_add_sig: {
        transactionId: "u64",
        target: "Bytes",
        amount: "u64",
        signature: "Bytes",
        stellarPubKey: "Bytes",
        sequenceNumber: "u64",
      },
      set_burn_transaction_executed: {
        transactionId: "u64",
      },
      create_refund_transaction_or_add_sig: {
        txHash: "Bytes",
        target: "Bytes",
        amount: "u64",
        signature: "Bytes",
        stellarPubKey: "Bytes",
        sequenceNumber: "u64",
      },
      set_refund_transaction_executed: {
        txHash: "Bytes",
      },
    },
  },
  /**
   * Lookup212: pallet_tft_price::pallet::Call<T>
   **/
  PalletTftPriceCall: {
    _enum: {
      set_prices: {
        price: "u32",
        blockNumber: "u32",
      },
      __Unused1: "Null",
      set_min_tft_price: {
        price: "u32",
      },
      set_max_tft_price: {
        price: "u32",
      },
    },
  },
  /**
   * Lookup213: pallet_burning::pallet::Call<T>
   **/
  PalletBurningCall: {
    _enum: {
      burn_tft: {
        amount: "u128",
        message: "Bytes",
      },
    },
  },
  /**
   * Lookup214: pallet_kvstore::pallet::Call<T>
   **/
  PalletKvstoreCall: {
    _enum: {
      set: {
        key: "Bytes",
        value: "Bytes",
      },
      delete: {
        key: "Bytes",
      },
    },
  },
  /**
   * Lookup215: pallet_runtime_upgrade::pallet::Call<T>
   **/
  PalletRuntimeUpgradeCall: {
    _enum: {
      set_code: {
        code: "Bytes",
      },
    },
  },
  /**
   * Lookup216: pallet_collective::pallet::Call<T, I>
   **/
  PalletCollectiveCall: {
    _enum: {
      set_members: {
        newMembers: "Vec<AccountId32>",
        prime: "Option<AccountId32>",
        oldCount: "u32",
      },
      execute: {
        proposal: "Call",
        lengthBound: "Compact<u32>",
      },
      propose: {
        threshold: "Compact<u32>",
        proposal: "Call",
        lengthBound: "Compact<u32>",
      },
      vote: {
        proposal: "H256",
        index: "Compact<u32>",
        approve: "bool",
      },
      __Unused4: "Null",
      disapprove_proposal: {
        proposalHash: "H256",
      },
      close: {
        proposalHash: "H256",
        index: "Compact<u32>",
        proposalWeightBound: "SpWeightsWeightV2Weight",
        lengthBound: "Compact<u32>",
      },
    },
  },
  /**
   * Lookup217: pallet_membership::pallet::Call<T, I>
   **/
  PalletMembershipCall: {
    _enum: {
      add_member: {
        who: "MultiAddress",
      },
      remove_member: {
        who: "MultiAddress",
      },
      swap_member: {
        remove: "MultiAddress",
        add: "MultiAddress",
      },
      reset_members: {
        members: "Vec<AccountId32>",
      },
      change_key: {
        _alias: {
          new_: "new",
        },
        new_: "MultiAddress",
      },
      set_prime: {
        who: "MultiAddress",
      },
      clear_prime: "Null",
    },
  },
  /**
   * Lookup218: pallet_dao::pallet::Call<T>
   **/
  PalletDaoCall: {
    _enum: {
      propose: {
        threshold: "Compact<u32>",
        action: "Call",
        description: "Bytes",
        link: "Bytes",
        duration: "Option<u32>",
      },
      vote: {
        farmId: "u32",
        proposalHash: "H256",
        approve: "bool",
      },
      veto: {
        proposalHash: "H256",
      },
      close: {
        proposalHash: "H256",
        proposalIndex: "Compact<u32>",
      },
    },
  },
  /**
   * Lookup219: pallet_validator::pallet::Call<T>
   **/
  PalletValidatorCall: {
    _enum: {
      create_validator_request: {
        validatorNodeAccount: "AccountId32",
        stashAccount: "AccountId32",
        description: "Bytes",
        tfConnectId: "Bytes",
        info: "Bytes",
      },
      activate_validator_node: "Null",
      change_validator_node_account: {
        newNodeValidatorAccount: "AccountId32",
      },
      bond: {
        validator: "MultiAddress",
      },
      approve_validator: {
        validatorAccount: "MultiAddress",
      },
      remove_validator: {
        validatorAccount: "MultiAddress",
      },
    },
  },
  /**
   * Lookup220: tfchain_runtime::OriginCaller
   **/
  TfchainRuntimeOriginCaller: {
    _enum: {
      system: "FrameSupportDispatchRawOrigin",
      __Unused1: "Null",
      Void: "SpCoreVoid",
      __Unused3: "Null",
      __Unused4: "Null",
      __Unused5: "Null",
      __Unused6: "Null",
      __Unused7: "Null",
      __Unused8: "Null",
      __Unused9: "Null",
      __Unused10: "Null",
      __Unused11: "Null",
      __Unused12: "Null",
      __Unused13: "Null",
      __Unused14: "Null",
      __Unused15: "Null",
      __Unused16: "Null",
      __Unused17: "Null",
      __Unused18: "Null",
      __Unused19: "Null",
      __Unused20: "Null",
      __Unused21: "Null",
      __Unused22: "Null",
      __Unused23: "Null",
      __Unused24: "Null",
      __Unused25: "Null",
      __Unused26: "Null",
      __Unused27: "Null",
      __Unused28: "Null",
      __Unused29: "Null",
      __Unused30: "Null",
      __Unused31: "Null",
      __Unused32: "Null",
      __Unused33: "Null",
      __Unused34: "Null",
      __Unused35: "Null",
      __Unused36: "Null",
      __Unused37: "Null",
      __Unused38: "Null",
      __Unused39: "Null",
      Council: "PalletCollectiveRawOrigin",
    },
  },
  /**
   * Lookup221: frame_support::dispatch::RawOrigin<sp_core::crypto::AccountId32>
   **/
  FrameSupportDispatchRawOrigin: {
    _enum: {
      Root: "Null",
      Signed: "AccountId32",
      None: "Null",
    },
  },
  /**
   * Lookup222: pallet_collective::RawOrigin<sp_core::crypto::AccountId32, I>
   **/
  PalletCollectiveRawOrigin: {
    _enum: {
      Members: "(u32,u32)",
      Member: "AccountId32",
      _Phantom: "Null",
    },
  },
  /**
   * Lookup223: pallet_utility::pallet::Error<T>
   **/
  PalletUtilityError: {
    _enum: ["TooManyCalls"],
  },
  /**
   * Lookup226: pallet_scheduler::Scheduled<Name, frame_support::traits::preimages::Bounded<tfchain_runtime::RuntimeCall>, BlockNumber, tfchain_runtime::OriginCaller, sp_core::crypto::AccountId32>
   **/
  PalletSchedulerScheduled: {
    maybeId: "Option<[u8;32]>",
    priority: "u8",
    call: "FrameSupportPreimagesBounded",
    maybePeriodic: "Option<(u32,u32)>",
    origin: "TfchainRuntimeOriginCaller",
  },
  /**
   * Lookup227: frame_support::traits::preimages::Bounded<tfchain_runtime::RuntimeCall>
   **/
  FrameSupportPreimagesBounded: {
    _enum: {
      Legacy: {
        _alias: {
          hash_: "hash",
        },
        hash_: "H256",
      },
      Inline: "Bytes",
      Lookup: {
        _alias: {
          hash_: "hash",
        },
        hash_: "H256",
        len: "u32",
      },
    },
  },
  /**
   * Lookup229: pallet_scheduler::pallet::Error<T>
   **/
  PalletSchedulerError: {
    _enum: ["FailedToSchedule", "NotFound", "TargetBlockNumberInPast", "RescheduleNoChange", "Named"],
  },
  /**
   * Lookup230: substrate_validator_set::pallet::Error<T>
   **/
  SubstrateValidatorSetError: {
    _enum: ["TooLowValidatorCount", "Duplicate", "ValidatorNotApproved", "BadOrigin"],
  },
  /**
   * Lookup235: sp_core::crypto::KeyTypeId
   **/
  SpCoreCryptoKeyTypeId: "[u8;4]",
  /**
   * Lookup236: pallet_session::pallet::Error<T>
   **/
  PalletSessionError: {
    _enum: ["InvalidProof", "NoAssociatedValidatorId", "DuplicatedKey", "NoKeys", "NoAccount"],
  },
  /**
   * Lookup240: pallet_grandpa::StoredState<N>
   **/
  PalletGrandpaStoredState: {
    _enum: {
      Live: "Null",
      PendingPause: {
        scheduledAt: "u32",
        delay: "u32",
      },
      Paused: "Null",
      PendingResume: {
        scheduledAt: "u32",
        delay: "u32",
      },
    },
  },
  /**
   * Lookup241: pallet_grandpa::StoredPendingChange<N, Limit>
   **/
  PalletGrandpaStoredPendingChange: {
    scheduledAt: "u32",
    delay: "u32",
    nextAuthorities: "Vec<(SpConsensusGrandpaAppPublic,u64)>",
    forced: "Option<u32>",
  },
  /**
   * Lookup243: pallet_grandpa::pallet::Error<T>
   **/
  PalletGrandpaError: {
    _enum: [
      "PauseFailed",
      "ResumeFailed",
      "ChangePending",
      "TooSoon",
      "InvalidKeyOwnershipProof",
      "InvalidEquivocationProof",
      "DuplicateOffenceReport",
    ],
  },
  /**
   * Lookup245: pallet_balances::types::BalanceLock<Balance>
   **/
  PalletBalancesBalanceLock: {
    id: "[u8;8]",
    amount: "u128",
    reasons: "PalletBalancesReasons",
  },
  /**
   * Lookup246: pallet_balances::types::Reasons
   **/
  PalletBalancesReasons: {
    _enum: ["Fee", "Misc", "All"],
  },
  /**
   * Lookup249: pallet_balances::types::ReserveData<ReserveIdentifier, Balance>
   **/
  PalletBalancesReserveData: {
    id: "[u8;8]",
    amount: "u128",
  },
  /**
   * Lookup252: pallet_balances::types::IdAmount<Id, Balance>
   **/
  PalletBalancesIdAmount: {
    id: "Null",
    amount: "u128",
  },
  /**
   * Lookup254: pallet_balances::pallet::Error<T, I>
   **/
  PalletBalancesError: {
    _enum: [
      "VestingBalance",
      "LiquidityRestrictions",
      "InsufficientBalance",
      "ExistentialDeposit",
      "Expendability",
      "ExistingVestingSchedule",
      "DeadAccount",
      "TooManyReserves",
      "TooManyHolds",
      "TooManyFreezes",
    ],
  },
  /**
   * Lookup256: pallet_transaction_payment::Releases
   **/
  PalletTransactionPaymentReleases: {
    _enum: ["V1Ancient", "V2"],
  },
  /**
   * Lookup258: pallet_tfgrid::terms_cond::TermsAndConditions<T>
   **/
  PalletTfgridTermsCondTermsAndConditions: {
    accountId: "AccountId32",
    timestamp: "u64",
    documentLink: "Bytes",
    documentHash: "Bytes",
  },
  /**
   * Lookup259: tfchain_support::types::NodePower<B>
   **/
  TfchainSupportNodePower: {
    state: "TfchainSupportPowerState",
    target: "TfchainSupportPower",
  },
  /**
   * Lookup260: pallet_tfgrid::pallet::Error<T>
   **/
  PalletTfgridError: {
    _enum: [
      "NoneValue",
      "StorageOverflow",
      "CannotCreateNode",
      "NodeNotExists",
      "NodeWithTwinIdExists",
      "CannotDeleteNode",
      "NodeDeleteNotAuthorized",
      "NodeUpdateNotAuthorized",
      "FarmExists",
      "FarmNotExists",
      "CannotCreateFarmWrongTwin",
      "CannotUpdateFarmWrongTwin",
      "CannotDeleteFarm",
      "CannotDeleteFarmWithPublicIPs",
      "CannotDeleteFarmWithNodesAssigned",
      "CannotDeleteFarmWrongTwin",
      "IpExists",
      "IpNotExists",
      "EntityWithNameExists",
      "EntityWithPubkeyExists",
      "EntityNotExists",
      "EntitySignatureDoesNotMatch",
      "EntityWithSignatureAlreadyExists",
      "CannotUpdateEntity",
      "CannotDeleteEntity",
      "SignatureLengthIsIncorrect",
      "TwinExists",
      "TwinNotExists",
      "TwinWithPubkeyExists",
      "CannotCreateTwin",
      "UnauthorizedToUpdateTwin",
      "TwinCannotBoundToItself",
      "PricingPolicyExists",
      "PricingPolicyNotExists",
      "PricingPolicyWithDifferentIdExists",
      "CertificationCodeExists",
      "FarmingPolicyAlreadyExists",
      "FarmPayoutAdressAlreadyRegistered",
      "FarmerDoesNotHaveEnoughFunds",
      "UserDidNotSignTermsAndConditions",
      "FarmerDidNotSignTermsAndConditions",
      "FarmerNotAuthorized",
      "InvalidFarmName",
      "AlreadyCertifier",
      "NotCertifier",
      "NotAllowedToCertifyNode",
      "FarmingPolicyNotExists",
      "RelayTooShort",
      "RelayTooLong",
      "InvalidRelay",
      "FarmNameTooShort",
      "FarmNameTooLong",
      "InvalidPublicIP",
      "PublicIPTooShort",
      "PublicIPTooLong",
      "GatewayIPTooShort",
      "GatewayIPTooLong",
      "IP4TooShort",
      "IP4TooLong",
      "InvalidIP4",
      "GW4TooShort",
      "GW4TooLong",
      "InvalidGW4",
      "IP6TooShort",
      "IP6TooLong",
      "InvalidIP6",
      "GW6TooShort",
      "GW6TooLong",
      "InvalidGW6",
      "DomainTooShort",
      "DomainTooLong",
      "InvalidDomain",
      "MethodIsDeprecated",
      "InterfaceNameTooShort",
      "InterfaceNameTooLong",
      "InvalidInterfaceName",
      "InterfaceMacTooShort",
      "InterfaceMacTooLong",
      "InvalidMacAddress",
      "InterfaceIpTooShort",
      "InterfaceIpTooLong",
      "InvalidInterfaceIP",
      "InvalidZosVersion",
      "FarmingPolicyExpired",
      "InvalidHRUInput",
      "InvalidSRUInput",
      "InvalidCRUInput",
      "InvalidMRUInput",
      "LatitudeInputTooShort",
      "LatitudeInputTooLong",
      "InvalidLatitudeInput",
      "LongitudeInputTooShort",
      "LongitudeInputTooLong",
      "InvalidLongitudeInput",
      "CountryNameTooShort",
      "CountryNameTooLong",
      "InvalidCountryName",
      "CityNameTooShort",
      "CityNameTooLong",
      "InvalidCityName",
      "InvalidCountryCityPair",
      "SerialNumberTooShort",
      "SerialNumberTooLong",
      "InvalidSerialNumber",
      "DocumentLinkInputTooShort",
      "DocumentLinkInputTooLong",
      "InvalidDocumentLinkInput",
      "DocumentHashInputTooShort",
      "DocumentHashInputTooLong",
      "InvalidDocumentHashInput",
      "InvalidPublicConfig",
      "UnauthorizedToChangePowerTarget",
      "NodeHasActiveContracts",
      "InvalidRelayAddress",
      "InvalidTimestampHint",
      "InvalidStorageInput",
    ],
  },
  /**
   * Lookup261: pallet_smart_contract::types::ContractBillingInformation
   **/
  PalletSmartContractContractBillingInformation: {
    previousNuReported: "u64",
    lastUpdated: "u64",
    amountUnbilled: "u64",
  },
  /**
   * Lookup264: pallet_smart_contract::types::ContractLock<BalanceOf>
   **/
  PalletSmartContractContractLock: {
    amountLocked: "u128",
    extraAmountLocked: "u128",
    lockUpdated: "u64",
    cycles: "u16",
  },
  /**
   * Lookup265: pallet_smart_contract::types::StorageVersion
   **/
  PalletSmartContractStorageVersion: {
    _enum: ["V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12"],
  },
  /**
   * Lookup266: pallet_smart_contract::types::ContractPaymentState<BalanceOf>
   **/
  PalletSmartContractContractPaymentState: {
    standardReserve: "u128",
    additionalReserve: "u128",
    standardOverdraft: "u128",
    additionalOverdraft: "u128",
    lastUpdatedSeconds: "u64",
    cycles: "u16",
  },
  /**
   * Lookup267: pallet_smart_contract::pallet::Error<T>
   **/
  PalletSmartContractError: {
    _enum: [
      "TwinNotExists",
      "NodeNotExists",
      "FarmNotExists",
      "FarmHasNotEnoughPublicIPs",
      "FarmHasNotEnoughPublicIPsFree",
      "FailedToReserveIP",
      "FailedToFreeIPs",
      "ContractNotExists",
      "TwinNotAuthorizedToUpdateContract",
      "TwinNotAuthorizedToCancelContract",
      "NodeNotAuthorizedToDeployContract",
      "NodeNotAuthorizedToComputeReport",
      "PricingPolicyNotExists",
      "ContractIsNotUnique",
      "ContractWrongBillingLoopIndex",
      "NameExists",
      "NameNotValid",
      "InvalidContractType",
      "TFTPriceValueError",
      "NotEnoughResourcesOnNode",
      "NodeNotAuthorizedToReportResources",
      "MethodIsDeprecated",
      "NodeHasActiveContracts",
      "NodeHasRentContract",
      "FarmIsNotDedicated",
      "NodeNotAvailableToDeploy",
      "CannotUpdateContractInGraceState",
      "NumOverflow",
      "OffchainSignedTxCannotSign",
      "OffchainSignedTxAlreadySent",
      "OffchainSignedTxNoLocalAccountAvailable",
      "NameContractNameTooShort",
      "NameContractNameTooLong",
      "InvalidProviderConfiguration",
      "NoSuchSolutionProvider",
      "SolutionProviderNotApproved",
      "TwinNotAuthorized",
      "ServiceContractNotExists",
      "ServiceContractCreationNotAllowed",
      "ServiceContractModificationNotAllowed",
      "ServiceContractApprovalNotAllowed",
      "ServiceContractRejectionNotAllowed",
      "ServiceContractBillingNotApprovedByBoth",
      "ServiceContractBillingVariableAmountTooHigh",
      "ServiceContractBillMetadataTooLong",
      "ServiceContractMetadataTooLong",
      "ServiceContractNotEnoughFundsToPayBill",
      "CanOnlyIncreaseFrequency",
      "IsNotAnAuthority",
      "WrongAuthority",
      "UnauthorizedToChangeSolutionProviderId",
      "UnauthorizedToSetExtraFee",
      "RewardDistributionError",
      "ContractPaymentStateNotExists",
    ],
  },
  /**
   * Lookup268: pallet_tft_bridge::types::StorageVersion
   **/
  PalletTftBridgeStorageVersion: {
    _enum: ["V1", "V2"],
  },
  /**
   * Lookup269: pallet_tft_bridge::pallet::Error<T>
   **/
  PalletTftBridgeError: {
    _enum: [
      "ValidatorExists",
      "ValidatorNotExists",
      "TransactionValidatorExists",
      "TransactionValidatorNotExists",
      "MintTransactionExists",
      "MintTransactionAlreadyExecuted",
      "MintTransactionNotExists",
      "BurnTransactionExists",
      "BurnTransactionNotExists",
      "BurnSignatureExists",
      "EnoughBurnSignaturesPresent",
      "RefundSignatureExists",
      "BurnTransactionAlreadyExecuted",
      "RefundTransactionNotExists",
      "RefundTransactionAlreadyExecuted",
      "EnoughRefundSignaturesPresent",
      "NotEnoughBalanceToSwap",
      "AmountIsLessThanWithdrawFee",
      "AmountIsLessThanDepositFee",
      "WrongParametersProvided",
      "InvalidStellarPublicKey",
    ],
  },
  /**
   * Lookup271: pallet_tft_price::pallet::Error<T>
   **/
  PalletTftPriceError: {
    _enum: [
      "ErrFetchingPrice",
      "OffchainSignedTxError",
      "NoLocalAcctForSigning",
      "AccountUnauthorizedToSetPrice",
      "MaxPriceBelowMinPriceError",
      "MinPriceAboveMaxPriceError",
      "IsNotAnAuthority",
      "WrongAuthority",
    ],
  },
  /**
   * Lookup273: pallet_burning::types::Burn<sp_core::crypto::AccountId32, BalanceOf, BlockNumber>
   **/
  PalletBurningBurn: {
    target: "AccountId32",
    amount: "u128",
    block: "u32",
    message: "Bytes",
  },
  /**
   * Lookup274: pallet_burning::pallet::Error<T>
   **/
  PalletBurningError: {
    _enum: ["NotEnoughBalanceToBurn"],
  },
  /**
   * Lookup276: pallet_kvstore::pallet::Error<T>
   **/
  PalletKvstoreError: {
    _enum: ["NoValueStored", "KeyIsTooLarge", "ValueIsTooLarge"],
  },
  /**
   * Lookup278: pallet_collective::Votes<sp_core::crypto::AccountId32, BlockNumber>
   **/
  PalletCollectiveVotes: {
    index: "u32",
    threshold: "u32",
    ayes: "Vec<AccountId32>",
    nays: "Vec<AccountId32>",
    end: "u32",
  },
  /**
   * Lookup279: pallet_collective::pallet::Error<T, I>
   **/
  PalletCollectiveError: {
    _enum: [
      "NotMember",
      "DuplicateProposal",
      "ProposalMissing",
      "WrongIndex",
      "DuplicateVote",
      "AlreadyInitialized",
      "TooEarly",
      "TooManyProposals",
      "WrongProposalWeight",
      "WrongProposalLength",
      "PrimeAccountNotMember",
    ],
  },
  /**
   * Lookup281: pallet_membership::pallet::Error<T, I>
   **/
  PalletMembershipError: {
    _enum: ["AlreadyMember", "NotMember", "TooManyMembers"],
  },
  /**
   * Lookup282: pallet_dao::proposal::DaoProposal
   **/
  PalletDaoProposalDaoProposal: {
    index: "u32",
    description: "Bytes",
    link: "Bytes",
  },
  /**
   * Lookup283: pallet_dao::proposal::DaoVotes<BlockNumber, sp_core::crypto::AccountId32>
   **/
  PalletDaoProposalDaoVotes: {
    index: "u32",
    threshold: "u32",
    ayes: "Vec<PalletDaoProposalVoteWeight>",
    nays: "Vec<PalletDaoProposalVoteWeight>",
    end: "u32",
    vetos: "Vec<AccountId32>",
  },
  /**
   * Lookup285: pallet_dao::proposal::VoteWeight
   **/
  PalletDaoProposalVoteWeight: {
    farmId: "u32",
    weight: "u64",
  },
  /**
   * Lookup286: pallet_dao::pallet::Error<T>
   **/
  PalletDaoError: {
    _enum: [
      "NoneValue",
      "StorageOverflow",
      "FarmNotExists",
      "NotCouncilMember",
      "WrongProposalLength",
      "DuplicateProposal",
      "NotAuthorizedToVote",
      "ProposalMissing",
      "WrongIndex",
      "DuplicateVote",
      "DuplicateVeto",
      "WrongProposalWeight",
      "TooEarly",
      "TimeLimitReached",
      "OngoingVoteAndTresholdStillNotMet",
      "FarmHasNoNodes",
      "InvalidProposalDuration",
      "ThresholdTooLow",
    ],
  },
  /**
   * Lookup287: pallet_validator::pallet::Error<T>
   **/
  PalletValidatorError: {
    _enum: [
      "BadOrigin",
      "NotCouncilMember",
      "AlreadyBonded",
      "StashNotBonded",
      "StashBondedWithWrongValidator",
      "CannotBondWithSameAccount",
      "DuplicateValidator",
      "ValidatorNotFound",
      "ValidatorNotApproved",
      "UnauthorizedToActivateValidator",
      "ValidatorValidatingAlready",
      "ValidatorNotValidating",
    ],
  },
  /**
   * Lookup289: sp_runtime::MultiSignature
   **/
  SpRuntimeMultiSignature: {
    _enum: {
      Ed25519: "SpCoreEd25519Signature",
      Sr25519: "SpCoreSr25519Signature",
      Ecdsa: "SpCoreEcdsaSignature",
    },
  },
  /**
   * Lookup290: sp_core::sr25519::Signature
   **/
  SpCoreSr25519Signature: "[u8;64]",
  /**
   * Lookup291: sp_core::ecdsa::Signature
   **/
  SpCoreEcdsaSignature: "[u8;65]",
  /**
   * Lookup294: frame_system::extensions::check_non_zero_sender::CheckNonZeroSender<T>
   **/
  FrameSystemExtensionsCheckNonZeroSender: "Null",
  /**
   * Lookup295: frame_system::extensions::check_spec_version::CheckSpecVersion<T>
   **/
  FrameSystemExtensionsCheckSpecVersion: "Null",
  /**
   * Lookup296: frame_system::extensions::check_tx_version::CheckTxVersion<T>
   **/
  FrameSystemExtensionsCheckTxVersion: "Null",
  /**
   * Lookup297: frame_system::extensions::check_genesis::CheckGenesis<T>
   **/
  FrameSystemExtensionsCheckGenesis: "Null",
  /**
   * Lookup300: frame_system::extensions::check_nonce::CheckNonce<T>
   **/
  FrameSystemExtensionsCheckNonce: "Compact<u32>",
  /**
   * Lookup301: frame_system::extensions::check_weight::CheckWeight<T>
   **/
  FrameSystemExtensionsCheckWeight: "Null",
  /**
   * Lookup302: pallet_transaction_payment::ChargeTransactionPayment<T>
   **/
  PalletTransactionPaymentChargeTransactionPayment: "Compact<u128>",
  /**
   * Lookup303: pallet_smart_contract::types::ContractIdProvides<tfchain_runtime::Runtime>
   **/
  PalletSmartContractContractIdProvides: "Null",
  /**
   * Lookup304: tfchain_runtime::Runtime
   **/
  TfchainRuntimeRuntime: "Null",
};
