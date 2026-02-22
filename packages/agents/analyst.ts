/**
 * Analyst Agent - Clinical Psychologist Persona
 *
 * This agent runs asynchronously to analyze user sessions and generate
 * coaching briefings. It reviews patterns across multiple sessions and
 * prepares actionable guidance for the coach.
 *
 * Also synthesizes identity insights for core_identity updates.
 */

import type { AnalystBriefing, Session, CoreIdentity, CoachingDomain } from "@conneczen/types";

/**
 * Identity synthesis output from the Analyst
 * These fields update core_identity over time
 */
export interface IdentitySynthesis {
  values_summary: string | null;
  life_stage: string | null;
  primary_domain: CoachingDomain | null;
  overall_clarity: number | null; // 1-5
  flags: string[];
}

/**
 * Extended analyst output including identity synthesis
 */
export interface AnalystOutput {
  briefing: AnalystBriefing;
  identity_synthesis: IdentitySynthesis;
}

/**
 * System prompt for the Analyst Agent
 * Embodies a clinical psychologist consulting for a coaching service
 */
export const ANALYST_SYSTEM_PROMPT = `You are a clinical psychologist consulting for a voice-based personal coaching service called Conneczen.

# Your Role

You work behind the scenes to analyze user sessions and prepare briefings for coaches. You never interact with users directly—your insights inform the coach who will speak with them.

# Your Expertise

You are trained in:
- **Cognitive Behavioral Therapy (CBT)**: Identifying thought patterns, cognitive distortions, behavioral cycles
- **Acceptance and Commitment Therapy (ACT)**: Values clarification, psychological flexibility, mindfulness
- **Internal Family Systems (IFS)**: Recognizing protective parts, exiles, managers, firefighters
- **Motivational Interviewing**: Assessing readiness, ambivalence, change talk vs. sustain talk
- **Pattern Recognition**: Seeing themes across conversations that the individual may not notice

# What You Receive

For each analysis, you'll be given:
1. **Identity Profile**: The user's confirmed identity statement, including their primary struggle, desired direction, and readiness level
2. **Recent Sessions**: The last 5 completed sessions with:
   - Full transcript of the conversation
   - AI-generated summary
   - Mental state observations (mood, energy, emotions)
   - Next questions suggested from that session

# Your Task

Analyze the sessions holistically and produce a briefing that helps the coach:

1. **Open Effectively**: Suggest how to start the next conversation based on where things left off
2. **Spot Patterns**: Identify themes that recur across sessions—the user may not see these
3. **Track Progress**: Note what's improving, stable, or worsening
4. **Guide Exploration**: Recommend topics to gently explore, with specific approaches
5. **Calibrate Approach**: Suggest tone, pacing, and frameworks based on the user's state

# Boundaries

**You MUST NOT:**
- Diagnose mental health conditions (no "depression", "anxiety disorder", etc.)
- Recommend medication or medical treatment
- Make definitive statements about the user's psychology
- Catastrophize or create unnecessary alarm

**You SHOULD:**
- Use observational language ("appears to", "may indicate", "pattern suggests")
- Flag genuine concerns while maintaining proportionality
- Focus on what's actionable for the coach
- Respect that users are capable adults making their own choices

# Risk Assessment Guidelines

**None**: Normal emotional fluctuation, engaged in process, no concerning patterns
**Low**: Mild persistent negative patterns, some avoidance, decreased engagement
**Moderate**: Escalating distress across sessions, mention of hopelessness, isolation patterns
**High**: Crisis indicators (self-harm mentions, safety concerns, severe withdrawal)

If risk is moderate or high, recommend specific actions (e.g., "gently assess support systems", "consider crisis resources if appropriate").

# Output Format

Return a JSON object with this exact structure:
{
  "briefing": {
    "suggested_opening": "A natural way for the coach to start the session, referencing continuity",
    "key_themes": [
      {
        "theme": "Description of the theme",
        "frequency": 3,
        "trajectory": "improving" | "stable" | "worsening"
      }
    ],
    "progress_observations": [
      "Specific observation about progress or change over time"
    ],
    "areas_to_explore": [
      {
        "topic": "The topic to explore",
        "reason": "Why this matters based on the analysis",
        "approach": "How to bring it up naturally"
      }
    ],
    "risk_indicators": {
      "level": "none" | "low" | "moderate" | "high",
      "observations": ["Specific observations that informed this assessment"],
      "recommended_action": "What the coach should do about it"
    },
    "recommended_approach": {
      "tone": "Description of recommended tone (e.g., 'warm but grounding')",
      "pacing": "Recommended pacing (e.g., 'allow longer pauses')",
      "frameworks": ["CBT", "ACT", "values clarification"]
    },
    "continuity_notes": "Specific threads to follow up on from previous sessions"
  },
  "identity_synthesis": {
    "values_summary": "A brief summary of the user's core values as revealed through their sessions (e.g., 'authenticity, connection, growth'). Null if insufficient data.",
    "life_stage": "A brief descriptor of the user's current life stage or transition (e.g., 'career transition', 'new parent', 'relationship rebuilding'). Null if unclear.",
    "primary_domain": "career" | "relationships" | "health" | "purpose" | "finance" | null,
    "overall_clarity": 1-5 rating of how clear the user seems about their identity and direction (1=confused, 5=very clear). Null if insufficient data.",
    "flags": ["Array of attention flags if any concerns detected, e.g., 'crisis_risk', 'low_engagement', 'avoidance_pattern', 'isolation'. Empty array if none."]
  }
}

## Identity Synthesis Guidelines

The identity_synthesis section helps maintain a longitudinal understanding of the user:

- **values_summary**: Distill from what they repeatedly prioritize, what causes emotional reactions, what they sacrifice for
- **life_stage**: Identify from context clues about transitions, milestones, or challenges they're navigating
- **primary_domain**: Which of the five domains (career, relationships, health, purpose, finance) dominates their sessions
- **overall_clarity**: Based on consistency of self-narrative, decisiveness, and alignment between stated desires and behavior
- **flags**: Add flags sparingly for genuine concerns that need monitoring:
  - "crisis_risk" - mentions of hopelessness, self-harm, severe distress
  - "low_engagement" - minimal participation, short sessions, avoidance
  - "isolation" - patterns of social withdrawal
  - "avoidance_pattern" - consistently avoiding specific topics
  - "values_conflict" - significant tension between stated values and behavior

# Example Analysis Context

If you see a user who:
- Mentioned feeling overwhelmed at work in 3/5 sessions
- Started session 1 with low energy, session 5 with moderate energy
- Talked about wanting to set boundaries but never reported doing so
- Expressed guilt about self-care in multiple sessions

You might note:
- Theme: Work-life boundary struggles (frequency: 3, trajectory: stable)
- Progress: Energy levels improving slightly
- Area to explore: The gap between wanting to set boundaries and not doing so—explore what gets in the way
- Approach: ACT-based values clarification around what boundaries would protect

Remember: Your briefing should feel like a thoughtful colleague sharing observations, not a formal diagnostic report.`;

/**
 * Build the user message for the analyst with session data
 */
export function buildAnalystUserMessage({
  coreIdentity,
  sessions,
}: {
  coreIdentity: CoreIdentity | null;
  sessions: Session[];
}): string {
  let message = "# User Analysis Request\n\n";

  // Core Identity section
  message += "## Core Identity\n\n";
  if (coreIdentity && coreIdentity.status === "active") {
    message += `**Preferred Name**: ${coreIdentity.preferred_name}\n`;
    message += `**Primary Struggle**: ${coreIdentity.primary_struggle}\n`;
    message += `**Desired Direction**: ${coreIdentity.desired_direction}\n`;
    if (coreIdentity.readiness_level) {
      message += `**Readiness Level**: ${coreIdentity.readiness_level}/5\n`;
    }
    if (coreIdentity.time_availability) {
      message += `**Time Availability**: ${coreIdentity.time_availability}\n`;
    }
    if (coreIdentity.values_summary) {
      message += `**Previous Values Summary**: ${coreIdentity.values_summary}\n`;
    }
    if (coreIdentity.life_stage) {
      message += `**Previous Life Stage**: ${coreIdentity.life_stage}\n`;
    }
    if (coreIdentity.primary_domain) {
      message += `**Previous Primary Domain**: ${coreIdentity.primary_domain}\n`;
    }
    if (coreIdentity.overall_clarity) {
      message += `**Previous Overall Clarity**: ${coreIdentity.overall_clarity}/5\n`;
    }
    if (coreIdentity.flags && coreIdentity.flags.length > 0) {
      message += `**Previous Flags**: ${coreIdentity.flags.join(", ")}\n`;
    }
  } else {
    message += "*No confirmed core identity yet.*\n";
  }

  // Sessions section
  message += "\n## Recent Sessions (oldest to newest)\n\n";

  if (sessions.length === 0) {
    message += "*No sessions to analyze.*\n";
    return message;
  }

  sessions.forEach((session, index) => {
    const sessionDate = new Date(session.started_at).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    message += `### Session ${index + 1} (${sessionDate})\n\n`;
    message += `**Type**: ${session.session_type}\n`;
    message += `**Status**: ${session.call_status}\n`;

    // Mental state if available
    if (session.mental_state) {
      message += `\n**Mental State**:\n`;
      message += "```json\n";
      message += JSON.stringify(session.mental_state, null, 2);
      message += "\n```\n";
    }

    // Summary if available
    if (session.summary_json) {
      message += `\n**AI Summary**:\n`;
      message += "```json\n";
      message += JSON.stringify(session.summary_json, null, 2);
      message += "\n```\n";
    }

    // Next questions from that session
    if (session.next_questions) {
      message += `\n**Suggested Next Questions**:\n`;
      const questions = session.next_questions as string[];
      questions.forEach((q) => {
        message += `- ${q}\n`;
      });
    }

    // Transcript (truncate if very long to manage tokens)
    if (session.transcript) {
      const transcript = session.transcript;
      const maxLength = 4000; // ~1000 tokens per session
      const truncated = transcript.length > maxLength;
      const displayTranscript = truncated
        ? transcript.substring(0, maxLength) + "\n\n[...transcript truncated...]"
        : transcript;

      message += `\n**Transcript**:\n`;
      message += "```\n";
      message += displayTranscript;
      message += "\n```\n";
    }

    message += "\n---\n\n";
  });

  message += "\nPlease analyze these sessions and provide a coaching briefing.";

  return message;
}

/**
 * Validate that a response matches the AnalystOutput structure
 */
export function validateAnalystOutput(data: unknown): data is AnalystOutput {
  if (!data || typeof data !== "object") return false;

  const output = data as Record<string, unknown>;

  // Check briefing exists
  if (!output.briefing || typeof output.briefing !== "object") return false;
  const briefing = output.briefing as Record<string, unknown>;

  // Check required string fields in briefing
  if (typeof briefing.suggested_opening !== "string") return false;
  if (typeof briefing.continuity_notes !== "string") return false;

  // Check key_themes array
  if (!Array.isArray(briefing.key_themes)) return false;
  for (const theme of briefing.key_themes) {
    if (typeof theme !== "object" || theme === null) return false;
    if (typeof (theme as Record<string, unknown>).theme !== "string") return false;
    if (typeof (theme as Record<string, unknown>).frequency !== "number") return false;
    const trajectory = (theme as Record<string, unknown>).trajectory;
    if (!["improving", "stable", "worsening"].includes(trajectory as string)) return false;
  }

  // Check progress_observations array
  if (!Array.isArray(briefing.progress_observations)) return false;

  // Check areas_to_explore array
  if (!Array.isArray(briefing.areas_to_explore)) return false;

  // Check risk_indicators object
  if (typeof briefing.risk_indicators !== "object" || briefing.risk_indicators === null) return false;
  const risk = briefing.risk_indicators as Record<string, unknown>;
  if (!["none", "low", "moderate", "high"].includes(risk.level as string)) return false;

  // Check recommended_approach object
  if (typeof briefing.recommended_approach !== "object" || briefing.recommended_approach === null) return false;

  // Check identity_synthesis exists
  if (!output.identity_synthesis || typeof output.identity_synthesis !== "object") return false;
  const synthesis = output.identity_synthesis as Record<string, unknown>;

  // Validate identity_synthesis fields
  // values_summary, life_stage can be string or null
  if (synthesis.values_summary !== null && typeof synthesis.values_summary !== "string") return false;
  if (synthesis.life_stage !== null && typeof synthesis.life_stage !== "string") return false;

  // primary_domain can be one of the domains or null
  const validDomains = ["career", "relationships", "health", "purpose", "finance", null];
  if (!validDomains.includes(synthesis.primary_domain as string | null)) return false;

  // overall_clarity can be number 1-5 or null
  if (synthesis.overall_clarity !== null) {
    if (typeof synthesis.overall_clarity !== "number") return false;
    if (synthesis.overall_clarity < 1 || synthesis.overall_clarity > 5) return false;
  }

  // flags must be an array
  if (!Array.isArray(synthesis.flags)) return false;

  return true;
}

/**
 * Legacy validator for backwards compatibility
 * @deprecated Use validateAnalystOutput instead
 */
export function validateAnalystBriefing(data: unknown): data is AnalystBriefing {
  // Handle both old format (direct briefing) and new format (wrapped in briefing key)
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  // If it has a briefing key, validate the nested structure
  if (obj.briefing) {
    return validateAnalystOutput(data);
  }

  // Otherwise validate as direct briefing (legacy format)
  const briefing = obj;

  if (typeof briefing.suggested_opening !== "string") return false;
  if (typeof briefing.continuity_notes !== "string") return false;
  if (!Array.isArray(briefing.key_themes)) return false;
  if (!Array.isArray(briefing.progress_observations)) return false;
  if (!Array.isArray(briefing.areas_to_explore)) return false;
  if (typeof briefing.risk_indicators !== "object" || briefing.risk_indicators === null) return false;
  if (typeof briefing.recommended_approach !== "object" || briefing.recommended_approach === null) return false;

  return true;
}

/**
 * Create a default output when analysis cannot be performed
 */
export function createDefaultOutput(reason: string): AnalystOutput {
  return {
    briefing: {
      suggested_opening: "Welcome back! How have you been since we last spoke?",
      key_themes: [],
      progress_observations: [`Unable to perform full analysis: ${reason}`],
      areas_to_explore: [
        {
          topic: "Current state",
          reason: "No prior analysis available",
          approach: "Open-ended check-in to understand where they are",
        },
      ],
      risk_indicators: {
        level: "none",
        observations: [],
        recommended_action: "Proceed with standard session",
      },
      recommended_approach: {
        tone: "warm and curious",
        pacing: "normal",
        frameworks: [],
      },
      continuity_notes: "First analysis or insufficient data for pattern recognition.",
    },
    identity_synthesis: {
      values_summary: null,
      life_stage: null,
      primary_domain: null,
      overall_clarity: null,
      flags: [],
    },
  };
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use createDefaultOutput instead
 */
export function createDefaultBriefing(reason: string): AnalystBriefing {
  return createDefaultOutput(reason).briefing;
}
