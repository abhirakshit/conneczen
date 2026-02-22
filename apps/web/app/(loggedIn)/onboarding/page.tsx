"use client";

import { useState, useEffect } from "react";
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
import { useUserData } from "@/lib/store/useUserData";
import { Phone, Clock, Sun, Moon, Shield } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { setOnboardingComplete } = useUserData();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    timezone: "",
    morning_time: "07:00",
    evening_time: "20:00",
    enable_morning: true,
    enable_evening: true,
    disclaimer_accepted: false,
    privacy_acknowledged: false,
  });

  // Auto-detect timezone on mount
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setFormData((prev) => ({ ...prev, timezone: detected }));
  }, []);

  const handleComplete = async () => {
    if (!formData.name || formData.name.length < 1) {
      toast.error("Please enter your name");
      return;
    }

    if (!formData.phone || formData.phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!formData.enable_morning && !formData.enable_evening) {
      toast.error("Please enable at least one daily call time");
      return;
    }

    if (!formData.disclaimer_accepted) {
      toast.error("Please accept the disclaimer to continue");
      return;
    }

    if (!formData.privacy_acknowledged) {
      toast.error("Please acknowledge the privacy policy to continue");
      return;
    }

    setIsLoading(true);

    try {
      const result = await completeOnboarding({
        name: formData.name,
        phone: formData.phone,
        timezone: formData.timezone,
        morning_time: formData.enable_morning ? formData.morning_time : null,
        evening_time: formData.enable_evening ? formData.evening_time : null,
        disclaimer_accepted: formData.disclaimer_accepted,
        privacy_acknowledged: formData.privacy_acknowledged,
      });

      if (result.success) {
        // Update store immediately to prevent redirect loop
        setOnboardingComplete(true);
        toast.success("Setup complete! Welcome to Conneczen.");
        router.push("/dashboard");
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Card className="bg-white border-amber-200">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <Phone className="h-8 w-8 text-teal-600" />
          </div>
          <CardTitle className="text-2xl text-amber-900">Set Up Your Daily Calls</CardTitle>
          <CardDescription className="text-amber-700">
            Brief daily check-ins to help you stay connected with yourself
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-amber-900">Your Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="What should we call you?"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="border-amber-200 focus:border-teal-500 focus:ring-teal-500"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-amber-900">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="border-amber-200 focus:border-teal-500 focus:ring-teal-500"
            />
            <p className="text-xs text-amber-600">
              Include country code. We&apos;ll call you at this number.
            </p>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-amber-900">Your Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(val) => setFormData({ ...formData, timezone: val })}
            >
              <SelectTrigger className="border-amber-200 focus:border-teal-500 focus:ring-teal-500">
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

          {/* Call Schedule */}
          <div className="space-y-4">
            <Label className="text-amber-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Call Schedule
            </Label>

            {/* Morning Call */}
            <div className="rounded-lg border border-amber-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="font-medium text-amber-900">Morning Check-in</span>
                </div>
                <Checkbox
                  id="enable_morning"
                  checked={formData.enable_morning}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData({ ...formData, enable_morning: checked === true })
                  }
                />
              </div>
              {formData.enable_morning && (
                <div className="flex items-center gap-3">
                  <Input
                    id="morning_time"
                    type="time"
                    value={formData.morning_time}
                    onChange={(e) => setFormData({ ...formData, morning_time: e.target.value })}
                    className="w-32 border-amber-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-amber-600">3-5 min reflection to start your day</span>
                </div>
              )}
            </div>

            {/* Evening Call */}
            <div className="rounded-lg border border-amber-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  <span className="font-medium text-amber-900">Evening Reflection</span>
                </div>
                <Checkbox
                  id="enable_evening"
                  checked={formData.enable_evening}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData({ ...formData, enable_evening: checked === true })
                  }
                />
              </div>
              {formData.enable_evening && (
                <div className="flex items-center gap-3">
                  <Input
                    id="evening_time"
                    type="time"
                    value={formData.evening_time}
                    onChange={(e) => setFormData({ ...formData, evening_time: e.target.value })}
                    className="w-32 border-amber-200 focus:border-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-amber-600">5 min to process and unwind</span>
                </div>
              )}
            </div>
          </div>

          {/* Agreements */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-4">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <span className="text-sm font-medium text-amber-900">Before we begin</span>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy"
                checked={formData.privacy_acknowledged}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  setFormData({ ...formData, privacy_acknowledged: checked === true })
                }
              />
              <Label htmlFor="privacy" className="text-sm text-amber-700 leading-relaxed cursor-pointer">
                I understand my conversations are private and encrypted. Voice recordings are
                deleted after 7 days.
              </Label>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="disclaimer"
                checked={formData.disclaimer_accepted}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  setFormData({ ...formData, disclaimer_accepted: checked === true })
                }
              />
              <Label htmlFor="disclaimer" className="text-sm text-amber-700 leading-relaxed cursor-pointer">
                I understand Conneczen is for self-reflection, not therapy or medical care.
                For mental health emergencies, I will contact 988 or emergency services.
              </Label>
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleComplete}
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            size="lg"
          >
            {isLoading ? "Setting up..." : "Start My Journey"}
          </Button>

          <p className="text-center text-xs text-amber-600">
            You can change your schedule anytime in settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
