# Superadmin Governance & Security Proposal

## 1. Objective
To mitigate the risk of a single compromised `SUPERADMIN` account causing catastrophic damage to the system (e.g., deleting other superadmins, maliciously suspending the restaurant, or altering payout accounts). 

## 2. Core Concept: Multi-Signature (Consensus) Model
Drawing inspiration from multi-sig crypto wallets, destructive or highly sensitive actions requested by a Superadmin will not execute immediately. Instead, they will enter a "Pending" state and require explicit approval from at least one (or more) other independent Superadmin accounts before taking effect.

## 3. Scope of Restricted Actions
The consensus model will apply strictly to the following actions:
1. **Promoting a user** to `SUPERADMIN` status.
2. **Demoting or deleting** an existing `SUPERADMIN`.
3. **Triggering Global Suspension** (shutting down the restaurant's ordering capability).
4. **Modifying critical API Keys** (e.g., Payment Gateway, WhatsApp API credentials).

*Note: Standard `ADMIN` and `USER` management, as well as menu and order management, remain unaffected and execute instantly.*

## 4. Proposed Database Schema Changes

We will introduce an `AdminActionRequest` table to track pending sensitive operations.

```prisma
model AdminActionRequest {
  id              String   @id @default(cuid())
  requester_id    String   // The Superadmin who initiated the action
  action_type     String   // e.g., "DELETE_SUPERADMIN", "SUSPEND_APP"
  target_id       String?  // e.g., The ID of the Superadmin to be deleted
  payload         Json?    // Any new data (e.g., new API keys)
  status          String   @default("PENDING") // PENDING, APPROVED, REJECTED, EXECUTED
  approvals       Int      @default(0)
  required_approvals Int   @default(1) // Number of additional approvals needed
  created_at      DateTime @default(now())
  expires_at      DateTime // e.g., 48 hours from creation

  // Relations
  requester       User     @relation(fields: [requester_id], references: [id])
  votes           AdminActionVote[]
}

model AdminActionVote {
  id              String   @id @default(cuid())
  request_id      String
  voter_id        String   // The Superadmin who voted
  vote            String   // "APPROVE" or "REJECT"
  created_at      DateTime @default(now())

  request         AdminActionRequest @relation(fields: [request_id], references: [id], onDelete: Cascade)
}
```

## 5. Workflow Implementation

### Step 1: Initiation
- Superadmin A attempts to delete Superadmin B.
- The backend intercepts the request. Instead of executing it, it creates an `AdminActionRequest` with `action_type = "DELETE_SUPERADMIN"`.
- A notification (WhatsApp / App Notification) is sent to all other Superadmins: *"Superadmin A has requested to delete Superadmin B. Review required."*

### Step 2: Approval
- Superadmin C logs into the admin dashboard and navigates to a new **"Governance"** tab.
- Superadmin C reviews the request and clicks "Approve".
- An `AdminActionVote` is recorded. 

### Step 3: Execution
- Once `approvals >= required_approvals`, a background job (or the vote-submission controller) automatically executes the payload (e.g., deletes Superadmin B).
- The `AdminActionRequest` status changes to `EXECUTED`.

## 6. Time-Lock Fallback (Optional)
If there is only ONE active Superadmin in the system (or others are locked out), multi-sig is impossible. 
In this scenario, we enforce a **Time-Lock**:
- The action is approved automatically but is placed in a `TIME_LOCKED` status.
- It will execute automatically after 48 hours.
- During these 48 hours, notifications are constantly blasted to all admin contact channels, allowing intervention if the action was malicious.

## 7. Next Steps for Implementation
1. Add the Prisma models.
2. Build the `POST /admin/governance/request` and `POST /admin/governance/vote` Fastify routes.
3. Build the UI in React (`admin.governance.tsx`) for the Superadmin dashboard.
