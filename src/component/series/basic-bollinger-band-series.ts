import { Selection, BaseType } from 'd3-selection';
import { line, area } from 'd3-shape';
import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface BasicBollingerBandSeriesConfiguration {
    selector?: string;
    xField: string;
    style?: {
        stroke?: string;
        fill?: string;
    }
}

export interface BollingerBandModel {
    key: string;
    ma: number;
    low: number;
    high: number;
}

export class BasicBollingerBandSeries extends SeriesBase {
    private itemClass: string = 'basic-bollinger-band';

    private xField: string;

    constructor(configuration: BasicBollingerBandSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.itemClass = configuration.selector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }
        }
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

        const ma = line()
            .x((d: any) =>{ return x(d[this.xField]); })
            .y((d: any) =>{ return y(d.ma); });
        const lowBand = line()
            .x((d: any) =>{ return x(d[this.xField]); })
            .y((d: any) =>{ return y(d.low); });
        const highBand = line()
            .x((d: any) =>{ return x(d[this.xField]); })
            .y((d: any) =>{ return y(d.high); });
        const bandsArea = area()
            .x((d: any) =>{ return x(d[this.xField]); })
            .y0((d: any) =>{ return y(d.low); })
            .y1((d: any) =>{ return y(d.high); });

        // this.mainGroup.append('path')
        //     .datum(chartData)
        //     .attr('class', 'area bands')
        //     .attr('d', bandsArea);
        // this.mainGroup.append('path')
        //     .datum(chartData)
        //     .attr('class', 'bollinger-line bands')
        //     .attr('d', lowBand);
        // this.mainGroup.append('path')
        //     .datum(chartData)
        //     .attr('class', 'bollinger-line bands')
        //     .attr('d', highBand);
        // this.mainGroup.append('path')
        //     .datum(chartData)
        //     .attr('class', 'bollinger-line ma bands')
        //     .attr('d', ma);

        this.mainGroup.selectAll('.area.bands')
            .data([chartData])
            .join(
                (enter) => enter.append('path').attr('class', 'area bands')
            )
            .attr('d', bandsArea);
        this.mainGroup.selectAll('.bollinger-line.bands.low')
            .data([chartData])
            .join(
                (enter) => enter.append('path').attr('class', 'bollinger-line bands low')
            )
            .attr('d', lowBand);
        this.mainGroup.selectAll('.bollinger-line.bands.high')
            .data([chartData])
            .join(
                (enter) => enter.append('path').attr('class', 'bollinger-line bands high')
            )
            .attr('d', highBand);
        this.mainGroup.selectAll('.bollinger-line.ma.bands')
            .data([chartData])
            .join(
                (enter) => enter.append('path').attr('class', 'bollinger-line ma bands')
            )
            .attr('d', ma);
    }
}