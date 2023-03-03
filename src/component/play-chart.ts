import {ChartBase} from './chart/chart-base';
import {Axes, ChartConfiguration, ChartLegend, ChartStyle, ChartTitle, ChartTooltip, Margin} from './chart/chart-configuration';
import {BasicSvgMouseGuideLineHandlerConfiguration} from './functions';
import {BasicCanvasTraceConfiguration, BasicCanvasWebglLineSeriesOneConfiguration} from './series';

export interface OptionConfiguration {
    name: any;
    configuration: any;
}

export interface ZoomConfiguration {
    xDirection?: string; // bottom or top, default: bottom
    yDirection?: string; // left or right, default: left
    direction?: string; // horizontal or vertical or both, default: both
    delayTime?: number;
}

export interface BaseConfiguration {
    selector: string;

    style?: ChartStyle;

    tooltip?: ChartTooltip;

    title?: ChartTitle; // chart title

    isResize?: boolean; // default: true

    legend?: ChartLegend; // legend display

    margin?: Margin; // custom margin

    axes?: Axes[]; // axis list

    // functions?: any[]; // function list

    // options?: any[]; // function list

    data: any[]; // data

    colors?: string[]; // custom color (default: d3.schemeCategory10, size: 10)

    zoom?: ZoomConfiguration;

    mouseGuideLine?: BasicSvgMouseGuideLineHandlerConfiguration;

    options?: OptionConfiguration;

    displayDelay?: {
        delayTime: number;
    };
}

export interface CanvasTraceChartConfiguration extends BaseConfiguration {
    series: BasicCanvasTraceConfiguration[];
}

export interface WebglTraceChartConfiguration extends BaseConfiguration {
    series: BasicCanvasWebglLineSeriesOneConfiguration[];
}

export class PlayChart<T = any> extends ChartBase {
    protected originalData: T[];

    constructor(configuration: ChartConfiguration) {
        super(configuration);
    }

    bootstrap(configuration: ChartConfiguration) {
        super.bootstrap(configuration);
    }
}
