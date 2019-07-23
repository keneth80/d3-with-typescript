import { Selection, BaseType } from 'd3-selection';
import { pie, arc } from 'd3-shape';
import { scaleOrdinal, } from 'd3-scale';
import { transition } from 'd3-transition';
import { quantize } from 'd3-interpolate';
import { interpolateSpectral } from 'd3-scale-chromatic';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface BasicPieSeriesConfiguration {
    selector?: string;
    categoryField: string;
    valueField: string;
    innerRadius?: number;
    isLabel?: boolean;
}

export class BasicPieSeries extends SeriesBase {
    private selector: string = 'pie';

    private categoryField: string;

    private valueField: string;

    private transition: any;

    private pieShape: any;

    private innerRadius: number = 0;

    private isLabel: boolean = true;

    constructor(configuration: BasicPieSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.selector = configuration.selector;
            }

            if (configuration.categoryField) {
                this.categoryField = configuration.categoryField;
            }

            if (configuration.valueField) {
                this.valueField = configuration.valueField;
            }

            if (configuration.innerRadius) {
                this.innerRadius = configuration.innerRadius;
            }

            if (configuration.isLabel) {
                this.isLabel = true;
            }
        }

        this.transition = transition()
        .duration(750);
        // .ease(easeQuadIn);

        this.pieShape = pie()
            .sort(null)
            .value((d: any) => d[this.valueField]);
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const radius = Math.min(width, height) / 2 - 40;

        const color = scaleOrdinal()
            .domain(chartData.map(d => d[this.categoryField]))
            .range(quantize(t => interpolateSpectral(t * 0.8 + 0.1), chartData.length).reverse());

        const arcShape = arc()
            // .innerRadius(radius * 0.5)
            // .outerRadius(radius * 0.5);
            .innerRadius(this.innerRadius * 0.5)
            .outerRadius(Math.min(width, height) / 2 - 1 * 0.5);

        const arcs = this.pieShape(chartData);

        this.mainGroup.attr('transform', `translate(${width / 2},${height / 2})`);

        this.mainGroup.selectAll(`.${this.selector}-path`)
            .data(arcs)
            .join(
                (enter) => enter.append('path').attr('class', `${this.selector}-path`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('fill', (d: any) => color(d.data[this.categoryField]) + '')
            .attr('stroke', 'white')
            .attr('d', arcShape)
                .selectAll('title')
                .data((d: any) => {
                    return [d];
                })
                .join(
                    (enter) => enter.append('title').attr('class', `${this.selector}-title`),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .text((d: any) => `${d.data[this.categoryField]}: ${d.data[this.valueField].toLocaleString()}`);

        if (this.isLabel) {
            const radius = Math.min(width, height) / 2 * 0.8;
            const arcLabel = arc().innerRadius(radius).outerRadius(radius);
    
            const texts = this.mainGroup.selectAll(`.${this.selector}-label`)
                .data(arcs)
                .join(
                    (enter) => enter.append('text').attr('class', `${this.selector}-label`),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('transform', (d: any) => `translate(${arcLabel.centroid(d)})`)
                .attr('dy', '0.35em')
    
                
            texts.selectAll('tspan.label')
                .data((d: any) => [d])
                .join(
                    (enter) => enter.append('tspan').attr('class', 'label'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x', 0)
                .attr('y', '-0.7em')
                .style('font-size', 13)
                .style('font-weight', 'bold')
                .text((d: any) => d.data[this.categoryField]);
            
            texts.filter((d: any) => (d.endAngle - d.startAngle) > 0.25)
                .selectAll('tspan.value')
                .data((d: any) => [d])
                .join(
                    (enter) => enter.append('tspan').attr('class', 'value'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x', 0)
                .attr('y', '0.7em')
                .style('fill-opacity', 0.7)
                .style('font-size', 11)
                .text((d: any) => d.data[this.valueField].toLocaleString());
        }
    }
}