import { Selection, BaseType } from 'd3-selection';
import { Subject, Observable } from 'rxjs';

import { Scale, ContainerSize } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';

export interface BasicPlotSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    style?: {
        stroke?: string;
        fill?: string;
    },
    radius?: number;
}

export class BasicPlotSeries extends SeriesBase {
    private xField: string;

    private yField: string;

    private style: any;

    private radius: number = 4;

    constructor(configuration: BasicPlotSeriesConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.style) {
                this.style = configuration.style;
            }

            if (configuration.radius) {
                this.radius = configuration.radius;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        const x: any = scales.find((scale: Scale) => scale.orient === 'top').scale;
        const y: any = scales.find((scale: Scale) => scale.orient === 'left').scale;
        
        let padding = 0;
        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }
        
        const elements = this.mainGroup.selectAll(`.${this.selector}`)
            .data(chartData)
                .join(
                    (enter) => enter.append('circle').attr('class', this.selector)
                        .on('click', (data: any) => {
                            event.preventDefault();
                            event.stopPropagation();
                            this.itemClickSubject.next(data);
                        }),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('fill', this.style && this.style.fill || color)
                .style('stroke', this.style && this.style.stroke || '#fff')
                .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                .attr('cy', (data: any) => { return y(data[this.yField]); })
                .attr('r', this.radius);
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', !isHide ? null : 0);
    }
}