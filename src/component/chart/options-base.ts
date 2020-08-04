import { select, Selection, BaseType } from 'd3-selection';
import { Subject, Observable, Subscription } from 'rxjs';

import { ChartBase } from './chart-base';
import { Scale, ContainerSize } from '../chart/chart.interface';
import { IOptions } from './options.interface';
import { guid } from './util/d3-svg-util';

export class OptionsBase implements IOptions {
    selector: string;

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

    changeConfiguration(configuration: any) {}

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
        mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {

    }

    drawOptions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {

    }

    destroy() {
        this.subscription.unsubscribe();
    }
}