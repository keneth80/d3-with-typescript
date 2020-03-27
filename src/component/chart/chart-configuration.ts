import { ISeries } from './series.interface';
import { IFunctions } from './functions.interface';

export enum Placement {
    TOP = 'top',
    BOTTOM = 'bottom',
    LEFT = 'left',
    RIGHT = 'right'
}

export interface Axis {
    field: any; // data propertie
    type: string; // default: number, option: number or string or point or time => number: scaleLinear, time: scaleTime, string: scaleBand, point: scalePoint for range
    placement: string; // position
    domain?: Array<any>; // axis texts
    padding?: number;
    visible?: boolean;
    isRound?: boolean; // nice() call 여부
    tickFormat?: string;
    isGridLine?: boolean;
    isZoom?: boolean;
    min?: number, // only type is number
    max?: number  // only type is number
}

export interface Margin {
    top?: number;

    left?: number;

    bottom?: number;

    right?: number;
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

export interface ChartConfiguration<T = any> {
    selector: string;

    title?: ChartTitle; // chart title

    isResize?: string; // 'Y' or 'N'

    legend?: ChartLegend; // legend display

    margin?: Margin; // custom margin

    axes?: Array<Axis>; // axis list

    series?: Array<ISeries<T>>; // series list
    
    functions?: Array<IFunctions<T>>; // function list

    data: T; // data

    min?: number, // only type is number

    max?: number  // only type is number

    calcField?: string; // for only min max configration

    colors?: Array<string>; // custom color (default: d3.schemeCategory10, size: 10)
}