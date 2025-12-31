'use client'

import { createJSClient } from '@/lib/supabase/client'
import { capitalize } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/card'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination'

import { Eye } from 'lucide-react'

import { useAuth } from '@/hooks/authContext'
import { useChartDataStore } from '@/lib/store/chart-data/chart-data-store'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export default function Charts() {
    const supabase = createJSClient()
    const router = useRouter()
    const { user } = useAuth()

    const [allCharts, setAllCharts] = useState<any[]>([])
    const { setChartInfo, setChartProfileData } = useChartDataStore()

    useEffect(() => {
        if (!user) return

        const fetchCharts = async () => {
            console.log('fetchCharts called', user.id)
            const { data, error } = await supabase
                .from('chart_profiles')
                .select('*')
                .eq('user_id', user.id)

            // console.log("Charts", data, error);
            if (!error && data)
                setAllCharts(data)
            else
                console.error(error)
        }

        fetchCharts()
        setChartProfileData(null)
    }, [user])

    const showChartDetails = (chart: any) => {
        setChartInfo(chart)
        router.push(`/charts/${chart.id}`)
    }

    return (
        <div className="flex-1 w-full">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Profiles</CardTitle>
                    <Button
                        onClick={() => router.push('/charts/add-update')}
                    >
                        Add Profile
                    </Button>
                </CardHeader>

                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>First Name</TableHead>
                                <TableHead>Last Name</TableHead>
                                <TableHead>Gender</TableHead>
                                <TableHead>Date / Time</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {allCharts.map((chart) => (
                                <TableRow
                                    key={chart.id}
                                    className="cursor-pointer hover:bg-muted"
                                    onClick={() => showChartDetails(chart)}
                                >
                                    <TableCell>{capitalize(chart.first_name)}</TableCell>
                                    <TableCell>{capitalize(chart.last_name)}</TableCell>
                                    <TableCell>{capitalize(chart.gender)}</TableCell>

                                    <TableCell>
                                        {dayjs
                                            .utc(chart.date_time_of_birth_utc)
                                            .tz(chart.location.timeZoneId)
                                            .format('MMM DD, YYYY · hh:mm A')}
                                    </TableCell>

                                    <TableCell>
                                        {chart.location?.name}
                                    </TableCell>

                                    <TableCell
                                        className="text-right"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => showChartDetails(chart)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>View details</TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>

                <CardFooter className="justify-end">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationLink isActive>1</PaginationLink>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </CardFooter>
            </Card>
        </div>
    )
}