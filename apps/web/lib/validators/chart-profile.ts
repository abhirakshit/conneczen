// lib/validators/chart-profile.ts
import { z } from 'zod'

export const chartProfileSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    timeOfBirth: z.string().min(1, 'Time of birth is required'),
    gender: z.enum(['male', 'female', 'other']),
    location: z.object({
        name: z.string().min(1, 'Location is required'),
        timeZoneId: z.string().min(1, 'Timezone missing'),
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }),
    }),
})

export type ChartProfileFormValues = z.infer<typeof chartProfileSchema>