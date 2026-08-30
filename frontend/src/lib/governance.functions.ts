import { fetchAPI } from "./db";

export const getGovernanceRequests = async (opts?: { signal?: AbortSignal }) => {
  const res = await fetchAPI<any>("/governance", { signal: opts?.signal });
  return res.requests || [];
};

export const proposeGovernanceAction = async (payload: { action_type: string, target_id?: string, payload?: any }) => {
  const res = await fetchAPI<any>("/governance/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res;
};

export const voteGovernanceAction = async (requestId: string, vote: "APPROVE" | "REJECT") => {
  const res = await fetchAPI<any>(`/governance/${requestId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vote })
  });
  return res;
};
