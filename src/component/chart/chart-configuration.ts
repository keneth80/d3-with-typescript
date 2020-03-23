import { ISeries } from "./series.interface";
import { IFunctions } from "./functions.interface";

export interface Axis {
    field: any; // data propertie
    type: string; // default: number, option: number or string or point or time => number: scaleLinear, time: scaleTime, string: scaleBand, point: scalePoint for range
    placement: string; // position
    domain?: Array<any>;
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

export interface ChartConfiguration<T = any> {
    selector: string;

    isResize?: string; // 'Y' or 'N'

    margin?: Margin;

    axes?: Array<Axis>;

    series?: Array<ISeries<T>>;
    
    functions?: Array<IFunctions<T>>;

    data: T;

    min?: number, // only type is number

    max?: number  // only type is number

    calcField?: string; // for only min max configration
}