// import {ChartConfiguration, Direction, SeriesConfiguration} from './component/chart';
// import {generatorCommomConfiguration, generatorFunctions, generatorOptions} from './component/chart-generator';
// import {makeSeriesByConfigurationType} from './component/chart/util/chart-util';
// import {BaseConfiguration, OptionConfiguration, PlayChart} from './component/play-chart';

// export const SvgMultiSeriesChart = (
//     configuration: BaseConfiguration,
//     series: SeriesConfiguration[],
//     options: OptionConfiguration[] = [],
//     direction = Direction.VERTICAL
// ): PlayChart => {
//     const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

//     chartConfiguration.series = series.map((seriesItem: SeriesConfiguration) => makeSeriesByConfigurationType(seriesItem)); // configuration type을 체크 해야함.

//     chartConfiguration.options = generatorOptions(options);

//     chartConfiguration.functions = generatorFunctions(configuration);

//     return new PlayChart(chartConfiguration);
// };
