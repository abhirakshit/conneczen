
import { create } from 'zustand';
import { AstroConstants } from "@/lib/constants/astroConstants";

// Zustand store
export const useChartDataStore = create((set) => ({
    // States
    chartInfo: null, // Name Date Location
    transitD1ChartData: null, // Transit D1
    chartProfileData: null, //
    divisionalChartData: null,
    vedicAstroType: AstroConstants.VEDIC_ASTRO_TYPES.PARASHARA,
    // trineSelection: 1,

    // Actions
    setChartInfo: (info) => set(() => ({ chartInfo: info })),
    // setTrineSelection: (selection) => set(() => ({ trineSelection: selection })),
    setDivisionalChartData: (info) => set(() => ({ divisionalChartData: info })),
    setTransitD1ChartData: (info) => set(() => ({ transitD1ChartData: info })),
    setChartProfileData: (profileData) => set(() => ({ chartProfileData: profileData })),
    setVedicAstroType: (type) => set(() => ({ vedicAstroType: type })),
}));

