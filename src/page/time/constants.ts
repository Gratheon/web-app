export const LS_KEYS = {
	SELECTED_APIARY: 'timeView.selectedApiaryId',
	SELECTED_HIVES: 'timeView.selectedHiveIds',
	ENABLED_CHARTS: 'timeView.enabledCharts',
	SHOW_IDEAL_CURVE: 'timeView.showIdealCurve',
	FILTERS_EXPANDED: 'timeView.filtersExpanded',
}

export const DEFAULT_ENABLED_CHARTS = {
	population: true,
	weight: true,
	temperature: true,
	entrance: true,
	entranceSpeed: true,
	entranceDetected: true,
	entranceStationary: true,
	entranceInteractions: true,
	weather: true,
	weatherTemperature: true,
	wind: true,
	rain: true,
	solarRadiation: true,
	cloudCover: true,
	pollen: true,
	pollution: true,
}

export type EnabledCharts = typeof DEFAULT_ENABLED_CHARTS
