// import {generatorCommomConfiguration, generatorFunctions, generatorOptions} from './component/chart-generator';
// import {ChartConfiguration, Direction} from './component/chart/chart-configuration';
// import {BaseConfiguration, OptionConfiguration, PlayChart} from './component/play-chart';
// import {
//     StackedHorizontalBarSeries,
//     StackedHorizontalBarSeriesConfiguration,
//     StackedVerticalBarSeries,
//     StackedVerticalBarSeriesConfiguration
// } from './component/series';
// import {GroupedHorizontalBarSeries, GroupedHorizontalBarSeriesConfiguration} from './component/series/svg/grouped-horizontal-bar-series';
// import {GroupedVerticalBarSeries, GroupedVerticalBarSeriesConfiguration} from './component/series/svg/grouped-vertical-bar-series';

// // svg 시리즈 출력 설정정보 맵핑.
// export const SvgGroupedBarChart = (
//     configuration: BaseConfiguration,
//     series: GroupedVerticalBarSeriesConfiguration | GroupedHorizontalBarSeriesConfiguration,
//     options: OptionConfiguration[] = [],
//     direction = Direction.VERTICAL
// ): PlayChart => {
//     const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

//     chartConfiguration.series = [direction === Direction.VERTICAL ? new GroupedVerticalBarSeries(series) : new GroupedHorizontalBarSeries(series)];

//     chartConfiguration.options = generatorOptions(options);

//     chartConfiguration.functions = generatorFunctions(configuration);

//     return new PlayChart(chartConfiguration);
// };

// export const SvgStackedBarChart = (
//     configuration: BaseConfiguration,
//     series: StackedVerticalBarSeriesConfiguration | StackedHorizontalBarSeriesConfiguration,
//     options: OptionConfiguration[] = [],
//     direction = Direction.VERTICAL
// ): PlayChart => {
//     const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

//     chartConfiguration.series = [direction === Direction.VERTICAL ? new StackedVerticalBarSeries(series) : new StackedHorizontalBarSeries(series)];

//     chartConfiguration.options = generatorOptions(options);

//     chartConfiguration.functions = generatorFunctions(configuration);

//     return new PlayChart(chartConfiguration);
// };
