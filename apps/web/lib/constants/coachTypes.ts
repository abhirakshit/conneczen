export interface CoachType {
    id: string;
    label: string;
    description: string;
}

export const COACH_TYPES: CoachType[] = [
    {
        id: "mindfulness",
        label: "Mindfulness & Calm",
        description:
            "Focus on awareness, stress reduction, and emotional grounding.",
    },
    {
        id: "discipline",
        label: "Discipline & Focus",
        description:
            "Helps build structure, consistency, and accountability in daily life.",
    },
    {
        id: "addiction",
        label: "Addiction Recovery Support",
        description:
            "Provides compassionate support to overcome unhealthy dependencies.",
    },
];

export type CoachTypeId = (typeof COACH_TYPES)[number]["id"];