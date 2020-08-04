import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable, Subscription } from 'rxjs';

import { ChartBase } from './chart-base';
import { Scale, ContainerSize } from '../chart/chart.interface';
import { IFunctions } from './functions.interface';

export class FunctionsBase implements IFunctions {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    protected itemClickSubject: Subject<any> = new Subject();

    protected subscription: Subscription = new Subscription();

    private chart: ChartBase;

    constructor() { }

    set chartBase(value: ChartBase) {
        this.chart = value;
    }

    get chartBase() {
        return this.chart;
    }

    get $currentItem(): Observable<any> {
        return this.itemClickSubject.asObservable();
    }

    changeConfiguration(configuration: any) {
        
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
        mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {

    }

    drawFunctions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {

    }

    destroy() {
        this.subscription.unsubscribe();
    }
}