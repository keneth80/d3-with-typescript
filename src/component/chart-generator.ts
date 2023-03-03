import {ChartConfiguration, Direction} from './chart/chart-configuration';
import {PlayChart} from './play-chart';
import {IFunctions} from './chart/functions.interface';
import {SeriesConfiguration} from './chart/series.interface';
import {IOptions} from './chart/options.interface';
import {makeSeriesByConfigurationType} from './chart/util/chart-util';
import {BasicCanvasMouseHandler} from './functions/basic-canvas-mouse-handler';
import {BasicCanvasMouseZoomHandler} from './functions/basic-canvas-mouse-zoom-handler';
import {BasicSvgMouseGuideLineHandler} from './functions/basic-svg-mouse-guide-line-handler';
import {BasicSvgMouseHandler} from './functions/basic-svg-mouse-handler';
import {BasicSpecArea} from './options/basic-svg-spec-area';
import {BasicStepArea} from './options/basic-svg-step-area';
import {BasicStepLine} from './options/basic-svg-step-line';
import {BaseConfiguration, OptionConfiguration} from './play-chart';
import {BasicTopology} from './series';
import {BasicAreaSeries, BasicAreaSeriesConfiguration} from './series/svg/basic-area-series';
import {BasicDonutSeries, BasicDonutSeriesConfiguration} from './series/svg/basic-donut-series';
import {GroupedHorizontalBarSeries, GroupedHorizontalBarSeriesConfiguration} from './series/svg/grouped-horizontal-bar-series';
import {GroupedVerticalBarSeries, GroupedVerticalBarSeriesConfiguration} from './series/svg/grouped-vertical-bar-series';
import {StackedHorizontalBarSeries, StackedHorizontalBarSeriesConfiguration} from './series/svg/stacked-horizontal-bar-series';
import {StackedVerticalBarSeries, StackedVerticalBarSeriesConfiguration} from './series/svg/stacked-vertical-bar-series';

export const SvgDonuttChart = (
    configuration: BaseConfiguration,
    series: BasicDonutSeriesConfiguration[] = [],
    options: OptionConfiguration[] = []
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((seriesConfiguration: BasicDonutSeriesConfiguration) => {
        return new BasicDonutSeries(seriesConfiguration);
    });

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new PlayChart(chartConfiguration);
};

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

// svg 시리즈 출력 설정정보 맵핑.
export const SvgGroupedBarChart = (
    configuration: BaseConfiguration,
    series: GroupedVerticalBarSeriesConfiguration | GroupedHorizontalBarSeriesConfiguration,
    options: OptionConfiguration[] = [],
    direction = Direction.VERTICAL
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = [direction === Direction.VERTICAL ? new GroupedVerticalBarSeries(series) : new GroupedHorizontalBarSeries(series)];

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new PlayChart(chartConfiguration);
};

export const SvgStackedBarChart = (
    configuration: BaseConfiguration,
    series: StackedVerticalBarSeriesConfiguration | StackedHorizontalBarSeriesConfiguration,
    options: OptionConfiguration[] = [],
    direction = Direction.VERTICAL
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = [direction === Direction.VERTICAL ? new StackedVerticalBarSeries(series) : new StackedHorizontalBarSeries(series)];

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new PlayChart(chartConfiguration);
};

export const SvgMultiSeriesChart = (
    configuration: BaseConfiguration,
    series: SeriesConfiguration[],
    options: OptionConfiguration[] = [],
    direction = Direction.VERTICAL
): PlayChart => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((seriesItem: SeriesConfiguration) => makeSeriesByConfigurationType(seriesItem)); // configuration type을 체크 해야함.

    chartConfiguration.options = generatorOptions(options);

    chartConfiguration.functions = generatorFunctions(configuration);

    return new PlayChart(chartConfiguration);
};

export const SvgTopology = (configuration: BaseConfiguration) => {
    const chartConfiguration: ChartConfiguration = generatorCommomConfiguration(configuration);
    chartConfiguration.series = [
        new BasicTopology({
            selector: 'topology'
        })
    ];

    return new PlayChart(chartConfiguration);
};

// 마우스 이벤트 같은 이벤트 함수설정 정보 맵핑.
export const generatorCanvasFunctions = (config: BaseConfiguration): IFunctions[] => {
    const functions: IFunctions[] = [];
    if (config.zoom) {
        functions.push(new BasicCanvasMouseZoomHandler(config.zoom));
    } else {
        functions.push(new BasicCanvasMouseHandler({isMoveEvent: true}));
    }
    return functions;
};

// 마우스 이벤트 같은 이벤트 함수설정 정보 맵핑.
export const generatorFunctions = (config: BaseConfiguration): IFunctions[] => {
    const functions: IFunctions[] = [];
    if (config.zoom) {
        config.zoom.delayTime = 50;
        // functions.push(new BasicSvgMouseZoomHandler(config.zoom));
        functions.push(new BasicCanvasMouseZoomHandler(config.zoom));
    } else {
        functions.push(
            new BasicSvgMouseHandler({
                isMoveEvent: true,
                delayTime: 50
            })
        );
    }

    if (config.mouseGuideLine) {
        functions.push(new BasicSvgMouseGuideLineHandler(config.mouseGuideLine));
    }

    return functions;
};

// external 기능 출력 설정정보 맵핑.
export const generatorOptions = (optionConfiguraions: OptionConfiguration[]): IOptions[] => {
    const options: IOptions[] = optionConfiguraions
        .map((option: OptionConfiguration) => {
            return retriveOptionClass(option.name, option.configuration);
        })
        .filter((option: IOptions) => option);

    return options;
};

// 공통부분 설정정보 맵핑
export const generatorCommomConfiguration = (configuration: BaseConfiguration): ChartConfiguration => {
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
        displayDelay: configuration.displayDelay
    };
    return chartConfiguration;
};

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
};
