"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TIMEZONE_OPTIONS } from "@/lib/utils/timezone";
import { updateSettings } from "@/lib/actions/settings";
import type { UserProfileData } from "@/lib/queries/users";
import { Sun, Moon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  timezone: z.string().min(1, "Please select a timezone"),
  phone: z.string().optional(),
  enable_morning: z.boolean(),
  morning_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time").optional(),
  enable_evening: z.boolean(),
  evening_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time").optional(),
}).refine(
  (data) => data.enable_morning || data.enable_evening,
  { message: "At least one call time must be enabled", path: ["enable_morning"] }
);

type FormValues = z.infer<typeof formSchema>;

interface SettingsFormProps {
  profile: UserProfileData | null;
  email: string;
}

export function SettingsForm({ profile, email }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Extract values from nested profile structure
  const morningSchedule = profile?.schedules?.find(s => s.schedule_type === "morning" && s.active);
  const eveningSchedule = profile?.schedules?.find(s => s.schedule_type === "evening" && s.active);
  const timezone = profile?.settings?.timezone || profile?.schedule?.timezone || "America/New_York";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile?.user?.name || "",
      timezone: timezone,
      phone: profile?.user?.phone || "",
      enable_morning: !!morningSchedule,
      morning_time: morningSchedule?.call_time_local?.slice(0, 5) || "07:00",
      enable_evening: !!eveningSchedule,
      evening_time: eveningSchedule?.call_time_local?.slice(0, 5) || "20:00",
    },
  });

  const enableMorning = form.watch("enable_morning");
  const enableEvening = form.watch("enable_evening");

  async function onSubmit(values: FormValues) {
    setIsLoading(true);

    try {
      const result = await updateSettings({
        name: values.name,
        timezone: values.timezone,
        phone: values.phone || null,
        morning_time: values.enable_morning ? values.morning_time || null : null,
        evening_time: values.enable_evening ? values.evening_time || null : null,
      });

      if (result.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Call Schedule */}
        <Card className="bg-white border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Call Schedule</CardTitle>
            <CardDescription className="text-amber-600">
              Set your preferred daily call times. We&apos;ll call you at these times.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Morning Schedule */}
            <div className="rounded-lg border border-amber-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="font-medium text-amber-900">Morning Check-in</span>
                </div>
                <FormField
                  control={form.control}
                  name="enable_morning"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              {enableMorning && (
                <FormField
                  control={form.control}
                  name="morning_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="w-32 border-amber-200 focus:border-teal-500 focus:ring-teal-500"
                        />
                      </FormControl>
                      <FormDescription className="text-amber-600">
                        3-5 min reflection to start your day
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Evening Schedule */}
            <div className="rounded-lg border border-amber-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-500" />
                  <span className="font-medium text-amber-900">Evening Reflection</span>
                </div>
                <FormField
                  control={form.control}
                  name="enable_evening"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              {enableEvening && (
                <FormField
                  control={form.control}
                  name="evening_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="w-32 border-amber-200 focus:border-teal-500 focus:ring-teal-500"
                        />
                      </FormControl>
                      <FormDescription className="text-amber-600">
                        5 min to process and unwind
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Timezone */}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-900">Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full max-w-xs border-amber-200 focus:border-teal-500 focus:ring-teal-500">
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="bg-white border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900">Account</CardTitle>
            <CardDescription className="text-amber-600">
              Your account information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-900">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="max-w-md border-amber-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </FormControl>
                  <FormDescription className="text-amber-600">
                    This is how we&apos;ll greet you during your sessions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-amber-900">Email</label>
              <Input
                value={email}
                disabled
                className="max-w-md bg-amber-50 border-amber-200 text-amber-700"
              />
              <p className="text-sm text-amber-600">
                Your email address cannot be changed.
              </p>
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-amber-900">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      {...field}
                      className="max-w-md border-amber-200 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </FormControl>
                  <FormDescription className="text-amber-600">
                    The phone number we&apos;ll use to call you for your sessions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={isLoading}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
