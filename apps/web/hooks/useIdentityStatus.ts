"use client";

import { useState, useEffect, useCallback } from "react";
import type { IdentityDraft } from "@conneczen/types";

interface IdentityStatusResponse {
  hasConfirmedIdentity: boolean;
  hasDraft: boolean;
  draft: IdentityDraft | null;
}

interface UseIdentityStatusReturn {
  /** Whether the user has a confirmed (active) identity */
  hasConfirmedIdentity: boolean;
  /** Whether the user has a draft identity in progress */
  hasDraft: boolean;
  /** The draft identity data if available */
  draft: IdentityDraft | null;
  /** Whether the status is currently being loaded */
  isLoading: boolean;
  /** Any error that occurred while fetching */
  error: string | null;
  /** Manually refresh the identity status */
  refresh: () => Promise<void>;
}

/**
 * Hook to check the current user's identity status
 * Used for UI gating of features that require confirmed identity
 *
 * @example
 * ```tsx
 * function VisionCreator() {
 *   const { hasConfirmedIdentity, isLoading } = useIdentityStatus();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   if (!hasConfirmedIdentity) {
 *     return <IdentityRequiredMessage />;
 *   }
 *
 *   return <VisionForm />;
 * }
 * ```
 */
export function useIdentityStatus(): UseIdentityStatusReturn {
  const [hasConfirmedIdentity, setHasConfirmedIdentity] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draft, setDraft] = useState<IdentityDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/identity/status");

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - reset to defaults
          setHasConfirmedIdentity(false);
          setHasDraft(false);
          setDraft(null);
          return;
        }
        throw new Error("Failed to fetch identity status");
      }

      const data: IdentityStatusResponse = await response.json();

      setHasConfirmedIdentity(data.hasConfirmedIdentity);
      setHasDraft(data.hasDraft);
      setDraft(data.draft);
    } catch (err) {
      console.error("Error fetching identity status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    hasConfirmedIdentity,
    hasDraft,
    draft,
    isLoading,
    error,
    refresh: fetchStatus,
  };
}
