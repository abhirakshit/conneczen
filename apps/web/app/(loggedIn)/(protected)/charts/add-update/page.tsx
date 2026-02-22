'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

import { useAuth } from '@/hooks/authContext'
import { getTimezone, convertUTCDateToLocalTZ } from '@/lib/utils/timezone'
import { useChartDataStore } from '@/lib/store/chart-data/chart-data-store'

import {
    chartProfileSchema,
    ChartProfileFormValues,
} from '@/lib/validators/chart-profile'
import {createJSClient} from "@/lib/supabase/client";

dayjs.extend(utc)
dayjs.extend(timezone)

export default function ChartProfileForm() {
    const supabase = createJSClient()
    const router = useRouter()
    const params = useSearchParams()
    const { user } = useAuth()
    const { chartInfo } = useChartDataStore()

    const isEdit = Boolean(params?.get('profileId'))
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API!

    const [autocomplete, setAutocomplete] = useState<any>(null)

    const form = useForm<ChartProfileFormValues>({
        resolver: zodResolver(chartProfileSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            dateOfBirth: '',
            timeOfBirth: '',
            gender: 'male',
            location: {
                name: '',
                timeZoneId: '',
                coordinates: { lat: 0, lng: 0 },
            },
        },
    })

    // preload edit
    useEffect(() => {
        if (!chartInfo) return

        const dt = dayjs(
            convertUTCDateToLocalTZ(
                chartInfo.date_time_of_birth_utc,
                chartInfo.location.timeZoneId
            )
        )

        form.reset({
            firstName: chartInfo.first_name,
            lastName: chartInfo.last_name,
            dateOfBirth: dt.format('YYYY-MM-DD'),
            timeOfBirth: dt.format('HH:mm'),
            gender: chartInfo.gender,
            location: chartInfo.location,
        })
    }, [chartInfo])

    const onLoad = (ac: google.maps.places.Autocomplete) => setAutocomplete(ac);
    const onPlaceChanged = async () => {
        if (!autocomplete) {
            console.error("Autocomplete load error...")
            return
        }
        const place = autocomplete.getPlace()
        if (!place || !place.geometry) {
            console.error("No geometry on selected place")
            return
        }

        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const ts = Math.floor(Date.now() / 1000)

        const timeZoneId = await getTimezone(lat, lng, ts, apiKey)

        form.setValue('location', {
            name: place.formatted_address,
            timeZoneId,
            coordinates: { lat, lng },
        })
    }

    const onSubmit = async (values: ChartProfileFormValues) => {
        const localDT = `${values.dateOfBirth} ${values.timeOfBirth}`

        const localISO = dayjs
            .tz(localDT, values.location.timeZoneId)
            .format()

        const utcISO = dayjs
            .tz(localDT, values.location.timeZoneId)
            .utc()
            .format()

        const payload = {
            first_name: values.firstName,
            last_name: values.lastName,
            gender: values.gender,
            location: values.location,
            user_id: user!.id,
            date_time_of_birth: localISO,
            date_time_of_birth_utc: utcISO,
        }

        const result = isEdit && chartInfo?.id
            ? await supabase
                .from('chart_profiles')
                .update(payload)
                .eq('id', chartInfo.id)
            : await supabase.from('chart_profiles').insert(payload)

        if (!result.error) router.push('/protected/charts')
    }

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-maps-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API!,
        libraries: ['places'],
    })

    if (!isLoaded) {
        console.error(loadError)
        return null
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {isEdit ? 'Update Profile' : 'Add Profile'}
                            </CardTitle>
                        </CardHeader>

                        <Separator />

                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <Input {...field} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <Input {...field} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="dateOfBirth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Date of Birth</FormLabel>
                                            <Input type="date" {...field} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="timeOfBirth"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Time of Birth</FormLabel>
                                            <Input type="time" {...field} />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormItem>
                                <FormLabel>Location</FormLabel>

                                <Autocomplete
                                    onLoad={onLoad}
                                    onPlaceChanged={onPlaceChanged}
                                >
                                    <input
                                        type="text"
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                        placeholder="Search location…"
                                        defaultValue={form.getValues('location.name')}
                                    />
                                </Autocomplete>

                                {form.formState.errors.location && (
                                    <p className="text-sm text-destructive">
                                        {form.formState.errors.location.name?.message}
                                    </p>
                                )}
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>

                        <Separator />

                        <CardFooter className="justify-end">
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {isEdit ? 'Update Profile' : 'Create Profile'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    )
}