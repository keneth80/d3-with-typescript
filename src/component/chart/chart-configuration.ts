import { ISeries } from './series.interface';
import { IFunctions } from './functions.interface';
import { IOptions } from './options.interface';

export enum Direction {
    BOTH = 'both',
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical'
}

export enum Placement {
    TOP = 'top',
    BOTTOM = 'bottom',
    LEFT = 'left',
    RIGHT = 'right'
}

export enum ScaleType {
    NUMBER = 'number',
    TIME = 'time',
    STRING = 'string',
    POINT = 'point'
}

export enum Align {
    CENTER = 'center',
    LEFT = 'left',
    RIGHT = 'right',
    TOP = 'top',
    BOTTOM = 'bottom'
}

export enum Shape {
    LINE = 'line',
    RECT = 'rect',
    CIRCLE = 'circle',
    NONE = 'none'
}

export interface AxisTitle {
    align: string; // top, bottom, left, right, center default: center
    content: string; // title text
    style?: {
        size?: number;
        color?: string;
        font?: string;
    }
}

export interface Axes {
    field: any; // data propertie
    type: string; // default: number, option: number or string or point or time => number: scaleLinear, time: scaleTime, string: scaleBand, point: scalePoint for range
    placement: string; // position
    domain?: any[]; // axis texts
    padding?: number;
    visible?: boolean;
    isRound?: boolean; // nice() call 여부
    tickFormat?: any;
    tickTextParser?: any;
    tickSize?: number;
    zeroLine?: {
        color?: string;
    };
    gridLine?: {
        color?: string;
        dasharray?: number;
        opacity?: number;
    };
    isZoom?: boolean;
    min?: number; // only type is number
    max?: number;  // only type is number
    title?: AxisTitle;
}

export interface Margin {
    top?: number;

    left?: number;

    bottom?: number;

    right?: number;
}

export interface PlacementByElement {
    top: any;

    left: any;

    bottom: any;

    right: any;
}

export interface ChartTitle {
    placement: string; // top, bottom, left, right
    content: string; // title text
    style?: {
        size?: number;
        color?: string;
        font?: string;
    }
}

export interface ChartLegend {
    placement: string; // top, bottom, left, right
    isCheckBox?: boolean; // default: true
    isAll?: boolean; // default: true
    // shape?: string;
}

export interface ChartTooltip {
    tooltipTextParser?: any;
    visible?: boolean;
    isMultiple?: boolean; // default: false
    eventType?: string; // click or mouseover
}

export interface ChartStyle {
    backgroundColor?: string;
}

export interface ChartConfiguration<T = any> {
    selector: string;

    style?: ChartStyle;

    tooltip?: ChartTooltip;

    title?: ChartTitle; // chart title

    isResize?: boolean; // default: true

    legend?: ChartLegend; // legend display

    margin?: Margin; // custom margin

    axes?: Axes[]; // axis list

    series?: ISeries<T>[]; // series list

    functions?: IFunctions<T>[]; // function list

    options?: IOptions<T>[]; // function list

    data: T; // data

    colors?: string[]; // custom color (default: d3.schemeCategory10, size: 10)

    min?: number, // only type is number

    max?: number  // only type is number

    calcField?: string; // for only min max configration

    displayDelay?: {
        delayTime: number;
    }
}