import { Selection, BaseType } from 'd3-selection';
import { ChartBase } from './chart-base';
import { Scale, ContainerSize } from '../chart/chart.interface';

export interface IFunctions<T = any> {
    chartBase: ChartBase;

    enable(data: T[], scales: Scale[], geometry: ContainerSize): void;

    disable(): void;

    changeConfiguration(configuration: any): void;

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number): void;

    drawFunctions(data: T[], scales: Scale[], geometry: ContainerSize): void;

    destroy(): void;
}