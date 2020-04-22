import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';

import { ChartBase } from './chart-base';
import { Scale, ContainerSize } from '../chart/chart.interface';

declare interface IFunctions<T = any> {
    chartBase: ChartBase;

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number): void;

    drawFunctions(data: Array<T>, scales: Array<Scale>, geometry: ContainerSize): void;
}

declare class FunctionsBase implements IFunctions {
    chartBase: ChartBase;

    $currentItem: Observable<any>;

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
        mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number): void;

    drawFunctions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize): void;
}
