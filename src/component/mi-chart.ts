import { BasicChart } from './basic-chart';
import { ChartConfiguration, 
         ChartTooltip, ChartTitle, ChartLegend,
         Direction,
         Margin, Axis,  } from './chart/chart-configuration';

import { IFunctions } from './chart/functions.interface';

import { BasicCanvasTraceConfiguration, BasicCanvasTrace } from './series/canvas/basic-canvas-trace';
import { BasicCanvasWebglLineSeriesOneConfiguration, BasicCanvasWebgLineSeriesOne } from './series/webgl/basic-canvas-webgl-line-series-one';

import { BasicCanvasMouseZoomHandler } from './functions/basic-canvas-mouse-zoom-handler';
import { BasicCanvasMouseHandler } from './functions/basic-canvas-mouse-handler';
import { IOptions } from './chart/options.interface';
import { BasicSpecArea } from './options/basic-svg-spec-area';
import { BasicStepLine } from './options/basic-svg-step-line';
import { BasicStepArea } from './options/basic-svg-step-area';
import { BasicLineSeries, BasicLineSeriesConfiguration } from './series';

export interface OptionConfiguration {
    name: any;
    configuration: any;
}

export interface ZoomConfiguration {
    xDirection?: string; // bottom or top, default: bottom
    yDirection?: string; // left or right, default: left
    direction?: string; // horizontal or vertical or both, default: both
}

export interface MiccBaseConfiguration {
    selector: string;

    tooltip?: ChartTooltip;

    title?: ChartTitle; // chart title

    isResize?: boolean; // default: true

    legend?: ChartLegend; // legend display

    margin?: Margin; // custom margin

    axes?: Array<Axis>; // axis list
    
    // functions?: Array<any>; // function list

    // options?: Array<any>; // function list

    data: Array<any>; // data

    colors?: Array<string>; // custom color (default: d3.schemeCategory10, size: 10)

    zoom?: ZoomConfiguration;

    options?: OptionConfiguration;
}

export interface CanvasTraceChartConfiguration extends MiccBaseConfiguration {
    series: Array<BasicCanvasTraceConfiguration>;
}

export interface WebglTraceChartConfiguration extends MiccBaseConfiguration {
    series: Array<BasicCanvasWebglLineSeriesOneConfiguration>;
}

export class MiChart {
    /*
    * desc: 캔버스 시리즈 출력 설정정보 맵핑.
    * argument: 
    * 1. configuration: chart 설정정보
    * 2. series: 출력되는 시리즈 설정정보
    * 3. options: 시리즈 외에 출력되는 시리즈 설정정보
    */
    static CanvasTraceChart(
        configuration: MiccBaseConfiguration, 
        series: Array<BasicCanvasTraceConfiguration> = [],
        options: Array<OptionConfiguration> = []): BasicChart {

        const chartConfiguration: ChartConfiguration = MiChart.generatorCommomConfiguration(configuration);

        chartConfiguration.series = series.map((traceConfiguration: BasicCanvasTraceConfiguration) => {
            return new BasicCanvasTrace(traceConfiguration);
        });

        chartConfiguration.options = MiChart.generatorOptions(options);

        chartConfiguration.functions = MiChart.generatorCanvasFunctions(configuration.zoom);

        return new BasicChart(chartConfiguration);
    }

    // webgl 시리즈 출력 설정정보 맵핑.
    static WebglTraceChart(
        configuration: MiccBaseConfiguration, 
        series: Array<BasicCanvasWebglLineSeriesOneConfiguration> = [],
        options: Array<OptionConfiguration> = []): BasicChart {

        const chartConfiguration: ChartConfiguration = MiChart.generatorCommomConfiguration(configuration);

        chartConfiguration.series = series.map((traceConfiguration: BasicCanvasWebglLineSeriesOneConfiguration) => {
            return new BasicCanvasWebgLineSeriesOne(traceConfiguration);
        });

        chartConfiguration.options = MiChart.generatorOptions(options);

        chartConfiguration.functions = MiChart.generatorCanvasFunctions(configuration.zoom);
        
        return new BasicChart(chartConfiguration);
    }

    // webgl 시리즈 출력 설정정보 맵핑.
    static SvgTraceChart(
        configuration: MiccBaseConfiguration, 
        series: Array<BasicCanvasWebglLineSeriesOneConfiguration> = [],
        options: Array<OptionConfiguration> = []): BasicChart {

    const chartConfiguration: ChartConfiguration = MiChart.generatorCommomConfiguration(configuration);

    chartConfiguration.series = series.map((traceConfiguration: BasicLineSeriesConfiguration) => {
        return new BasicLineSeries(traceConfiguration);
    });

    chartConfiguration.options = MiChart.generatorOptions(options);

    chartConfiguration.functions = MiChart.generatorFunctions(configuration.zoom);
    
    return new BasicChart(chartConfiguration);
}

    // 마우스 이벤트 같은 이벤트 함수설정 정보 맵핑.
    static generatorCanvasFunctions(
        zoom?: ZoomConfiguration
    ): Array<IFunctions> {
        const functions: Array<IFunctions> = [];
        if (zoom) {
            functions.push(new BasicCanvasMouseZoomHandler(zoom));
        } else {
            functions.push(new BasicCanvasMouseHandler({isMoveEvent: true}));
        }
        return functions;
    }

    // 마우스 이벤트 같은 이벤트 함수설정 정보 맵핑.
    static generatorFunctions(
        zoom?: ZoomConfiguration
    ): Array<IFunctions> {
        const functions: Array<IFunctions> = [];
        if (zoom) {
            functions.push(new BasicCanvasMouseZoomHandler(zoom));
        }
        return functions;
    }

    // external 기능 출력 설정정보 맵핑.
    static generatorOptions(
        optionConfiguraions: Array<OptionConfiguration>
    ): Array<IOptions> {

        const options: Array<IOptions> = optionConfiguraions.map((option: OptionConfiguration) => {
            return MiChart.retriveOptionClass(option.name, option.configuration)
        }).filter((option: IOptions) => option);

        return options;
    }

    // 공통부분 설정정보 맵핑
    static generatorCommomConfiguration(configuration: MiccBaseConfiguration): ChartConfiguration {
        const chartConfiguration: ChartConfiguration = {
            selector: configuration.selector,
            tooltip: configuration.tooltip,
            title: configuration.title,
            isResize: configuration.isResize,
            legend: configuration.legend,
            margin: configuration.margin,
            axes: configuration.axes,
            data: configuration.data
        }
        return chartConfiguration;
    }

    static retriveOptionClass(className: string, configuration: any): IOptions {
        let optionItem: IOptions = undefined;
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
}