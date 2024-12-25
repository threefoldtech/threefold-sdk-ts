// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import "@polkadot/api-base/types/errors";

import type { ApiTypes, AugmentedError } from "@polkadot/api-base/types";

export type __AugmentedError<ApiType extends ApiTypes> = AugmentedError<ApiType>;

declare module "@polkadot/api-base/types/errors" {
  interface AugmentedErrors<ApiType extends ApiTypes> {
    balances: {
      /**
       * Beneficiary account must pre-exist.
       **/
      DeadAccount: AugmentedError<ApiType>;
      /**
       * Value too low to create account due to existential deposit.
       **/
      ExistentialDeposit: AugmentedError<ApiType>;
      /**
       * A vesting schedule already exists for this account.
       **/
      ExistingVestingSchedule: AugmentedError<ApiType>;
      /**
       * Transfer/payment would kill account.
       **/
      Expendability: AugmentedError<ApiType>;
      /**
       * Balance too low to send value.
       **/
      InsufficientBalance: AugmentedError<ApiType>;
      /**
       * Account liquidity restrictions prevent withdrawal.
       **/
      LiquidityRestrictions: AugmentedError<ApiType>;
      /**
       * Number of freezes exceed `MaxFreezes`.
       **/
      TooManyFreezes: AugmentedError<ApiType>;
      /**
       * Number of holds exceed `MaxHolds`.
       **/
      TooManyHolds: AugmentedError<ApiType>;
      /**
       * Number of named reserves exceed `MaxReserves`.
       **/
      TooManyReserves: AugmentedError<ApiType>;
      /**
       * Vesting balance too high to send value.
       **/
      VestingBalance: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    burningModule: {
      NotEnoughBalanceToBurn: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    council: {
      /**
       * Members are already initialized!
       **/
      AlreadyInitialized: AugmentedError<ApiType>;
      /**
       * Duplicate proposals not allowed
       **/
      DuplicateProposal: AugmentedError<ApiType>;
      /**
       * Duplicate vote ignored
       **/
      DuplicateVote: AugmentedError<ApiType>;
      /**
       * Account is not a member
       **/
      NotMember: AugmentedError<ApiType>;
      /**
       * Prime account is not a member
       **/
      PrimeAccountNotMember: AugmentedError<ApiType>;
      /**
       * Proposal must exist
       **/
      ProposalMissing: AugmentedError<ApiType>;
      /**
       * The close call was made too early, before the end of the voting.
       **/
      TooEarly: AugmentedError<ApiType>;
      /**
       * There can only be a maximum of `MaxProposals` active proposals.
       **/
      TooManyProposals: AugmentedError<ApiType>;
      /**
       * Mismatched index
       **/
      WrongIndex: AugmentedError<ApiType>;
      /**
       * The given length bound for the proposal was too low.
       **/
      WrongProposalLength: AugmentedError<ApiType>;
      /**
       * The given weight bound for the proposal was too low.
       **/
      WrongProposalWeight: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    councilMembership: {
      /**
       * Already a member.
       **/
      AlreadyMember: AugmentedError<ApiType>;
      /**
       * Not a member.
       **/
      NotMember: AugmentedError<ApiType>;
      /**
       * Too many members.
       **/
      TooManyMembers: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    dao: {
      DuplicateProposal: AugmentedError<ApiType>;
      DuplicateVeto: AugmentedError<ApiType>;
      DuplicateVote: AugmentedError<ApiType>;
      FarmHasNoNodes: AugmentedError<ApiType>;
      FarmNotExists: AugmentedError<ApiType>;
      InvalidProposalDuration: AugmentedError<ApiType>;
      NoneValue: AugmentedError<ApiType>;
      NotAuthorizedToVote: AugmentedError<ApiType>;
      NotCouncilMember: AugmentedError<ApiType>;
      OngoingVoteAndTresholdStillNotMet: AugmentedError<ApiType>;
      ProposalMissing: AugmentedError<ApiType>;
      StorageOverflow: AugmentedError<ApiType>;
      ThresholdTooLow: AugmentedError<ApiType>;
      TimeLimitReached: AugmentedError<ApiType>;
      TooEarly: AugmentedError<ApiType>;
      WrongIndex: AugmentedError<ApiType>;
      WrongProposalLength: AugmentedError<ApiType>;
      WrongProposalWeight: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    grandpa: {
      /**
       * Attempt to signal GRANDPA change with one already pending.
       **/
      ChangePending: AugmentedError<ApiType>;
      /**
       * A given equivocation report is valid but already previously reported.
       **/
      DuplicateOffenceReport: AugmentedError<ApiType>;
      /**
       * An equivocation proof provided as part of an equivocation report is invalid.
       **/
      InvalidEquivocationProof: AugmentedError<ApiType>;
      /**
       * A key ownership proof provided as part of an equivocation report is invalid.
       **/
      InvalidKeyOwnershipProof: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA pause when the authority set isn't live
       * (either paused or already pending pause).
       **/
      PauseFailed: AugmentedError<ApiType>;
      /**
       * Attempt to signal GRANDPA resume when the authority set isn't paused
       * (either live or already pending resume).
       **/
      ResumeFailed: AugmentedError<ApiType>;
      /**
       * Cannot signal forced change so soon after last.
       **/
      TooSoon: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    scheduler: {
      /**
       * Failed to schedule a call
       **/
      FailedToSchedule: AugmentedError<ApiType>;
      /**
       * Attempt to use a non-named function on a named task.
       **/
      Named: AugmentedError<ApiType>;
      /**
       * Cannot find the scheduled call.
       **/
      NotFound: AugmentedError<ApiType>;
      /**
       * Reschedule failed because it does not change scheduled time.
       **/
      RescheduleNoChange: AugmentedError<ApiType>;
      /**
       * Given target block number is in the past.
       **/
      TargetBlockNumberInPast: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    session: {
      /**
       * Registered duplicate key.
       **/
      DuplicatedKey: AugmentedError<ApiType>;
      /**
       * Invalid ownership proof.
       **/
      InvalidProof: AugmentedError<ApiType>;
      /**
       * Key setting account is not live, so it's impossible to associate keys.
       **/
      NoAccount: AugmentedError<ApiType>;
      /**
       * No associated validator ID for account.
       **/
      NoAssociatedValidatorId: AugmentedError<ApiType>;
      /**
       * No keys are associated with this account.
       **/
      NoKeys: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    smartContractModule: {
      CannotUpdateContractInGraceState: AugmentedError<ApiType>;
      CanOnlyIncreaseFrequency: AugmentedError<ApiType>;
      ContractIsNotUnique: AugmentedError<ApiType>;
      ContractNotExists: AugmentedError<ApiType>;
      ContractPaymentStateNotExists: AugmentedError<ApiType>;
      ContractWrongBillingLoopIndex: AugmentedError<ApiType>;
      FailedToFreeIPs: AugmentedError<ApiType>;
      FailedToReserveIP: AugmentedError<ApiType>;
      FarmHasNotEnoughPublicIPs: AugmentedError<ApiType>;
      FarmHasNotEnoughPublicIPsFree: AugmentedError<ApiType>;
      FarmIsNotDedicated: AugmentedError<ApiType>;
      FarmNotExists: AugmentedError<ApiType>;
      InvalidContractType: AugmentedError<ApiType>;
      InvalidProviderConfiguration: AugmentedError<ApiType>;
      IsNotAnAuthority: AugmentedError<ApiType>;
      MethodIsDeprecated: AugmentedError<ApiType>;
      NameContractNameTooLong: AugmentedError<ApiType>;
      NameContractNameTooShort: AugmentedError<ApiType>;
      NameExists: AugmentedError<ApiType>;
      NameNotValid: AugmentedError<ApiType>;
      NodeHasActiveContracts: AugmentedError<ApiType>;
      NodeHasRentContract: AugmentedError<ApiType>;
      NodeNotAuthorizedToComputeReport: AugmentedError<ApiType>;
      NodeNotAuthorizedToDeployContract: AugmentedError<ApiType>;
      NodeNotAuthorizedToReportResources: AugmentedError<ApiType>;
      NodeNotAvailableToDeploy: AugmentedError<ApiType>;
      NodeNotExists: AugmentedError<ApiType>;
      NoSuchSolutionProvider: AugmentedError<ApiType>;
      NotEnoughResourcesOnNode: AugmentedError<ApiType>;
      NumOverflow: AugmentedError<ApiType>;
      OffchainSignedTxAlreadySent: AugmentedError<ApiType>;
      OffchainSignedTxCannotSign: AugmentedError<ApiType>;
      OffchainSignedTxNoLocalAccountAvailable: AugmentedError<ApiType>;
      PricingPolicyNotExists: AugmentedError<ApiType>;
      RewardDistributionError: AugmentedError<ApiType>;
      ServiceContractApprovalNotAllowed: AugmentedError<ApiType>;
      ServiceContractBillingNotApprovedByBoth: AugmentedError<ApiType>;
      ServiceContractBillingVariableAmountTooHigh: AugmentedError<ApiType>;
      ServiceContractBillMetadataTooLong: AugmentedError<ApiType>;
      ServiceContractCreationNotAllowed: AugmentedError<ApiType>;
      ServiceContractMetadataTooLong: AugmentedError<ApiType>;
      ServiceContractModificationNotAllowed: AugmentedError<ApiType>;
      ServiceContractNotEnoughFundsToPayBill: AugmentedError<ApiType>;
      ServiceContractNotExists: AugmentedError<ApiType>;
      ServiceContractRejectionNotAllowed: AugmentedError<ApiType>;
      SolutionProviderNotApproved: AugmentedError<ApiType>;
      TFTPriceValueError: AugmentedError<ApiType>;
      TwinNotAuthorized: AugmentedError<ApiType>;
      TwinNotAuthorizedToCancelContract: AugmentedError<ApiType>;
      TwinNotAuthorizedToUpdateContract: AugmentedError<ApiType>;
      TwinNotExists: AugmentedError<ApiType>;
      UnauthorizedToChangeSolutionProviderId: AugmentedError<ApiType>;
      UnauthorizedToSetExtraFee: AugmentedError<ApiType>;
      WrongAuthority: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    system: {
      /**
       * The origin filter prevent the call to be dispatched.
       **/
      CallFiltered: AugmentedError<ApiType>;
      /**
       * Failed to extract the runtime version from the new runtime.
       *
       * Either calling `Core_version` or decoding `RuntimeVersion` failed.
       **/
      FailedToExtractRuntimeVersion: AugmentedError<ApiType>;
      /**
       * The name of specification does not match between the current runtime
       * and the new runtime.
       **/
      InvalidSpecName: AugmentedError<ApiType>;
      /**
       * Suicide called when the account has non-default composite data.
       **/
      NonDefaultComposite: AugmentedError<ApiType>;
      /**
       * There is a non-zero reference count preventing the account from being purged.
       **/
      NonZeroRefCount: AugmentedError<ApiType>;
      /**
       * The specification version is not allowed to decrease between the current runtime
       * and the new runtime.
       **/
      SpecVersionNeedsToIncrease: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    tfgridModule: {
      AlreadyCertifier: AugmentedError<ApiType>;
      CannotCreateFarmWrongTwin: AugmentedError<ApiType>;
      CannotCreateNode: AugmentedError<ApiType>;
      CannotCreateTwin: AugmentedError<ApiType>;
      CannotDeleteEntity: AugmentedError<ApiType>;
      CannotDeleteFarm: AugmentedError<ApiType>;
      CannotDeleteFarmWithNodesAssigned: AugmentedError<ApiType>;
      CannotDeleteFarmWithPublicIPs: AugmentedError<ApiType>;
      CannotDeleteFarmWrongTwin: AugmentedError<ApiType>;
      CannotDeleteNode: AugmentedError<ApiType>;
      CannotUpdateEntity: AugmentedError<ApiType>;
      CannotUpdateFarmWrongTwin: AugmentedError<ApiType>;
      CertificationCodeExists: AugmentedError<ApiType>;
      CityNameTooLong: AugmentedError<ApiType>;
      CityNameTooShort: AugmentedError<ApiType>;
      CountryNameTooLong: AugmentedError<ApiType>;
      CountryNameTooShort: AugmentedError<ApiType>;
      DocumentHashInputTooLong: AugmentedError<ApiType>;
      DocumentHashInputTooShort: AugmentedError<ApiType>;
      DocumentLinkInputTooLong: AugmentedError<ApiType>;
      DocumentLinkInputTooShort: AugmentedError<ApiType>;
      DomainTooLong: AugmentedError<ApiType>;
      DomainTooShort: AugmentedError<ApiType>;
      EntityNotExists: AugmentedError<ApiType>;
      EntitySignatureDoesNotMatch: AugmentedError<ApiType>;
      EntityWithNameExists: AugmentedError<ApiType>;
      EntityWithPubkeyExists: AugmentedError<ApiType>;
      EntityWithSignatureAlreadyExists: AugmentedError<ApiType>;
      FarmerDidNotSignTermsAndConditions: AugmentedError<ApiType>;
      FarmerDoesNotHaveEnoughFunds: AugmentedError<ApiType>;
      FarmerNotAuthorized: AugmentedError<ApiType>;
      FarmExists: AugmentedError<ApiType>;
      FarmingPolicyAlreadyExists: AugmentedError<ApiType>;
      FarmingPolicyExpired: AugmentedError<ApiType>;
      FarmingPolicyNotExists: AugmentedError<ApiType>;
      FarmNameTooLong: AugmentedError<ApiType>;
      FarmNameTooShort: AugmentedError<ApiType>;
      FarmNotExists: AugmentedError<ApiType>;
      FarmPayoutAdressAlreadyRegistered: AugmentedError<ApiType>;
      GatewayIPTooLong: AugmentedError<ApiType>;
      GatewayIPTooShort: AugmentedError<ApiType>;
      GW4TooLong: AugmentedError<ApiType>;
      GW4TooShort: AugmentedError<ApiType>;
      GW6TooLong: AugmentedError<ApiType>;
      GW6TooShort: AugmentedError<ApiType>;
      InterfaceIpTooLong: AugmentedError<ApiType>;
      InterfaceIpTooShort: AugmentedError<ApiType>;
      InterfaceMacTooLong: AugmentedError<ApiType>;
      InterfaceMacTooShort: AugmentedError<ApiType>;
      InterfaceNameTooLong: AugmentedError<ApiType>;
      InterfaceNameTooShort: AugmentedError<ApiType>;
      InvalidCityName: AugmentedError<ApiType>;
      InvalidCountryCityPair: AugmentedError<ApiType>;
      InvalidCountryName: AugmentedError<ApiType>;
      InvalidCRUInput: AugmentedError<ApiType>;
      InvalidDocumentHashInput: AugmentedError<ApiType>;
      InvalidDocumentLinkInput: AugmentedError<ApiType>;
      InvalidDomain: AugmentedError<ApiType>;
      InvalidFarmName: AugmentedError<ApiType>;
      InvalidGW4: AugmentedError<ApiType>;
      InvalidGW6: AugmentedError<ApiType>;
      InvalidHRUInput: AugmentedError<ApiType>;
      InvalidInterfaceIP: AugmentedError<ApiType>;
      InvalidInterfaceName: AugmentedError<ApiType>;
      InvalidIP4: AugmentedError<ApiType>;
      InvalidIP6: AugmentedError<ApiType>;
      InvalidLatitudeInput: AugmentedError<ApiType>;
      InvalidLongitudeInput: AugmentedError<ApiType>;
      InvalidMacAddress: AugmentedError<ApiType>;
      InvalidMRUInput: AugmentedError<ApiType>;
      InvalidPublicConfig: AugmentedError<ApiType>;
      InvalidPublicIP: AugmentedError<ApiType>;
      InvalidRelay: AugmentedError<ApiType>;
      InvalidRelayAddress: AugmentedError<ApiType>;
      InvalidSerialNumber: AugmentedError<ApiType>;
      InvalidSRUInput: AugmentedError<ApiType>;
      InvalidStorageInput: AugmentedError<ApiType>;
      InvalidTimestampHint: AugmentedError<ApiType>;
      InvalidZosVersion: AugmentedError<ApiType>;
      IP4TooLong: AugmentedError<ApiType>;
      IP4TooShort: AugmentedError<ApiType>;
      IP6TooLong: AugmentedError<ApiType>;
      IP6TooShort: AugmentedError<ApiType>;
      IpExists: AugmentedError<ApiType>;
      IpNotExists: AugmentedError<ApiType>;
      LatitudeInputTooLong: AugmentedError<ApiType>;
      LatitudeInputTooShort: AugmentedError<ApiType>;
      LongitudeInputTooLong: AugmentedError<ApiType>;
      LongitudeInputTooShort: AugmentedError<ApiType>;
      MethodIsDeprecated: AugmentedError<ApiType>;
      NodeDeleteNotAuthorized: AugmentedError<ApiType>;
      NodeHasActiveContracts: AugmentedError<ApiType>;
      NodeNotExists: AugmentedError<ApiType>;
      NodeUpdateNotAuthorized: AugmentedError<ApiType>;
      NodeWithTwinIdExists: AugmentedError<ApiType>;
      NoneValue: AugmentedError<ApiType>;
      NotAllowedToCertifyNode: AugmentedError<ApiType>;
      NotCertifier: AugmentedError<ApiType>;
      PricingPolicyExists: AugmentedError<ApiType>;
      PricingPolicyNotExists: AugmentedError<ApiType>;
      PricingPolicyWithDifferentIdExists: AugmentedError<ApiType>;
      PublicIPTooLong: AugmentedError<ApiType>;
      PublicIPTooShort: AugmentedError<ApiType>;
      RelayTooLong: AugmentedError<ApiType>;
      RelayTooShort: AugmentedError<ApiType>;
      SerialNumberTooLong: AugmentedError<ApiType>;
      SerialNumberTooShort: AugmentedError<ApiType>;
      SignatureLengthIsIncorrect: AugmentedError<ApiType>;
      StorageOverflow: AugmentedError<ApiType>;
      TwinCannotBoundToItself: AugmentedError<ApiType>;
      TwinExists: AugmentedError<ApiType>;
      TwinNotExists: AugmentedError<ApiType>;
      TwinWithPubkeyExists: AugmentedError<ApiType>;
      UnauthorizedToChangePowerTarget: AugmentedError<ApiType>;
      UnauthorizedToUpdateTwin: AugmentedError<ApiType>;
      UserDidNotSignTermsAndConditions: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    tfkvStore: {
      KeyIsTooLarge: AugmentedError<ApiType>;
      /**
       * The requested user has not stored a value yet
       **/
      NoValueStored: AugmentedError<ApiType>;
      ValueIsTooLarge: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    tftBridgeModule: {
      AmountIsLessThanDepositFee: AugmentedError<ApiType>;
      AmountIsLessThanWithdrawFee: AugmentedError<ApiType>;
      BurnSignatureExists: AugmentedError<ApiType>;
      BurnTransactionAlreadyExecuted: AugmentedError<ApiType>;
      BurnTransactionExists: AugmentedError<ApiType>;
      BurnTransactionNotExists: AugmentedError<ApiType>;
      EnoughBurnSignaturesPresent: AugmentedError<ApiType>;
      EnoughRefundSignaturesPresent: AugmentedError<ApiType>;
      InvalidStellarPublicKey: AugmentedError<ApiType>;
      MintTransactionAlreadyExecuted: AugmentedError<ApiType>;
      MintTransactionExists: AugmentedError<ApiType>;
      MintTransactionNotExists: AugmentedError<ApiType>;
      NotEnoughBalanceToSwap: AugmentedError<ApiType>;
      RefundSignatureExists: AugmentedError<ApiType>;
      RefundTransactionAlreadyExecuted: AugmentedError<ApiType>;
      RefundTransactionNotExists: AugmentedError<ApiType>;
      TransactionValidatorExists: AugmentedError<ApiType>;
      TransactionValidatorNotExists: AugmentedError<ApiType>;
      ValidatorExists: AugmentedError<ApiType>;
      ValidatorNotExists: AugmentedError<ApiType>;
      WrongParametersProvided: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    tftPriceModule: {
      AccountUnauthorizedToSetPrice: AugmentedError<ApiType>;
      ErrFetchingPrice: AugmentedError<ApiType>;
      IsNotAnAuthority: AugmentedError<ApiType>;
      MaxPriceBelowMinPriceError: AugmentedError<ApiType>;
      MinPriceAboveMaxPriceError: AugmentedError<ApiType>;
      NoLocalAcctForSigning: AugmentedError<ApiType>;
      OffchainSignedTxError: AugmentedError<ApiType>;
      WrongAuthority: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    utility: {
      /**
       * Too many calls batched.
       **/
      TooManyCalls: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    validator: {
      AlreadyBonded: AugmentedError<ApiType>;
      BadOrigin: AugmentedError<ApiType>;
      CannotBondWithSameAccount: AugmentedError<ApiType>;
      DuplicateValidator: AugmentedError<ApiType>;
      NotCouncilMember: AugmentedError<ApiType>;
      StashBondedWithWrongValidator: AugmentedError<ApiType>;
      StashNotBonded: AugmentedError<ApiType>;
      UnauthorizedToActivateValidator: AugmentedError<ApiType>;
      ValidatorNotApproved: AugmentedError<ApiType>;
      ValidatorNotFound: AugmentedError<ApiType>;
      ValidatorNotValidating: AugmentedError<ApiType>;
      ValidatorValidatingAlready: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
    validatorSet: {
      /**
       * Only the validator can add itself back after coming online.
       **/
      BadOrigin: AugmentedError<ApiType>;
      /**
       * Validator is already in the validator set.
       **/
      Duplicate: AugmentedError<ApiType>;
      /**
       * Target (post-removal) validator count is below the minimum.
       **/
      TooLowValidatorCount: AugmentedError<ApiType>;
      /**
       * Validator is not approved for re-addition.
       **/
      ValidatorNotApproved: AugmentedError<ApiType>;
      /**
       * Generic error
       **/
      [key: string]: AugmentedError<ApiType>;
    };
  } // AugmentedErrors
} // declare module
