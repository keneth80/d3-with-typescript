import {BaseType, Selection} from 'd3-selection';
import {Observable, Subject, Subscription} from 'rxjs';

import {ContainerSize, Scale} from '../chart/chart.interface';
import {ChartBase} from './chart-base';
import {IOptions} from './options.interface';

export class OptionsBase implements IOptions {
    selector: string;

    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<any, any, HTMLElement, any>;

    protected itemClickSubject: Subject<any> = new Subject();

    protected subscription: Subscription = new Subscription();

    private chart: ChartBase;

    constructor() {}

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

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {}

    drawOptions(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {}

    destroy() {
        this.subscription.unsubscribe();
    }
}
