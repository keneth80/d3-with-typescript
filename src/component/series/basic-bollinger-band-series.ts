import { Selection, BaseType } from 'd3-selection';
import { line, area } from 'd3-shape';
import { mean } from 'd3-array';
import { Subject, Observable } from 'rxjs';

import { ISeries } from '../chart/series.interface';
import { Scale, ChartBase } from '../chart/chart-base';

export interface BasicBollingerBandSeriesConfiguration {
    selector?: string;
    xField: string;
    yField: string;
    style?: {
        stroke?: string;
        fill?: string;
    }
}

export interface BollingerBandModel {
    date: string;
    ma: number;
    low: number;
    high: number;
}

export class BasicBollingerBandSeries implements ISeries {
    protected svg: Selection<BaseType, any, HTMLElement, any>;

    protected mainGroup: Selection<BaseType, any, HTMLElement, any>;

    private itemClass: string = 'basic-bollinger-band';

    private itemClickSubject: Subject<any> = new Subject();

    private chart: ChartBase;

    private xField: string;

    constructor(configuration: BasicBollingerBandSeriesConfiguration) {
        if (configuration) {
            if (configuration.selector) {
                this.itemClass = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }
        }
    }

    set chartBase(value: ChartBase) {
        this.chart = value;
    }

    get chartBase() {
        return this.chart;
    }

    get currentItem(): Observable<any> {
        return this.itemClickSubject.asObservable();
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.itemClass}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.itemClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const x: any = scales.find((scale: Scale) => scale.orinet === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orinet === 'left').scale;
        const padding = x.bandwidth() / 2;

        const normalLine = line()
            .x((d: any) =>{ return x(d.date); })
            .y((d: any) =>{ return y(d.close); });
        const ma = line()
            .x((d: any) =>{ return x(d.date); })
            .y((d: any) =>{ return y(d.ma); });
        const lowBand = line()
            .x((d: any) =>{ return x(d.date); })
            .y((d: any) =>{ return y(d.low); });
        const highBand = line()
            .x((d: any) =>{ return x(d.date); })
            .y((d: any) =>{ return y(d.high); });
        const bandsArea = area()
            .x((d: any) =>{ return x(d.date); })
            .y0((d: any) =>{ return y(d.low); })
            .y1((d: any) =>{ return y(d.high); });


        this.mainGroup.append('path')
            .datum(chartData)
            .attr('class', 'area bands')
            .attr('d', bandsArea);
        this.mainGroup.append('path')
            .datum(chartData)
            .attr('class', 'line bands')
            .attr('d', lowBand);
        this.mainGroup.append('path')
            .datum(chartData)
            .attr('class', 'line bands')
            .attr('d', highBand);
        this.mainGroup.append('path')
            .datum(chartData)
            .attr('class', 'line ma bands')
            .attr('d', ma);

        // this.mainGroup.append('path')
        //     .datum(data)
        //     .attr('class', 'line')
        //     .attr('d', line);
    }

    // test 용
    getBollingerBands(n: number, k: number, data: Array<any>) {
        const bands = []; //{ ma: 0, low: 0, high: 0 }
        for (let i = n - 1, len = data.length; i < len; i++) {
            const slice = data.slice(i + 1 - n , i);
            let meanData = mean(slice, (d: any) => { return d.close; });
            const stdDev = Math.sqrt(mean(slice.map((d: any) =>{
                return Math.pow(d.close - meanData, 2);
            })));
            bands.push({ date: data[i].date,
                         ma: meanData,
                         low: meanData - (k * stdDev),
                         high: meanData + (k * stdDev) });
        }
        return bands;
    }
}