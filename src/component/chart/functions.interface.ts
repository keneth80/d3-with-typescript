import { Selection, BaseType } from 'd3-selection';
import { ChartBase } from './chart-base';
import { Scale, ContainerSize } from '../chart/chart.interface';

export interface IFunctions<T = any> {
    chartBase: ChartBase;

    changeConfiguration(configuration: any): void;

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number): void;

    drawFunctions(data: Array<T>, scales: Array<Scale>, geometry: ContainerSize): void;

    destroy(): void;
}