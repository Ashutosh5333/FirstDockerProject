export type IssuedRecord = {
    id: string;
    issued_at: string;
    worker_id: string;
    credential: unknown;
  };
  


export interface Credential {
  name: string;
  password: string; // or any unique field(s)
  [key: string]: any; // other optional fields
}

export interface IssueResponse {
  message: string;
  id: string;
  issued_at: string;
  worker_id: string;
}