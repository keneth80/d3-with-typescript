import { Selection, BaseType, select, event } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { format } from 'd3-format';
import { transition } from 'd3-transition';

import { Subject, Observable } from 'rxjs';

import { Scale } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { colorDarker, textBreak } from '../chart/util/d3-svg-util';

export interface BasicLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    dot?: {
        radius?: number,
        isCurve: boolean // default : false
    }
    colors?: string[];
    style?: {
        strokWidth?: number;
        stroke?: string;
        fill?: string;
    },
    filter?: any;
    animation?: boolean;
}

export class BasicLineSeries extends SeriesBase {
    protected dotGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private dotClass: string = 'basic-line-dot';

    private xField: string;

    private yField: string;

    private isDot: boolean = false;

    private colors: string[] = [];

    private radius: number = 4;

    private isCurve: boolean = false;

    private dataFilter: any;

    private strokeWidth: number = 2;

    private numberFmt: any;

    private isAnimation: boolean = false;

    private transition: any;

    constructor(configuration: BasicLineSeriesConfiguration) {
        super();
        if (configuration) {
            if (configuration.selector) {
                this.selector = configuration.selector;
            }

            if (configuration.displayName) {
                this.displayName = configuration.displayName;
            }

            if (configuration.dotSelector) {
                this.dotClass = configuration.dotSelector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.dot) {
                this.isDot = true;
                this.radius = configuration.dot.radius || 4;
                this.isCurve = configuration.dot.isCurve === true ? true : false;
            }

            if (configuration.filter) {
                this.dataFilter = configuration.filter;
            }

            if (configuration.style) {
                this.strokeWidth = configuration.style.strokWidth || this.strokeWidth;
            }

            if (configuration.hasOwnProperty('animation')) {
                this.isAnimation = configuration.animation;
            }
        }

        this.numberFmt = format(',d');

        this.transition = transition().delay(500)
        .duration(1000);
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select(`.${this.dotClass}-group`).node()) {
            this.dotGroup = mainGroup.append('g').attr('class', `${this.dotClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, width: number, height: number, index: number, color: string) {
        
        if (this.isAnimation) {
            this.mainGroup.attr('transform', `translate(${-width}, 0)`);
            if (this.isDot) {
                this.dotGroup.attr('transform', `translate(${-width}, 0)`);
            }
        }

        const x: any = scales.find((scale: Scale) => scale.field === this.xField).scale;
        const y: any = scales.find((scale: Scale) => scale.field === this.yField).scale;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        this.line = line()
            .defined(data => data[this.yField])
            .x((data: any, i) => {
                return x(data[this.xField]) + padding; 
            }) // set the x values for the line generator
            .y((data: any) => { 
                return y(data[this.yField]); 
            }); // set the y values for the line generator

        if (this.isCurve) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        const lineData = !this.dataFilter ? chartData : chartData.filter((item: any) => this.dataFilter(item));

        this.mainGroup.selectAll(`.${this.selector}`)
            .data([lineData])
                .join(
                    (enter) => enter.append('path').attr('class', this.selector),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('stroke-width', this.strokeWidth)
                .style('stroke', color)
                .style('fill', 'none')
                .attr('d', this.line);

        if (this.isDot) {
            const dots = this.dotGroup.selectAll(`.${this.dotClass}`)
                .data(lineData)
                    .join(
                        (enter) => enter.append('circle').attr('class', this.dotClass)
                            .on('click', (data: any) => {
                                event.preventDefault();
                                event.stopPropagation();
                                this.itemClickSubject.next(data);
                            }),
                        (update) => update,
                        (exit) => exit.remove
                    )
                    .style('stroke-width', this.radius / 2)
                    .style('stroke', color)
                    .style('fill', '#fff')
                    .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                    .attr('cy', (data: any) => { return y(data[this.yField]); })
                    .attr('r', this.radius);
            if (this.chartBase.tooltip) {
                dots
                    .on('mouseover', (d: any, i, nodeList: any) => {
                        select(nodeList[i]).attr('r', this.radius * 2);
                            // .style('fill', () => colorDarker(color, 2)); // point

                        this.tooltipGroup = this.chartBase.showTooltip();
                        select(nodeList[i]).classed('tooltip', true);
                    })
                    .on('mouseout', (d: any, i, nodeList: any) => {
                        select(nodeList[i])
                            .attr('r', this.radius) // point
                            // .style('stroke', null)
                            // .style('stroke-width', null);

                        this.chartBase.hideTooltip();
                        select(nodeList[i]).classed('tooltip', false);
                    })
                    .on('mousemove', (d: any, i: number, nodeList: any) => {
                        const textElement: any = this.tooltipGroup.select('text').attr('dy', '0em').text(
                            this.chartBase.tooltip.tooltipTextParser(d)
                        );

                        textBreak(textElement, '\n');

                        const parseTextNode = textElement.node().getBoundingClientRect();

                        const textWidth = parseTextNode.width + 5;
                        const textHeight = parseTextNode.height + 5;
                        
                        let xPosition = event.x;
                        // let yPosition = event.offsetY + this.chartBase.chartMargin.top;
                        let yPosition = event.offsetY + this.radius * 2;
                        if (xPosition + textWidth > width) {
                            xPosition = xPosition - textWidth;
                        }
                        this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`)
                            .selectAll('rect')
                            .attr('width', textWidth)
                            .attr('height', textHeight);
                    });
            }   
            this.dotGroup.transition(this.transition).attr('transform', `translate(0, 0)`);
        }

        if (this.isAnimation) {
            this.mainGroup.transition(this.transition).attr('transform', `translate(0, 0)`);
        }
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', isSelected ? null : 0.4);
        if (this.isDot) {
            this.dotGroup.selectAll(`.${this.dotClass}`).style('opacity', isSelected ? null : 0.4);
        }
    }

    hide(displayName: string, isHide: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', !isHide ? null : 0);
        if (this.isDot) {
            this.dotGroup.selectAll(`.${this.dotClass}`).style('opacity', !isHide ? null : 0);
        }
    }
}