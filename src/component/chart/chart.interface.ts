import { Selection, BaseType } from 'd3-selection';
import { ChartConfiguration, AxisTitle } from './chart-configuration';

export enum DisplayType {
    NORMAL = 'normal',
    ZOOMIN = 'zoomin',
    ZOOMOUT = 'zoomout',
    RESIZE = 'resize'
}

export interface DisplayOption {
    index: number;
    color?: string;
    displayType?: DisplayType;
}

export interface ScaleValue {
    x: {
        min: number,
        max: number
    },
    y: {
        min: number,
        max: number
    }
}

export interface ChartItemEvent {
    type: string;
    position: [number, number];
    data: any;
    etc?: any;
    target?: Selection<BaseType, any, HTMLElement, any>;
}

export interface ChartMouseEvent {
    type: string;
    position: [number, number];
    target: Selection<BaseType, any, HTMLElement, any>;
}

export interface ChartZoomEvent extends ChartMouseEvent {
    zoom?: {
        direction: string,
        field: {
            x: string,
            y: string
        },
        start: {
            x: number,
            y: number
        },
        end: {
            x: number,
            y: number
        }
    }
}

export interface ISeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
}

export interface Scale {
    field: string;
    orient: string;
    scale: any;
    type: string;
    visible: boolean;
    tickFormat?: string;
    tickSize?: number;
    gridLine?: {
        color?: string;
        dasharray?: number;
        opacity?: number;
    };
    isZoom: boolean;
    min?: number;
    max?: number;
    title?: AxisTitle;
    tickTextParser?: any;
}

export interface ContainerSize {
    width: number;
    height: number;
}

export interface LegendItem {
    label: string;
    selected: boolean;
    isHide: boolean;
    shape: string;
}

export interface IChart {
    bootstrap(configuration: ChartConfiguration) :void;

    draw(): void;

    clear(): void;

    showTooltip(): Selection<BaseType, any, HTMLElement, any>;

    hideTooltip(): Selection<BaseType, any, HTMLElement, any>;

    showTooltipBySeriesSelector(selector: string): Selection<BaseType, any, HTMLElement, any>;

    hideTooltipBySeriesSelector(selector: string): Selection<BaseType, any, HTMLElement, any>;

    destroy(): void;
}
