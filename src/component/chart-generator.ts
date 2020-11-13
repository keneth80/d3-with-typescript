import { BasicChart } from './basic-chart';
import { ChartConfiguration,
         Direction
} from './chart/chart-configuration';

import { IFunctions } from './chart/functions.interface';

import { SeriesConfiguration } from './chart/series.interface';

import { BasicCanvasTraceConfiguration, BasicCanvasTrace } from './series/canvas/basic-canvas-trace';
import { BasicCanvasWebglLineSeriesOneConfiguration, BasicCanvasWebgLineSeriesOne } from './series/webgl/basic-canvas-webgl-line-series-one';

import { BasicCanvasMouseZoomHandler } from './functions/basic-canvas-mouse-zoom-handler';
import { BasicCanvasMouseHandler } from './functions/basic-canvas-mouse-handler';
import { IOptions } from './chart/options.interface';
import { BasicSpecArea } from './options/basic-svg-spec-area';
import { BasicStepLine } from './options/basic-svg-step-line';
import { BasicStepArea } from './options/basic-svg-step-area';
import { BasicLineSeries, BasicLineSeriesConfiguration } from './series';
import { BasicSvgMouseZoomHandler } from './functions/basic-svg-mouse-zoom-handler';
import { BasicSvgMouseHandler } from './functions/basic-svg-mouse-handler';
import { GroupedVerticalBarSeriesConfiguration, GroupedVerticalBarSeries } from './series/svg/grouped-vertical-bar-series';
import { GroupedHorizontalBarSeriesConfiguration, GroupedHorizontalBarSeries } from './series/svg/grouped-horizontal-bar-series';
import { StackedHorizontalBarSeriesConfiguration, StackedHorizontalBarSeries } from './series/svg/stacked-horizontal-bar-series';
import { StackedVerticalBarSeriesConfiguration, StackedVerticalBarSeries } from './series/svg/stacked-vertical-bar-series';
import { MiccBaseConfiguration, OptionConfiguration, ZoomConfiguration } from './mi-chart';
import { BasicAreaSeries, BasicAreaSeriesConfiguration } from './series/svg/basic-area-series';
import { BasicSvgMouseGuideLineHandler } from './functions/basic-svg-mouse-guide-line-handler';

/*
* desc: 캔버스 시리즈 출력 설정정보 맵핑.
* argument:
* 1. configuration: chart 설정정보
* 2. series: 출력되는 시리즈 설정정보
* 3. options: 시리즈 외에 출력되는 시리즈 설정정보
*/
export const CanvasTraceChart = (
    configuration: MiccBaseConfiguration,
    series: BasicCanvasTraceConfiguration[] = [],
    options: OptionConfiguration[] = []
): BasicChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicCanvasTraceConfiguration) => {
        return new BasicCanvasTrace(traceConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorCanvasFunctions(configuration.zoom);

    return new BasicChart(chartConfiguration);
}

// webgl 시리즈 출력 설정정보 맵핑.
export const WebglTraceChart = (
    configuration: MiccBaseConfiguration,
    series: BasicCanvasWebglLineSeriesOneConfiguration[] = [],
    options: OptionConfiguration[] = []
): BasicChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicCanvasWebglLineSeriesOneConfiguration) => {
        return new BasicCanvasWebgLineSeriesOne(traceConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorCanvasFunctions(configuration.zoom);

    return new BasicChart(chartConfiguration);
}

// svg 시리즈 출력 설정정보 맵핑.
export const SvgTraceChart = (
    configuration: MiccBaseConfiguration,
    series: BasicLineSeriesConfiguration[] = [],
    options: OptionConfiguration[] = []
): BasicChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicLineSeriesConfiguration) => {
        return new BasicLineSeries(traceConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new BasicChart(chartConfiguration);
}

export const SvgAreaChart = (
    configuration: MiccBaseConfiguration,
    series: BasicAreaSeriesConfiguration[] = [],
    options: OptionConfiguration[] = []
): BasicChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicAreaSeriesConfiguration) => {
        return new BasicAreaSeries(traceConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new BasicChart(chartConfiguration);
}

// svg 시리즈 출력 설정정보 맵핑.
export const SvgGroupedBarChart = (
    configuration: MiccBaseConfiguration,
    series: GroupedVerticalBarSeriesConfiguration | GroupedHorizontalBarSeriesConfiguration,
    options: OptionConfiguration[] = [],
    direction = Direction.VERTICAL
): BasicChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = [
        direction === Direction.VERTICAL ? new GroupedVerticalBarSeries(series) : new GroupedHorizontalBarSeries(series)
    ];

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new BasicChart(chartConfiguration);
}

export const SvgStackedBarChart = (
    configuration: MiccBaseConfiguration,
    series: StackedVerticalBarSeriesConfiguration | StackedHorizontalBarSeriesConfiguration,
    options: OptionConfiguration[] = [],
    direction = Direction.VERTICAL
): BasicChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = [
        direction === Direction.VERTICAL ? new StackedVerticalBarSeries(series) : new StackedHorizontalBarSeries(series)
    ];

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new BasicChart(chartConfiguration);
}

export const SvgMultiSeriesChart = (
    configuration: MiccBaseConfiguration,
    series: SeriesConfiguration[],
    options: OptionConfiguration[] = [],
    direction = Direction.VERTICAL
): BasicChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = []; // configuration type을 체크 해야함.

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new BasicChart(chartConfiguration);
}

// 마우스 이벤트 같은 이벤트 함수설정 정보 맵핑.
export const generatorCanvasFunctions = (
    zoom?: ZoomConfiguration
): IFunctions[] => {
    const functions: IFunctions[] = [];
    if (zoom) {
        functions.push(new BasicCanvasMouseZoomHandler(zoom));
    } else {
        functions.push(new BasicCanvasMouseHandler({isMoveEvent: true}));
    }
    return functions;
}

// 마우스 이벤트 같은 이벤트 함수설정 정보 맵핑.
export const generatorFunctions = (
    config: MiccBaseConfiguration
): IFunctions[] => {
    const functions: IFunctions[] = [];
    if (config.zoom) {
        config.zoom.delayTime = 50;
        functions.push(new BasicSvgMouseZoomHandler(config.zoom));
    } else {
        functions.push(new BasicSvgMouseHandler({
            isMoveEvent: true,
            delayTime: 50
        }));
    }

    if (config.mouseGuideLine) {
        functions.push(new BasicSvgMouseGuideLineHandler(config.mouseGuideLine));
    }

    return functions;
}

// external 기능 출력 설정정보 맵핑.
export const generatorOptions = (
    optionConfiguraions: OptionConfiguration[]
): IOptions[] => {
    const options: IOptions[] = optionConfiguraions.map((option: OptionConfiguration) => {
        return retriveOptionClass(option.name, option.configuration)
    }).filter((option: IOptions) => option);

    return options;
}

// 공통부분 설정정보 맵핑
export const generatorCommomConfiguration = (
    configuration: MiccBaseConfiguration
): ChartConfiguration => {
    const chartConfiguration: ChartConfiguration = {
        selector: configuration.selector,
        style: configuration.style,
        tooltip: configuration.tooltip,
        title: configuration.title,
        isResize: configuration.isResize,
        legend: configuration.legend,
        margin: configuration.margin,
        axes: configuration.axes,
        data: configuration.data,
        displayDelay: configuration.displayDelay,
    }
    return chartConfiguration;
}

export const retriveOptionClass = (className: string, configuration: any): IOptions => {
    let optionItem: IOptions;
    if (className === 'BasicSpecArea') {
        optionItem = new BasicSpecArea(configuration);
    } else if (className === 'BasicStepLine') {
        optionItem = new BasicStepLine(configuration);
    } else if (className === 'BasicStepArea') {
        optionItem = new BasicStepArea(configuration);
    } else {
        if (console && console.log) {
            console.log('not support option => ', className);
        }
    }
    return optionItem;
}
