import { Selection, BaseType } from 'd3-selection';
import { arc, line, curveLinear } from 'd3-shape';
import { scaleLinear } from 'd3-scale';
import { range } from 'd3-array';
import { easeElastic } from 'd3-ease';
import { interpolateHsl } from 'd3-interpolate';
import { format } from 'd3-format';
import { color, rgb } from 'd3-color';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';

export interface BasicGaugeSeriesConfiguration extends SeriesConfiguration {
    clipWidth: number;
    clipHeight: number;
    ringInset?: number;
    ringWidth: number;
    pointerWidth?: number;
    pointerTailLength?: number;
    pointerHeadLengthPercent?: number;
    minValue: number;
    maxValue: number;
    minAngle?: number;
    maxAngle?: number;
    transitionMs: number;
    majorTicks?: number;
    labelFormat?: any;
    labelInset?: number;
    colors?: Array<string>;
}

export class BasicGaugeSeries extends SeriesBase {
    private selector: string = 'gauge';

    private arcGroup: any;

    private labelGroup: any;

    private pointerGroup: any;

    private config = {
        clipWidth: 200,
        clipHeight: 110,
        ringInset: 20,
        ringWidth: 20,
        pointerWidth: 10,
        pointerTailLength: 5,
        pointerHeadLengthPercent: 0.9,
        minValue: 0,
        maxValue: 10,
        minAngle: -90,
        maxAngle: 90,
        transitionMs: 750,
        majorTicks: 5,
        labelFormat: format('d'),
        labelInset: 10,
        colors: ['#e8e2ca', '#3e6c0a']
    };

    private range = undefined;
    private r = undefined;
    private pointerHeadLength = undefined;
    private arc = undefined;
    private scale = undefined;
    private ticks = undefined;
    private tickData = undefined;
    private pointer = undefined;
    private arcColorFn = interpolateHsl(rgb('#e8e2ca'), rgb('#3e6c0a'));

    constructor(configuration: BasicGaugeSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.selector = configuration.selector;
            }

            let prop: string = undefined;
            for (prop in configuration) {
                this.config[prop] = configuration[prop];
            }

            if (this.config.colors) {
                this.arcColorFn = interpolateHsl(rgb(this.config.colors[0]), rgb(this.config.colors[1]));
            }

            this.range = this.config.maxAngle - this.config.minAngle;

            this.scale = scaleLinear().range([0, 1]).domain([this.config.minValue, this.config.maxValue]);

            this.ticks = this.scale.ticks(this.config.majorTicks);

            this.tickData = range(this.config.majorTicks);

            this.tickData = range(this.config.majorTicks).map(() => {
                return 1 / this.config.majorTicks;
            });
        }

    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        svg.select('.series-group').attr('clip-path', null);
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
            this.arcGroup = mainGroup.append('g').attr('class', `${this.selector}-arc-group`);
            this.labelGroup = mainGroup.append('g').attr('class', `${this.selector}-label-group`);
            this.pointerGroup = mainGroup.append('g').attr('class', `${this.selector}-pointer-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number) {
        this.r = height;
        this.pointerHeadLength = Math.round(this.r * this.config.pointerHeadLengthPercent);

        this.arc = arc()
            .innerRadius(this.r - this.config.ringWidth - this.config.ringInset)
            .outerRadius(this.r - this.config.ringInset)
            .startAngle((d, i) => {
                const ratio = +d * i;
                return this.deg2rad(this.config.minAngle + (ratio * this.range));
            })
            .endAngle((d, i) => {
                const ratio = +d * (i + 1);
                return this.deg2rad(this.config.minAngle + (ratio * this.range));
            });

        this.arcGroup.selectAll(`.${this.selector}-path`)
            .data(this.tickData)
            .join(
                (enter) => enter.append('path').attr('class', `${this.selector}-path`),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('fill', (d, i) => {
                return this.arcColorFn(d * i);
            })
            .attr('d', this.arc);

        this.labelGroup.selectAll(`.${this.selector}-label`)
            .data(this.ticks)
            .join(
                (enter) => enter.append('text').attr('class', `${this.selector}-label`),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#aaa')
            .attr('transform', (d) => {
                const ratio = this.scale(d);
                const newAngle = this.config.minAngle + (ratio * this.range);
                return `rotate(${newAngle}) translate(0, ${this.config.labelInset - this.r})`;
            })
            .text(this.config.labelFormat);

        const lineData = [
            [this.config.pointerWidth / 2, 0],
            [0, -this.pointerHeadLength],
            [-(this.config.pointerWidth / 2), 0],
            [0, this.config.pointerTailLength],
            [this.config.pointerWidth / 2, 0]
        ];

        const pointerLine = line().curve(curveLinear);

        const elementWidth = (this.svg.select('g.series-group').node() as any).getBBox().width;

        const svgWidth = parseFloat(this.svg.style('width'));

        this.svg.select('g.series-group').attr('transform', `translate(${elementWidth / 2}, ${this.r / 2})`);

        const centerTx = this.centerTransition(elementWidth, svgWidth, this.r);

        this.arcGroup.attr('transform', centerTx);

        this.labelGroup.attr('transform', centerTx);

        const pg = this.pointerGroup.selectAll(`.${this.selector}-pointer`)
                .data([lineData])
                .join(
                    (enter) => enter.append('g').attr('class', `${this.selector}-pointer`),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .style('fill', '#e85116')
                .style('stroke', '#b64011')
                .attr('transform', centerTx);

        if (!this.pointer) {
            this.pointer = pg.append('path');
        }

        this.pointer
            .attr('d', pointerLine)
            .attr('transform', `rotate(${this.config.minAngle})`);

        const mainRatio = this.scale(chartData[0] === undefined ? 0: chartData[0]);
        const newAngle = this.config.minAngle + (mainRatio * this.range);

        this.pointer.transition()
            .duration(this.config.transitionMs)
            .ease(easeElastic)
            .attr('transform', 'rotate(' +newAngle +')');
    }

    private deg2rad(deg: number) {
      return deg * Math.PI / 180;
    }

    private centerTransition(elementWidth: number, svgWidth: number, r: number) {
        const x = svgWidth / 2 - elementWidth / 2;
        return `translate(${x}, ${r / 2})`
    }
    
}