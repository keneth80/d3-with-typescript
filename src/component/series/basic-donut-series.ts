import { schemeDark2, interpolateSpectral } from 'd3-scale-chromatic';
import { Selection, BaseType } from 'd3-selection';
import { pie, arc } from 'd3-shape';
import { scaleOrdinal, } from 'd3-scale';
import { transition } from 'd3-transition';
import { quantize, interpolate } from 'd3-interpolate';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';

export interface BasicDonutSeriesConfiguration {
    selector?: string;
    categoryField: string;
    valueField: string;
}

export class BasicDonutSeries extends SeriesBase {
    private selector: string = 'donut';

    private categoryField: string;

    private valueField: string;

    private transition: any;

    private pieShape: any;

    private pieSeriesGroup: Selection<BaseType, any, HTMLElement, any>;

    private pieLabelGroup: Selection<BaseType, any, HTMLElement, any>;

    private pieLineGroup: Selection<BaseType, any, HTMLElement, any>;

    constructor(configuration: BasicDonutSeriesConfiguration) {
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

        this.pieSeriesGroup = this.mainGroup.append('g')
            .attr('class', `${this.selector}-pie-series-group`);

        this.pieLabelGroup = this.mainGroup.append('g')
            .attr('class', `${this.selector}-pie-label-group`);

        this.pieLineGroup = this.mainGroup.append('g')
            .attr('class', `${this.selector}-pie-line-group`);
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        const radius = Math.min(width, height) / 2;

        const arcs = this.pieShape(chartData);

        const color = scaleOrdinal()
            .domain(chartData.map(d => d[this.categoryField]))
            .range(quantize(t => interpolateSpectral(t * 0.8 + 0.1), chartData.length).reverse());

        const innerArc = arc()
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.4);

        const outerArc = arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        this.mainGroup.attr('transform', `translate(${width / 2},${height / 2})`);

        // ------- pie series -------
        const series = this.pieSeriesGroup.selectAll(`.${this.selector}-path`)
            .data(arcs, (d: any) => { return d.data[this.categoryField];})
            .join(
                (enter) => enter.append('path').attr('class', `${this.selector}-path`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('fill', (d: any) => color(d.data[this.categoryField]) + '');
        
        let currentSeries = null;
        series.transition()
            .duration(1000)
            .attrTween('d', (d: any) => {
                currentSeries = currentSeries || d;
                const interpolateMng = interpolate(currentSeries, d);
                currentSeries = interpolateMng(0);
                return (t: any) => {
                    return innerArc(interpolateMng(t));
                };
            });

        // ------- labels -------
        const labels = this.pieLabelGroup.selectAll(`.${this.selector}-label`)
            .data(arcs, (d: any) => { return d.data[this.categoryField];})
            .join(
                (enter) => enter.append('text').attr('class', `${this.selector}-label`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('dy', '.35em')
            .text((d: any) => {
                return d.data[this.categoryField];
            });

        let currentLabel = null;
        labels.transition().duration(1000)
            .attrTween('transform', (d: any) => {
                currentLabel = currentLabel || d;
                const interpolateMng = interpolate(currentLabel, d);
                currentLabel = interpolateMng(0);
                return (t: any) => {
                    const d2 = interpolateMng(t);
                    const pos = outerArc.centroid(d2);
                    pos[0] = radius * (this.midAngle(d2) < Math.PI ? 1 : -1);
                    return `translate(${pos})`;
                };
            })
            .styleTween('text-anchor', (d: any) => {
                currentLabel = currentLabel || d;
                const interpolateMng = interpolate(currentLabel, d);
                currentLabel = interpolateMng(0);
                return (t: any) => {
                    const d2 = interpolateMng(t);
                    return this.midAngle(d2) < Math.PI ? 'start' : 'end';
                };
            });
            
        // ------- poly lines -------
        const lines = this.pieLineGroup.selectAll(`.${this.selector}-line`)
            .data(arcs, (d: any) => { return d.data[this.categoryField];})
            .join(
                (enter) => enter.append('polyline').attr('class', `${this.selector}-line`),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('opacity', 0.5)
            .style('stroke', '#000')
            .style('stroke-width', 2)
            .style('fill', 'none');

        let currentLine = null;
        lines.transition().duration(1000)
            .attrTween('points', (d: any) => {
                currentLine = currentLine || d;
                const interpolateMng = interpolate(currentLine, d);
                currentLine = interpolateMng(0);
                return (t: any) => {
                    const d2 = interpolateMng(t);
                    const pos = outerArc.centroid(d2);
                    pos[0] = radius * 0.95 * (this.midAngle(d2) < Math.PI ? 1 : -1);
                    return [innerArc.centroid(d2), outerArc.centroid(d2), pos].toLocaleString();
                };			
            });
    }

    midAngle = (d: any) => {
		return d.startAngle + (d.endAngle - d.startAngle)/2;
	}
}