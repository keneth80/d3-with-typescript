import { Selection, BaseType, select, event, mouse } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { format } from 'd3-format';
import { transition } from 'd3-transition';
import { easeLinear, easeCircle } from 'd3-ease';

import { Subject, Observable } from 'rxjs';

import { Scale, ContainerSize } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { textBreak } from '../chart/util/d3-svg-util';

export interface BasicLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    dot?: {
        radius?: number,
        isCurve: boolean // default : false
    }
    style?: {
        strokWidth?: number;
        // stroke?: string;
        // fill?: string;
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

    private config: BasicLineSeriesConfiguration;

    private dataFilter: any;

    private strokeWidth: number = 2;

    private numberFmt: any;

    private isAnimation: boolean = false;

    private transition: any;

    constructor(configuration: BasicLineSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        if (configuration) {
            if (configuration.dotSelector) {
                this.dotClass = configuration.dotSelector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
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

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        
        // if (this.isAnimation) {
        //     this.mainGroup.attr('transform', `translate(${-width}, 0)`);
        //     if (this.config.dot) {
        //         this.dotGroup.attr('transform', `translate(${-width}, 0)`);
        //     }
        // }

        const x: any = scales.find((scale: Scale) => scale.field === this.xField).scale;
        const y: any = scales.find((scale: Scale) => scale.field === this.yField).scale;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        this.line = line()
            .defined(data => data[this.yField])
            .x((data: any, i) => {
                const xposition = x(data[this.xField]) + padding;
                return xposition; 
            }) // set the x values for the line generator
            .y((data: any) => {
                const yposition = y(data[this.yField]);
                return yposition; 
            }); // set the y values for the line generator

        if (this.config.dot && this.config.dot.isCurve) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        const lineData = !this.dataFilter ? chartData : chartData.filter((item: any) => this.dataFilter(item));

        const lineSeries = this.mainGroup.selectAll(`.${this.selector}`)
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

        if (this.isAnimation) {
            lineSeries
            .attr('stroke-dasharray', (d: any, i: number, nodeList: any) => nodeList[i].getTotalLength())
            .attr('stroke-dashoffset', (d: any, i: number, nodeList: any) => nodeList[i].getTotalLength());

            lineSeries.transition(
                transition().delay(500).duration(1000).ease(easeLinear)
            ).attr('stroke-dashoffset', 0);
        }

        if (this.config.dot) {
            const radius = (this.config.dot.radius || 4);
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
                    .style('stroke-width', radius / 2)
                    .style('stroke', color)
                    .style('fill', '#fff')
                    .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                    .attr('cy', (data: any) => { return y(data[this.yField]); })
                    .attr('r', this.isAnimation ? 0 : radius);

            if (this.isAnimation) {
                dots.transition(transition().delay(1500).duration(500).ease(easeCircle)).attr('r', radius);
            }
            if (this.chartBase.tooltip) {
                dots
                    .on('mouseover', (d: any, i, nodeList: any) => {
                        select(nodeList[i]).attr('r', radius * 2);
                            // .style('fill', () => colorDarker(color, 2)); // point

                        this.tooltipGroup = this.chartBase.showTooltip();
                        select(nodeList[i]).classed('tooltip', true);
                    })
                    .on('mouseout', (d: any, i, nodeList: any) => {
                        select(nodeList[i])
                            .attr('r', radius) // point
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
                        
                        const padding = radius * 2 + 5;
                        let xPosition = event.offsetX + padding;
                        // let yPosition = event.offsetY + this.chartBase.chartMargin.top;
                        let yPosition = event.offsetY + padding;

                        
                        if (xPosition + textWidth > geometry.width) {
                            xPosition = xPosition - textWidth;
                        }

                        // const rect = nodeList[index].getBoundingClientRect();
                        // xPosition = event.pageX - rect.left - nodeList[index].clientLeft - window.pageXOffset + padding;
                        // yPosition = event.pageY - rect.top - nodeList[index].clientTop - window.pageYOffset + padding;

                        this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`)
                            .selectAll('rect')
                            .attr('width', textWidth)
                            .attr('height', textHeight);
                    });
            }   
            // this.dotGroup.transition(this.transition).attr('transform', `translate(0, 0)`);
        }

        // if (this.isAnimation) {
        //     this.mainGroup.transition(this.transition).attr('transform', `translate(0, 0)`);
        // }
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', isSelected ? null : 0.4);
        if (this.config.dot) {
            this.dotGroup.selectAll(`.${this.dotClass}`).style('opacity', isSelected ? null : 0.4);
        }
    }

    hide(displayName: string, isHide: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', !isHide ? null : 0);
        if (this.config.dot) {
            this.dotGroup.selectAll(`.${this.dotClass}`).style('opacity', !isHide ? null : 0);
        }
    }
}