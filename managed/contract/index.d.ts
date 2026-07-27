import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  memberSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  loyaltyProofNonce(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  membershipRecordHash(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  claimReward(context: __compactRuntime.CircuitContext<PS>,
              expectedProgramId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProgram(context: __compactRuntime.CircuitContext<PS>,
               newProgramId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  claimReward(context: __compactRuntime.CircuitContext<PS>,
              expectedProgramId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProgram(context: __compactRuntime.CircuitContext<PS>,
               newProgramId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  claimReward(context: __compactRuntime.CircuitContext<PS>,
              expectedProgramId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProgram(context: __compactRuntime.CircuitContext<PS>,
               newProgramId_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly memberCount: bigint;
  readonly programId: Uint8Array;
  readonly lastRewardCommitment: Uint8Array;
  readonly activeSession: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
