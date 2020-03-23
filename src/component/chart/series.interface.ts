import { Selection, BaseType } from 'd3-selection';
import { Scale, ChartBase } from './chart-base';

export interface ISeries<T = any> {
    chartBase: ChartBase;

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>): void;

    drawSeries(data: Array<T>, scales: Array<Scale>, width: number, height: number): void;
}