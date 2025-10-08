export type VerificationLog = {
    id: string;
    verified_at: string;
    verifier_worker_id: string;
    result: "valid" | "invalid";
  };
  