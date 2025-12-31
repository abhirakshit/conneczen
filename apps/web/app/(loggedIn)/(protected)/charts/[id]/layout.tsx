// 'use client'
// import {useParams, useRouter} from "next/navigation";
// import React, {useEffect} from "react";
// import {useChartDataStore} from "@/store/chart-data/chart-data-store";
// import dayjs from "dayjs";
// import {Spinner} from "@/components/ui/spinner";
//
// export default function ChartsLayout({children}) {
//     const router = useRouter()
//
//     // TODO: On hard refresh how to get the profile data
//     const params = useParams(); // Access dynamic route params
//     const { id } = params; // Extract the dynamic `id`
//
//     const { chartInfo, setChartProfileData} = useChartDataStore();
//     useEffect(() => {
//         if (chartInfo == null || chartInfo.id == null) {
//             console.warn('No chart info in store, redirecting to /protected/charts');
//             router.push('/protected/charts');
//         }
//         const fetchSelectedProfileData = async () => {
//             // console.log("PData", chartInfo);
//             if (!chartInfo) return;
//
//             const localDateObj = dayjs.utc(chartInfo.date_time_of_birth_utc).tz(chartInfo.location.timeZoneId)
//             const queryObj = {
//                 chartName: 'D1',
//                 date: localDateObj.format('YYYY-MM-DD'),
//                 time: localDateObj.format('hh:mm'),
//                 latitude: String(chartInfo.location.coordinates.lat),
//                 longitude: String(chartInfo.location.coordinates.lng),
//                 timezone: chartInfo.location.timeZoneId
//             }
//             // console.log("PData", queryObj);
//             //Call api to get d1, d2, d9, d10, vimshottari dasha
//
//             const response = await fetch('/api/getAllDivisionalData', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(queryObj),
//             });
//             const result = await response.json();
//             if (!result || !result.data) {
//                 throw Error('Data not found')
//             }
//
//             setChartProfileData(result.data);
//         }
//         fetchSelectedProfileData().then(() => {console.log("Fetched profile data")})
//     }, [chartInfo]);
//
//     if (!chartInfo) {
//         return <Spinner />;
//     }
//
//     return (
//         <>
//             {children}
//         </>
//     );
// }
