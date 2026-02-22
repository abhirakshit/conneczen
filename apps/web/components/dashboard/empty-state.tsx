import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white border-amber-200">
      <div className="text-amber-400 mb-4">{icon}</div>
      <CardTitle className="mb-2 text-lg text-amber-900">{title}</CardTitle>
      <CardDescription className="max-w-sm mb-4 text-amber-700">{description}</CardDescription>
      {action && (
        <Button asChild className="bg-teal-600 hover:bg-teal-700 text-white">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </Card>
  );
}
