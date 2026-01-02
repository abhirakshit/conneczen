/**
 * Domains the coaching system operates in.
 * Keep this SMALL and intentional.
 */
export type CoachingDomain =
    | "health"
    | "addiction"
    | "career"
    | "relationships"
    | "mental_health";

/**
 * Lifecycle states for records that require locking.
 */
export type RecordStatus =
    | "draft"
    | "confirmed"
    | "archived";


export interface IdentityProfile {
    id: string;
    user_id: string;
    domain: CoachingDomain;
    status: RecordStatus;
    identity_statement: string | null;
    created_at: string;
    updated_at: string;
}