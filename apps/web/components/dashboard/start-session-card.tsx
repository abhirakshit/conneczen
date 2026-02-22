import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Sparkles } from "lucide-react";

export function StartSessionCard() {
  return (
    <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-teal-700 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Ready to Reflect?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-teal-600">
          Start a reflection session now. No need to wait for your scheduled call.
        </p>
        <Button asChild className="w-full bg-teal-600 hover:bg-teal-700 text-white">
          <Link href="/call">
            <Phone className="mr-2 h-4 w-4" />
            Start Session Now
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
