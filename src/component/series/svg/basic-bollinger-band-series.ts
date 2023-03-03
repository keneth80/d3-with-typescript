import {BaseType, Selection} from 'd3-selection';
import {area, line} from 'd3-shape';

import {ContainerSize, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';

export interface BasicBollingerBandSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    style?: {
        stroke?: string;
        fill?: string;
    };
}

export interface BollingerBandModel {
    key: string;
    ma: number;
    low: number;
    high: number;
}

export class BasicBollingerBandSeries extends SeriesBase {
    private config: BasicBollingerBandSeriesConfiguration;

    constructor(configuration: BasicBollingerBandSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
    }

    xField(): any {
        return this.config.xField;
    }

    yField(): any {
        return null;
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === this.xDirection).scale;
        const y: any = scales.find((scale: Scale) => scale.orient === this.yDirection).scale;

        const ma = line()
            .x((d: any) => {
                return x(d[this.config.xField]);
            })
            .y((d: any) => {
                return y(d.ma);
            });
        const lowBand = line()
            .x((d: any) => {
                return x(d[this.config.xField]);
            })
            .y((d: any) => {
                return y(d.low);
            });
        const highBand = line()
            .x((d: any) => {
                return x(d[this.config.xField]);
            })
            .y((d: any) => {
                return y(d.high);
            });
        const bandsArea = area()
            .x((d: any) => {
                return x(d[this.config.xField]);
            })
            .y0((d: any) => {
                return y(d.low);
            })
            .y1((d: any) => {
                return y(d.high);
            });

        this.mainGroup
            .selectAll('.area.bands')
            .data([chartData])
            .join((enter) => enter.append('path').attr('class', 'area bands'))
            .attr('d', bandsArea);
        this.mainGroup
            .selectAll('.bollinger-line.bands.low')
            .data([chartData])
            .join((enter) => enter.append('path').attr('class', 'bollinger-line bands low'))
            .attr('d', lowBand);
        this.mainGroup
            .selectAll('.bollinger-line.bands.high')
            .data([chartData])
            .join((enter) => enter.append('path').attr('class', 'bollinger-line bands high'))
            .attr('d', highBand);
        this.mainGroup
            .selectAll('.bollinger-line.ma.bands')
            .data([chartData])
            .join((enter) => enter.append('path').attr('class', 'bollinger-line ma bands'))
            .attr('d', ma);
    }
}
