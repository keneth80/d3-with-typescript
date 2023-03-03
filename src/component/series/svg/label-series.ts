import {BaseType, Selection} from 'd3-selection';

import {ContainerSize, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';

export interface LabelSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    templete?: any;
}

export class LabelSeries extends SeriesBase {
    private templete: any;

    private config: LabelSeriesConfiguration;

    constructor(configuration: LabelSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        if (configuration.templete) {
            this.templete = configuration.templete;
        }
    }

    xField() {
        return this.config.xField;
    }

    yField() {
        return this.config.yField;
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
        this.mainGroup
            .selectAll(`.${this.selector}`)
            .data(chartData)
            .join(
                (enter) => enter.append('text').attr('class', this.selector),
                (update) => update,
                (exit) => exit.remove
            )
            .attr('x', (data: any) => {
                return x(data[this.config.xField]);
            })
            .attr('y', (data: any) => {
                return y(data[this.config.yField]) - 7;
            })
            .text((data: any) => {
                let returnText = `${this.yField}: ${data[this.config.yField]}`;
                if (this.templete) {
                    returnText = this.templete(data);
                }
                return returnText;
            });
    }
}
