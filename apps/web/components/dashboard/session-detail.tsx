import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Clock, Calendar, FileText, Sparkles, Brain, HelpCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";
import { formatInTimezone } from "@/lib/utils/timezone";
import type { Session, Json } from "@/types/database";

interface SessionDetailProps {
  session: Session;
  timezone: string;
}

// Helper to extract summary text from summary_json
function getSummaryText(summaryJson: Json | null): string | null {
  if (!summaryJson) return null;
  if (typeof summaryJson === "string") return summaryJson;
  if (typeof summaryJson === "object" && summaryJson !== null && !Array.isArray(summaryJson)) {
    const obj = summaryJson as Record<string, Json | undefined>;
    if (typeof obj.summary === "string") return obj.summary;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.content === "string") return obj.content;
  }
  return null;
}

// Helper to extract mental state info
function getMentalStateText(mentalState: Json | null): string | null {
  if (!mentalState) return null;
  if (typeof mentalState === "string") return mentalState;
  if (typeof mentalState === "object" && mentalState !== null && !Array.isArray(mentalState)) {
    const obj = mentalState as Record<string, Json | undefined>;
    if (typeof obj.description === "string") return obj.description;
    if (typeof obj.state === "string") return obj.state;
    if (typeof obj.mood === "string") return obj.mood;
  }
  return JSON.stringify(mentalState, null, 2);
}

// Helper to get next questions
function getNextQuestions(nextQuestions: Json | null): string[] {
  if (!nextQuestions) return [];
  if (Array.isArray(nextQuestions)) {
    return nextQuestions.filter((q): q is string => typeof q === "string");
  }
  return [];
}

// Calculate duration from started_at and ended_at
function calculateDuration(startedAt: string, endedAt: string | null): number | null {
  if (!endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.round((end - start) / 1000);
}

export function SessionDetail({ session, timezone }: SessionDetailProps) {
  const summaryText = getSummaryText(session.summary_json);
  const mentalStateText = getMentalStateText(session.mental_state);
  const nextQuestions = getNextQuestions(session.next_questions);
  const duration = calculateDuration(session.started_at, session.ended_at);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100">
        <Link href="/sessions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sessions
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold tracking-tight text-amber-900">
            {formatInTimezone(session.started_at, timezone, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h1>
          <Badge
            className={session.call_status === "completed"
              ? "bg-teal-100 text-teal-800 border-teal-300"
              : "bg-amber-100 text-amber-800 border-amber-300"}
          >
            {session.call_status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-amber-600">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatInTimezone(session.started_at, timezone, {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
          {duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>

      {/* AI Summary */}
      <Card className="bg-white border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summaryText ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900">
              {summaryText}
            </p>
          ) : (
            <p className="text-sm text-amber-600 italic">
              No summary available for this session.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mental State (if available) */}
      {mentalStateText && (
        <Card className="bg-white border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <Brain className="h-4 w-4 text-teal-600" />
              Mental State
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-amber-900">
              {mentalStateText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next Questions (if available) */}
      {nextQuestions.length > 0 && (
        <Card className="bg-white border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-teal-600" />
              Questions to Explore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 list-disc pl-4 text-amber-900">
              {nextQuestions.map((question, index) => (
                <li key={index}>{question}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Transcript */}
      <Card className="bg-white border-amber-200">
        <Accordion type="single" collapsible defaultValue="transcript">
          <AccordionItem value="transcript" className="border-0">
            <CardHeader className="pb-0">
              <AccordionTrigger className="hover:no-underline py-0">
                <CardTitle className="text-sm font-medium text-amber-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-600" />
                  Full Transcript
                </CardTitle>
              </AccordionTrigger>
            </CardHeader>
            <AccordionContent>
              <CardContent className="pt-4">
                {session.transcript ? (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono bg-amber-50 p-4 rounded-lg max-h-[500px] overflow-y-auto text-amber-900 border border-amber-200">
                    {session.transcript}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 italic">
                    No transcript available for this session.
                  </p>
                )}
              </CardContent>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}
