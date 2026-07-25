import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type CandidatePrivateState = {
  memberSecretKey: Uint8Array;
  loyaltyProofNonce: Uint8Array;
  membershipRecordHash: Uint8Array;
};

export type Ledger = {
  memberCount: bigint;
  programId: Uint8Array;
  lastRewardCommitment: Uint8Array;
  activeSession: bigint;
};

export type Witnesses<PS> = {
  memberSecretKey: __compactRuntime.Witness<PS, [PS, Uint8Array]>;
  loyaltyProofNonce: __compactRuntime.Witness<PS, [PS, Uint8Array]>;
  membershipRecordHash: __compactRuntime.Witness<PS, [PS, Uint8Array]>;
};

export type Circuits<PS> = {
  claimReward: (context: __compactRuntime.CircuitContext<PS>, expectedProgramId: Uint8Array) => __compactRuntime.CircuitResults<PS, Uint8Array>;
  resetProgram: (context: __compactRuntime.CircuitContext<PS>, newProgramId: Uint8Array) => __compactRuntime.CircuitResults<PS, Uint8Array>;
  incrementSession: (context: __compactRuntime.CircuitContext<PS>) => __compactRuntime.CircuitResults<PS, void>;
};

export declare class Contract<PS> implements __compactRuntime.Contract<PS, Ledger> {
  constructor(witnesses: Witnesses<PS>);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResults<PS, Ledger>;
  circuits: Circuits<PS>;
}

export declare const ledger: __compactRuntime.ContractQuery<Ledger>;
