// Placeholder - component temporarily disabled
export default function ChartPage() {
  return <div>Chart page coming soon</div>
}

// 'use client'
//
// import {
//     Card,
//     CardHeader,
//     CardTitle,
//     CardContent,
// } from '@/components/ui/card'
// import { Button } from '@/components/ui/button'
// import {
//     Tooltip,
//     TooltipTrigger,
//     TooltipContent,
// } from '@/components/ui/tooltip'
//
// import { Edit, Trash2 } from 'lucide-react'
// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
//
// import { useChartDataStore } from '@/store/chart-data/chart-data-store'
// import { convertUTCDateToLocalTZ } from '@/lib/utils/timezone'
//
// import VDashaChart from '@/components/canvas/VDashaChart'
// import DateSelectionBar from '@/components/partials/DateSelectionBar'
// import useDateStore from '@/store/dateStore'
// import { EventsCard } from '@/components/partials/Events'
// import { ConsultationsCard } from '@/components/partials/Consultations'
// import { BNNTrineChart } from '@/components/canvas/BNNTrineChart'
// import { AnalyticsCard } from '@/components/partials/Analytics'
// import { ChartComponentDivisional } from '@/components/partials/ChartComponentDivisional'
// import { ChartComponentTransit } from '@/components/partials/ChartComponentTransit'
// import {Spinner} from "@/components/ui/spinner";
//
// export default function Chart() {
//     const router = useRouter()
//
//     const { highlightDate } = useDateStore()
//     const {
//         chartInfo,
//         chartProfileData,
//         transitD1ChartData,
//         setTransitD1ChartData,
//     } = useChartDataStore()
//
//     const [orientationHouse, setOrientationHouse] = useState(1)
//
//     const handleEdit = () => {
//         router.push(`/protected/charts/add-update?profileId=${chartInfo.id}`)
//     }
//
//     const handleDelete = () => {
//         // TODO: confirm + delete
//     }
//
//     useEffect(() => {
//         if (!chartInfo || !chartProfileData) return
//
//         const fetchTransitChart = async () => {
//             const localDateObj = highlightDate.tz(chartInfo.location.timeZoneId)
//
//             const res = await fetch('/api/getTransitChart', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({
//                     date: localDateObj.format('YYYY-MM-DD'),
//                     time: localDateObj.format('HH:mm'),
//                     latitude: chartInfo.location.coordinates.lat,
//                     longitude: chartInfo.location.coordinates.lng,
//                     timezone: chartInfo.location.timeZoneId,
//                 }),
//             })
//
//             const result = await res.json()
//             if (!result?.data?.chartData) throw new Error('Transit data missing')
//
//             setTransitD1ChartData(result.data.chartData)
//         }
//
//         fetchTransitChart()
//         setOrientationHouse(chartProfileData.d1.ascendant.signNumber)
//     }, [chartInfo, chartProfileData, highlightDate])
//
//     if (!chartProfileData) return <Spinner />
//
//     return (
//         <div className="grid grid-cols-4 gap-2">
//             {/* Left column */}
//             <div className="col-span-1 space-y-2">
//                 <Card>
//                     <CardHeader className="flex flex-row items-start justify-between">
//                         <div>
//                             <CardTitle className="text-lg">
//                                 {chartInfo.first_name} {chartInfo.last_name}
//                             </CardTitle>
//                         </div>
//
//                         <div className="flex gap-1">
//                             <Tooltip>
//                                 <TooltipTrigger asChild>
//                                     <Button
//                                         size="icon"
//                                         variant="ghost"
//                                         onClick={handleEdit}
//                                     >
//                                         <Edit className="h-4 w-4" />
//                                     </Button>
//                                 </TooltipTrigger>
//                                 <TooltipContent>Edit</TooltipContent>
//                             </Tooltip>
//
//                             <Tooltip>
//                                 <TooltipTrigger asChild>
//                                     <Button
//                                         size="icon"
//                                         variant="ghost"
//                                         onClick={handleDelete}
//                                     >
//                                         <Trash2 className="h-4 w-4 text-destructive" />
//                                     </Button>
//                                 </TooltipTrigger>
//                                 <TooltipContent>Delete</TooltipContent>
//                             </Tooltip>
//                         </div>
//                     </CardHeader>
//
//                     <CardContent className="space-y-1 text-sm text-muted-foreground">
//                         <p>{chartInfo.location.name}</p>
//                         <p>
//                             {convertUTCDateToLocalTZ(
//                                 chartInfo.date_time_of_birth_utc,
//                                 chartInfo.location.timeZoneId
//                             )}
//                         </p>
//                     </CardContent>
//                 </Card>
//
//                 <EventsCard />
//                 <ConsultationsCard />
//             </div>
//
//             {/* Right column */}
//             <div className="col-span-3 space-y-2">
//                 <DateSelectionBar />
//
//                 <div className="grid grid-cols-3 gap-2">
//                     <div className="col-span-2">
//                         <VDashaChart
//                             chartPersonalInfo={chartInfo}
//                             vimshottariDasha={chartProfileData.vimshottari_dasha}
//                         />
//                     </div>
//                     <AnalyticsCard />
//                 </div>
//
//                 <div className="grid grid-cols-3 gap-2">
//                     <ChartComponentDivisional chartProfileData={chartProfileData} />
//                     <ChartComponentTransit transitD1ChartData={transitD1ChartData} />
//                     <BNNTrineChart
//                         chartData={chartProfileData.d1}
//                         transitD1ChartData={transitD1ChartData}
//                         trineNumber={1}
//                     />
//                 </div>
//             </div>
//         </div>
//     )
// }