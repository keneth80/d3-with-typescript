import {format} from 'd3-format';
import {interpolate, quantize} from 'd3-interpolate';
import {scaleOrdinal} from 'd3-scale';
import {interpolateSpectral} from 'd3-scale-chromatic';
import {BaseType, select, Selection} from 'd3-selection';
import {arc, pie} from 'd3-shape';
import {transition} from 'd3-transition';
import {ChartSelector} from '../../chart';

import {ContainerSize, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';
import {colorDarker, isIE} from '../../chart/util/d3-svg-util';

export interface BasicDonutSeriesConfiguration extends SeriesConfiguration {
    selector?: string;
    categoryField: string;
    valueField: string;
}

export class BasicDonutSeries extends SeriesBase {
    private categoryField: string;

    private valueField: string;

    private transition: any;

    private pieShape: any;

    private pieSeriesGroup: Selection<BaseType, any, BaseType, any>;

    private pieLabelGroup: Selection<BaseType, any, BaseType, any>;

    private pieLineGroup: Selection<BaseType, any, BaseType, any>;

    private tooltipGroup: Selection<BaseType, any, BaseType, any>;

    private numberFmt: any;

    constructor(configuration: BasicDonutSeriesConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.categoryField) {
                this.categoryField = configuration.categoryField;
            }

            if (configuration.valueField) {
                this.valueField = configuration.valueField;
            }
        }

        this.numberFmt = format(',.4f');

        this.transition = transition().duration(750);
        // .ease(easeQuadIn);

        this.pieShape = pie()
            .padAngle(0.02)
            .sort(null)
            .value((d: any) => d[this.valueField]);
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
            this.pieSeriesGroup = this.mainGroup
                .selectAll(`.${this.selector}-pie-series-group`)
                .data([`${this.selector}-pie-series-group`])
                .join(
                    (enter) => enter.append('g').attr('class', `${this.selector}-pie-series-group`),
                    (update) => update,
                    (exite) => exite.remove()
                );

            this.pieLabelGroup = this.mainGroup
                .selectAll(`.${this.selector}-pie-label-group`)
                .data([`${this.selector}-pie-label-group`])
                .join(
                    (enter) => enter.append('g').attr('class', `${this.selector}-pie-label-group`),
                    (update) => update,
                    (exite) => exite.remove()
                );

            this.pieLineGroup = this.mainGroup
                .selectAll(`.${this.selector}-pie-line-group`)
                .data([`${this.selector}-pie-line-group`])
                .join(
                    (enter) => enter.append('g').attr('class', `${this.selector}-pie-line-group`),
                    (update) => update,
                    (exite) => exite.remove()
                );
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        this.svg.select('.' + ChartSelector.ZOOM_SVG).lower();
        const radius = Math.min(geometry.width, geometry.height) / 2;

        const arcs = this.pieShape(chartData);

        const colors = scaleOrdinal()
            .domain(chartData.map((d) => d[this.categoryField]))
            .range(quantize((t) => interpolateSpectral(t * 0.8 + 0.1), chartData.length).reverse());

        const innerArc = arc()
            .outerRadius(radius * 0.8)
            .innerRadius(radius * 0.4);

        const outerArc = arc()
            .innerRadius(radius * 0.9)
            .outerRadius(radius * 0.9);

        this.mainGroup.attr('transform', `translate(${geometry.width / 2},${geometry.height / 2})`);

        // ------- pie series -------
        const series = this.pieSeriesGroup
            .selectAll(`.${this.selector}-path`)
            .data(arcs, (d: any) => {
                return d.data[this.categoryField];
            })
            .join(
                (enter) => enter.append('path').attr('class', `${this.selector}-path`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('fill', (d: any) => colors(d.data[this.categoryField]) + '')
            .on('mouseover', (event: PointerEvent, d: any) => {
                const node = event.target as HTMLElement;
                if (node) {
                    select(node).style('fill', () => colorDarker(colors(d.data[this.categoryField]), 2)); // point
                    // .style('stroke', '#f5330c')
                    // .style('stroke-width', 2);

                    // this.tooltipGroup = this.chartBase.showTooltip();

                    // select(node).classed('tooltip', true);
                }
            })
            .on('mouseout', (event: PointerEvent, d: any) => {
                const node = event.target as HTMLElement;
                if (node) {
                    select(node).style('fill', () => colors(d.data[this.categoryField]) + ''); // point
                    // .style('stroke', null)
                    // .style('stroke-width', null);
                }

                // this.chartBase.hideTooltip();
                // select(node).classed('tooltip', false);
            })
            .on('mousemove', (event: PointerEvent, d: any) => {
                const textElement: any = this.tooltipGroup
                    .select('text')
                    .text(`${d.data[this.categoryField]}: ${this.numberFmt(d.data[this.valueField])}`);
                const textWidth = textElement.node().getComputedTextLength() + 10;

                let xPosition = event.x;
                let yPosition = event.offsetY - 30;

                if (isIE()) {
                    yPosition += geometry.height / 2;
                }

                // let yPosition = height / 2 - (event.clientY - rect.y);
                if (xPosition + textWidth > geometry.width) {
                    xPosition = xPosition - textWidth;
                }

                // this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`).selectAll('rect').attr('width', textWidth);
            });

        let currentSeries: any = null;
        series
            .transition()
            .duration(1000)
            .attrTween('d', (d: any) => {
                currentSeries = currentSeries ?? d;
                const interpolateMng = interpolate(currentSeries, d);
                currentSeries = interpolateMng(0);
                return (t: any) => {
                    return innerArc(interpolateMng(t));
                };
            });

        // ------- labels -------
        const labels = this.pieLabelGroup
            .selectAll(`.${this.selector}-label`)
            .data(arcs, (d: any) => {
                return d.data[this.categoryField];
            })
            .join(
                (enter) => enter.append('text').attr('class', `${this.selector}-label`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('dy', '.35em')
            .text((d: any) => {
                return d.data[this.categoryField];
            });

        let currentLabel: any = null;
        labels
            .transition()
            .duration(1000)
            .attrTween('transform', (d: any) => {
                currentLabel = currentLabel ?? d;
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
                currentLabel = currentLabel ?? d;
                const interpolateMng = interpolate(currentLabel, d);
                currentLabel = interpolateMng(0);
                return (t: any) => {
                    const d2 = interpolateMng(t);
                    return this.midAngle(d2) < Math.PI ? 'start' : 'end';
                };
            });

        // ------- poly lines -------
        const lines = this.pieLineGroup
            .selectAll(`.${this.selector}-line`)
            .data(arcs, (d: any) => {
                return d.data[this.categoryField];
            })
            .join(
                (enter) => enter.append('polyline').attr('class', `${this.selector}-line`),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('opacity', 0.5)
            .style('stroke', '#000')
            .style('stroke-width', 2)
            .style('fill', 'none');

        let currentLine: any = null;
        lines
            .transition()
            .duration(1000)
            .attrTween('points', (d: any) => {
                currentLine = currentLine ?? d;
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
        return d.startAngle + (d.endAngle - d.startAngle) / 2;
    };
}
