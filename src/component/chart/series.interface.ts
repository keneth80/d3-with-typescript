import { Selection, BaseType } from 'd3-selection';
import { Scale, ChartBase } from './chart-base';

export interface SeriesConfiguration {
    selector?: string;
    displayName?: string;
}

export interface ISeries<T = any> {
    chartBase: ChartBase;

    displayName: string;

    selector: string;

    select(displayName: string): void;

    unselect(displayName: string): void;

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>): void;

    drawSeries(data: Array<T>, scales: Array<Scale>, width: number, height: number, index: number, sereisColor: string): void;
}