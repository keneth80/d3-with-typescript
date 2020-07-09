import { Selection, BaseType } from 'd3-selection';
import { ChartConfiguration, AxisTitle } from './chart-configuration';

export interface ChartMouseEvent {
    type: string;
    position: [number, number];
    target: Selection<BaseType, any, HTMLElement, any>
}

export interface ChartZoomEvent extends ChartMouseEvent {
    zoom?: {
        direction: string,
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
    isGridLine: boolean;
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

    showTooltip(): Selection<BaseType, any, HTMLElement, any>;

    hideTooltip(): Selection<BaseType, any, HTMLElement, any>;

    showTooltipBySeriesSelector(selector: string): Selection<BaseType, any, HTMLElement, any>;

    hideTooltipBySeriesSelector(selector: string): Selection<BaseType, any, HTMLElement, any>;

    destroy(): void;
}
