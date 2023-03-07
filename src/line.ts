import {ChartConfiguration} from './component/chart';
import {generatorCanvasFunctions, generatorCommomConfiguration, generatorFunctions, generatorOptions} from './component/chart-generator';
import {BaseConfiguration, OptionConfiguration, PlayChart} from './component/play-chart';
import {
    BasicAreaSeries,
    BasicAreaSeriesConfiguration,
    BasicCanvasTrace,
    BasicCanvasTraceConfiguration,
    BasicCanvasWebgLineSeriesOne,
    BasicCanvasWebglLineSeriesOneConfiguration,
    BasicLineSeries,
    BasicLineSeriesConfiguration
} from './component/series';

export const SvgAreaChart = (
    configuration: BaseConfiguration,
    series: BasicAreaSeriesConfiguration[] = [],
    options: OptionConfiguration[] = []
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicAreaSeriesConfiguration) => {
        return new BasicAreaSeries(traceConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new PlayChart(chartConfiguration);
};

/*
 * desc: 캔버스 시리즈 출력 설정정보 맵핑.
 * argument:
 * 1. configuration: chart 설정정보
 * 2. series: 출력되는 시리즈 설정정보
 * 3. options: 시리즈 외에 출력되는 시리즈 설정정보
 */
export const CanvasTraceChart = (
    configuration: BaseConfiguration,
    series: BasicCanvasTraceConfiguration[] = [],
    options: OptionConfiguration[] = []
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicCanvasTraceConfiguration) => {
        return new BasicCanvasTrace(traceConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorCanvasFunctions(configuration);

    return new PlayChart(chartConfiguration);
};

// webgl 시리즈 출력 설정정보 맵핑.
export const WebglTraceChart = (
    configuration: BaseConfiguration,
    series: BasicCanvasWebglLineSeriesOneConfiguration[] = [],
    options: OptionConfiguration[] = []
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicCanvasWebglLineSeriesOneConfiguration) => {
        return new BasicCanvasWebgLineSeriesOne(traceConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorCanvasFunctions(configuration);

    return new PlayChart(chartConfiguration);
};

// svg 시리즈 출력 설정정보 맵핑.
export const SvgTraceChart = (
    configuration: BaseConfiguration,
    series: BasicLineSeriesConfiguration[] = [],
    options: OptionConfiguration[] = []
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicLineSeriesConfiguration) => {
        return new BasicLineSeries(traceConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new PlayChart(chartConfiguration);
};
