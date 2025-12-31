export const CONSTANTS = {
    // PLANET: "planet",
    // SIGN: "sign",
    // HOUSE: "house",

    COLOR_HOUSE_DEFAULT: "#F9F871",
    COLOR_HOUSE_SELECTED: "#FFC75F",
    COLOR_HOUSE_ASPECTED: "#de8123",

    // COLOR_PLANET_DEFAULT: "#000000",
    COLOR_PLANET_DEFAULT: "#000000",
    COLOR_PLANET_SELECTED: "#07eae1",
    COLOR_PLANET_ASPECTING: "#e0268c",
    COLOR_PLANET_ASPECTED: "#70c925",
    COLOR_PLANET_CONJUNCT: "#5d13ab",

    COLOR_PLANET_DARK: {
        DEFAULT: '#FFFFFF'
    },

    COLOR_PLANET_LIGHT: {
        DEFAULT: '#000000'
    },

    COLOR_TEXT_DEFAULT: "#000000",

    CHART_OPTIONS_CHART_DIVISIONAL_TYPES: [
        // {"type": "BC", "name": "Bhava Chalit", "num": -1},
        {"type": "d1", "name": "Rashi", "num": 1},
        {"type": "d2", "name": "Hora", "num": 2},
        // {"type": "D3", "name": "Drekkana", "num": 3},
        // {"type": "D4", "name": "Chaturthamsa", "num": 4},
        // {"type": "D7", "name": "Saptamsa", "num": 7},
        {"type": "d9", "name": "Navamsa", "num": 9},
        {"type": "d10", "name": "Dashamsa", "num": 10},
        // {"type": "D12", "name": "Dwadasamsa", "num": 12},
        // {"type": "D16", "name": "Shodasamsa", "num": 16},
        // {"type": "D20", "name": "Vimsamsa", "num": 20},
        // {"type": "D24", "name": "Chaturvimsamsa", "num": 24},
        // {"type": "D27", "name": "Saptavimsamsa", "num": 27},
        // {"type": "D30", "name": "Trimsamsa", "num": 30},
        // {"type": "D40", "name": "Khavedamsa", "num": 40},
        // {"type": "D45", "name": "Akshavedamsa", "num": 45},
        // {"type": "D60", "name": "Shastiamsa", "num": 60}
    ],

    VEDIC_ASTRO_TYPES: {
        PARASHARA: 'Parashara',
        JAIMINI: 'Jaimini',
        BHRIGU_NANDI_NADI: 'Bhrigu Nandi Nadi',
    },

    CHART_OPTIONS_CHART_TYPES: {
      RASHI: 'Rashi',
      DIVISIONAL: 'Divisional',
      TRANSIT: 'Transit',
    },

    CHART_OPTIONS_CHART_ORIENTATION: {
        ASCENDANT: 'Ascendant',
        SUN: 'Sun',
        MOON: 'Moon'
    },

    PLANETS: {
        SUN: 'Sun',
        MOON: 'Moon',
        MARS: 'Mars',
        MERCURY: 'Mercury',
        JUPITER: 'Jupiter',
        VENUS: 'Venus',
        SATURN: 'Saturn',
        RAHU: 'Rahu',
        KETU: 'Ketu',
        ASCENDANT: 'Ascendant'
    },

    ELEMENTS: {
        FIRE: 'fire',
        EARTH: 'earth',
        AIR: 'air',
        WATER: 'water',
    },

    SELECTION_TYPE: {
        DATE: 'date',
        PLANET: 'planet',
        SIGN: 'Sign',
        HOUSE: 'House',
    }
}
