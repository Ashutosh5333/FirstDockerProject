export type IssuedRecord = {
  id: string;
  issued_at: string;
  worker_id: string;
  credential: unknown;
};

export type VerificationLog = {
  id: string;
  verified_at: string;
  verifier_worker_id: string;
  result: "valid" | "invalid";
};
