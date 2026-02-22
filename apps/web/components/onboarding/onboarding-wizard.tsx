"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONE_OPTIONS } from "@/lib/utils/timezone";
import { completeOnboarding } from "@/lib/actions/onboarding";
import type { UserProfileData } from "@/lib/queries/users";
import { ChevronLeft, ChevronRight, Phone, Clock, Shield, MessageCircle } from "lucide-react";

const STEPS = ["welcome", "privacy", "disclaimer", "schedule", "phone"] as const;
type Step = (typeof STEPS)[number];

interface OnboardingWizardProps {
  userId: string;
  email: string;
  existingProfile: UserProfileData | null;
}

export function OnboardingWizard({ userId, email, existingProfile }: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [isLoading, setIsLoading] = useState(false);

  // Form state - use morning_time for backwards compatibility with single-time wizard
  const [formData, setFormData] = useState({
    name: existingProfile?.user?.name || "",
    phone: existingProfile?.user?.phone || "",
    timezone: existingProfile?.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    morning_time: existingProfile?.schedule?.call_time_local?.slice(0, 5) || "09:00",
    disclaimer_accepted: false,
    privacy_acknowledged: false,
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const goNext = () => {
    if (!isLastStep) {
      setCurrentStep(STEPS[currentStepIndex + 1]);
    }
  };

  const goBack = () => {
    if (!isFirstStep) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleComplete = async () => {
    if (!formData.disclaimer_accepted) {
      toast.error("Please accept the disclaimer to continue");
      return;
    }

    if (!formData.privacy_acknowledged) {
      toast.error("Please acknowledge the privacy policy to continue");
      return;
    }

    if (!formData.name || formData.name.length < 1) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.phone || formData.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      const result = await completeOnboarding({
        name: formData.name,
        phone: formData.phone,
        timezone: formData.timezone,
        morning_time: formData.morning_time,
        evening_time: null, // Wizard only sets morning time
        disclaimer_accepted: formData.disclaimer_accepted,
        privacy_acknowledged: formData.privacy_acknowledged,
      });

      if (result.success) {
        toast.success("Setup complete! Let's start your welcome call.");
        router.push("/onboarding/welcome-call");
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex justify-center gap-2">
        {STEPS.map((step, index) => (
          <div
            key={step}
            className={`h-2 w-12 rounded-full transition-colors ${
              index <= currentStepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      {currentStep === "welcome" && (
        <WelcomeStep onNext={goNext} />
      )}

      {currentStep === "privacy" && (
        <PrivacyStep
          acknowledged={formData.privacy_acknowledged}
          onAcknowledge={(val) => setFormData({ ...formData, privacy_acknowledged: val })}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === "disclaimer" && (
        <DisclaimerStep
          accepted={formData.disclaimer_accepted}
          onAccept={(val) => setFormData({ ...formData, disclaimer_accepted: val })}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === "schedule" && (
        <ScheduleStep
          callTime={formData.morning_time}
          timezone={formData.timezone}
          onCallTimeChange={(val) => setFormData({ ...formData, morning_time: val })}
          onTimezoneChange={(val) => setFormData({ ...formData, timezone: val })}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === "phone" && (
        <PhoneStep
          name={formData.name}
          phone={formData.phone}
          onNameChange={(val) => setFormData({ ...formData, name: val })}
          onPhoneChange={(val) => setFormData({ ...formData, phone: val })}
          onComplete={handleComplete}
          onBack={goBack}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// Step 1: Welcome
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome to Conneczen</CardTitle>
        <CardDescription className="text-base">
          Your personal AI companion for daily reflection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 text-muted-foreground">
          <p>
            Conneczen helps you develop self-awareness through brief daily voice
            conversations. Each day, we&apos;ll call you at your preferred time for a
            3-5 minute guided reflection session.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 mt-0.5 text-primary" />
              <p>
                <strong className="text-foreground">Daily voice calls</strong> - We call you,
                so reflection becomes a natural part of your routine.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-0.5 text-primary" />
              <p>
                <strong className="text-foreground">Quick sessions</strong> - Just 3-5 minutes
                to check in with yourself without disrupting your day.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 text-primary" />
              <p>
                <strong className="text-foreground">Private & secure</strong> - Your
                conversations are encrypted and never shared.
              </p>
            </div>
          </div>
        </div>

        <Button onClick={onNext} className="w-full" size="lg">
          Get Started
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Step 2: Privacy
function PrivacyStep({
  acknowledged,
  onAcknowledge,
  onNext,
  onBack,
}: {
  acknowledged: boolean;
  onAcknowledge: (val: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Privacy Matters</CardTitle>
        <CardDescription>
          How we handle your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium text-foreground">What we collect</h4>
            <ul className="space-y-2 list-disc pl-4">
              <li>Voice recordings during your sessions (deleted after 7 days)</li>
              <li>Transcripts of your conversations</li>
              <li>AI-generated summaries and insights</li>
              <li>Your schedule preferences and contact info</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium text-foreground">How we use it</h4>
            <ul className="space-y-2 list-disc pl-4">
              <li>To provide personalized reflection sessions</li>
              <li>To identify patterns and generate insights over time</li>
              <li>To improve the AI&apos;s ability to support you</li>
            </ul>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium text-foreground">What we never do</h4>
            <ul className="space-y-2 list-disc pl-4">
              <li>Sell your data to third parties</li>
              <li>Share your conversations with anyone</li>
              <li>Use your data for advertising</li>
            </ul>
          </div>
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="privacy"
            checked={acknowledged}
            onCheckedChange={(checked: boolean | "indeterminate") => onAcknowledge(checked === true)}
          />
          <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
            I understand how my data will be used and stored
          </Label>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!acknowledged} className="flex-1">
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 3: Disclaimer
function DisclaimerStep({
  accepted,
  onAccept,
  onNext,
  onBack,
}: {
  accepted: boolean;
  onAccept: (val: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Important Disclaimer</CardTitle>
        <CardDescription>
          Please read and acknowledge before continuing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4 space-y-3">
          <h4 className="font-semibold text-amber-900 dark:text-amber-200">
            Conneczen is NOT a substitute for professional mental health care
          </h4>
          <div className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
            <p>
              This service is designed for personal reflection and self-awareness, not
              for treating mental health conditions.
            </p>
            <p>
              If you are experiencing a mental health crisis, suicidal thoughts, or need
              professional support, please contact:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>988 Suicide & Crisis Lifeline:</strong> Call or text 988
              </li>
              <li>
                <strong>Crisis Text Line:</strong> Text HOME to 741741
              </li>
              <li>
                <strong>Emergency Services:</strong> 911
              </li>
            </ul>
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            Conneczen is an AI-powered tool for guided self-reflection. While our AI is
            designed to be supportive and empathetic, it:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Cannot diagnose or treat mental health conditions</li>
            <li>Is not a licensed therapist, counselor, or medical professional</li>
            <li>Should not replace professional mental health treatment</li>
            <li>May not always respond appropriately to crisis situations</li>
          </ul>
        </div>

        <div className="flex items-start space-x-3 pt-2">
          <Checkbox
            id="disclaimer"
            checked={accepted}
            onCheckedChange={(checked: boolean | "indeterminate") => onAccept(checked === true)}
          />
          <Label htmlFor="disclaimer" className="text-sm leading-relaxed cursor-pointer">
            I understand that Conneczen is not therapy and is not a substitute for
            professional mental health care
          </Label>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} disabled={!accepted} className="flex-1">
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 4: Schedule
function ScheduleStep({
  callTime,
  timezone,
  onCallTimeChange,
  onTimezoneChange,
  onNext,
  onBack,
}: {
  callTime: string;
  timezone: string;
  onCallTimeChange: (val: string) => void;
  onTimezoneChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Schedule</CardTitle>
        <CardDescription>
          Choose when you&apos;d like to receive your daily reflection call
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="call_time">Daily Call Time</Label>
            <Input
              id="call_time"
              type="time"
              value={callTime}
              onChange={(e) => onCallTimeChange(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground">
              Pick a time when you can take 3-5 minutes for yourself. Many people
              prefer morning or evening.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Your Timezone</Label>
            <Select value={timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4">
          <p className="text-sm">
            <strong>Tip:</strong> Consistency is key. Choose a time you can commit to
            daily, even on weekends. You can always change this later in settings.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Step 5: Phone & Name
function PhoneStep({
  name,
  phone,
  onNameChange,
  onPhoneChange,
  onComplete,
  onBack,
  isLoading,
}: {
  name: string;
  phone: string;
  onNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const isValid = name.length >= 1 && phone.length >= 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Almost Done!</CardTitle>
        <CardDescription>
          Tell us how to reach you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="What should we call you?"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              This is how we&apos;ll greet you during your sessions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">
              Include your country code. We&apos;ll call you at this number for your
              daily sessions.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-4 space-y-2">
          <p className="text-sm font-medium">What happens next?</p>
          <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
            <li>Your first call will be scheduled based on your preferred time</li>
            <li>You can start a session early from your dashboard anytime</li>
            <li>Change your schedule or preferences in settings</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} disabled={isLoading} className="flex-1">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={onComplete}
            disabled={!isValid || isLoading}
            className="flex-1"
          >
            {isLoading ? "Setting up..." : "Complete Setup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
