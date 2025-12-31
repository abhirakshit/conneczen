
import { create } from 'zustand';
import { CONSTANTS } from "@/lib/constants";

// Zustand store
export const useChartDataStore = create((set) => ({
    // States
    chartInfo: null, // Name Date Location
    transitD1ChartData: null, // Transit D1
    chartProfileData: null, //
    divisionalChartData: null,
    vedicAstroType: CONSTANTS.VEDIC_ASTRO_TYPES.PARASHARA,
    // trineSelection: 1,

    // Actions
    setChartInfo: (info) => set(() => ({ chartInfo: info })),
    // setTrineSelection: (selection) => set(() => ({ trineSelection: selection })),
    setDivisionalChartData: (info) => set(() => ({ divisionalChartData: info })),
    setTransitD1ChartData: (info) => set(() => ({ transitD1ChartData: info })),
    setChartProfileData: (profileData) => set(() => ({ chartProfileData: profileData })),
    setVedicAstroType: (type) => set(() => ({ vedicAstroType: type })),
}));

