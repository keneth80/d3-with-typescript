import { Selection, BaseType, select, event, mouse } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { format } from 'd3-format';
import { transition } from 'd3-transition';
import { easeLinear, easeCircle } from 'd3-ease';

import { Subject, Observable } from 'rxjs';

import { Scale, ContainerSize, DisplayOption } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';
import { textBreak, isIE, getTextWidth } from '../../chart/util/d3-svg-util';

export interface BasicLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    dot?: {
        radius?: number
    }
    style?: {
        strokeWidth?: number;
        // stroke?: string;
        // fill?: string;
    },
    filter?: any;
    crossFilter?: {
        filerField: string;
        filterValue: string;
    };
    animation?: boolean;
}

export class BasicLineSeries extends SeriesBase {
    protected dotGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private seriespGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private dotClass: string = 'basic-line-dot';

    private xField: string;

    private yField: string;

    private config: BasicLineSeriesConfiguration;

    private dataFilter: any;

    private strokeWidth: number = 2;

    private numberFmt: any;

    private isAnimation: boolean = false;

    private currentSelector: any;

    private defaultRadius: number = 4;

    private isHide: boolean = false;

    private crossFilterDimension: any = undefined;

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
                this.strokeWidth = configuration.style.strokeWidth || this.strokeWidth;
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
        
        this.seriespGroup = mainGroup;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select(`.${this.dotClass}-group`).node()) {
            this.dotGroup = mainGroup.append('g').attr('class', `${this.dotClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, option: DisplayOption) {
        
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

        if (this.config.isCurve === true) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        // if (this.config.crossFilter) {
        //     this.crossFilterDimension = this.chartBase.crossFilter(chartData).dimension((item: any) => item[this.config.crossFilter.filerField]);
        // } else {
        //     if (this.crossFilterDimension) {
        //         this.crossFilterDimension.dispose();
        //     }
        //     this.crossFilterDimension = undefined;
        // }

        // const lineData = this.crossFilterDimension ? this.crossFilterDimension.filter(this.config.crossFilter.filterValue).top(Infinity) : 
        // !this.dataFilter ? chartData : chartData.filter((item: any) => this.dataFilter(item));

        const lineData = !this.dataFilter ? chartData : chartData.filter((item: any) => this.dataFilter(item));

        // const lineData = !this.dataFilter ? chartData : chartData.filter((item: any) => this.dataFilter(item));

        const lineSeries = this.mainGroup.selectAll(`.${this.selector}`)
            .data([lineData])
                .join(
                    (enter) => enter.append('path').attr('class', this.selector),
                    (update) => update,
                    (exit) => exit.remove
                )
                .style('stroke-width', this.strokeWidth)
                .style('stroke', option.color)
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
            const radius = (this.config.dot.radius || this.defaultRadius);

            // dot설정이 있을 시 에는 mask 영역 늘리기
            this.chartBase.clipPathSelector
                .attr('width', geometry.width + (radius * 4))
                .attr('height', geometry.height + (radius * 4))
                .attr('x', -(radius*2))
                .attr('y', -(radius*2));

            const dots = this.dotGroup.selectAll(`.${this.dotClass}`)
                .data(lineData)
                    .join(
                        (enter) => enter.append('circle').attr('class', this.dotClass)
                            .on('click', (data: any, index: number, nodeList: any) => {
                                event.preventDefault();
                                event.stopPropagation();
                                this.itemClickSubject.next({
                                    data,
                                    target: nodeList[index],
                                    event
                                });
                            }),
                        (update) => update,
                        (exit) => exit.remove
                    )
                    .style('stroke-width', radius / 2)
                    .style('stroke', option.color)
                    .style('fill', '#fff')
                    .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                    .attr('cy', (data: any) => { return y(data[this.yField]); })
                    .attr('r', radius);
            
            if (this.chartBase.tooltip) {
                if (!this.chartBase.tooltip.eventType || this.chartBase.tooltip.eventType === 'click') {
                    dots
                    .on('click', (d: any, i, nodeList: any) => {
                        event.preventDefault();
                        event.stopPropagation();

                        if (this.isHide) {
                            return;
                        }

                        if (this.currentSelector) {
                            this.currentSelector.attr('r', radius);
                        }
                        this.setChartTooltip(d, geometry, radius);
                        this.currentSelector = select(nodeList[i]);
                        this.currentSelector.attr('r', radius * 1.7);
                    });
                } else {
                    dots
                    .on('mouseover', (d: any, i, nodeList: any) => {
                        event.preventDefault();
                        event.stopPropagation();

                        if (this.isHide) {
                            return;
                        }

                        select(nodeList[i]).attr('r', radius * 1.7);
                            // .style('fill', () => colorDarker(color, 2)); // point

                        this.setChartTooltip(d, geometry, radius);
                        select(nodeList[i]).classed('tooltip', true);
                    })
                    .on('mouseout', (d: any, i, nodeList: any) => {
                        event.preventDefault();
                        event.stopPropagation();

                        if (this.isHide) {
                            return;
                        }

                        select(nodeList[i])
                            .attr('r', radius) // point
                            // .style('stroke', null)
                            // .style('stroke-width', null);

                        this.chartBase.hideTooltip();
                        select(nodeList[i]).classed('tooltip', false);
                    });
                }
            }
        }
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', isSelected ? null : 0.4);
        if (this.config.dot) {
            this.dotGroup.selectAll(`.${this.dotClass}`).style('opacity', isSelected ? null : 0.4);
        }
    }

    hide(displayName: string, isHide: boolean) {
        this.isHide = isHide;
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', !isHide ? null : 0);
        
        // TODO: 좌표를 바꿀지 뎁스를 뒤로 보낼지 나중에 고민해볼 것.
        if (this.isHide) {
            this.mainGroup.lower();
        } else {
            this.mainGroup.raise();
        }

        if (this.config.dot) {
            if (this.isHide) {
                this.dotGroup.lower();
            } else {
                this.dotGroup.raise();
            }
            this.dotGroup.selectAll(`.${this.dotClass}`).style('opacity', !isHide ? null : 0);
        }
    }

    unSelectItem() {
        const radius = (this.config.dot && this.config.dot.radius || this.defaultRadius);
        if (this.currentSelector) {
            this.currentSelector.attr('r', radius);
            this.currentSelector = null;
        }
    }

    private setChartTooltip(d: any, geometry: ContainerSize, radius: number) {
        this.tooltipGroup = this.chartBase.showTooltip();
    
        const textElement: any = this.tooltipGroup.select('text').attr('dy', '.1em').text(
            this.chartBase.tooltip.tooltipTextParser(d)
        );

        textBreak(textElement, '\n');

        // const parseTextNode = textElement.node().getBoundingClientRect();
        const parseTextNode = textElement.node().getBBox();

        // console.log('check : ', getTextWidth('Canvas Line Chart', 16, 'Arial, Helvetica, sans-serif'), getTextWidth('Canvas Line Chart', 16, select('body').style('font-family')));

        const textWidth = parseTextNode.width + 7;
        const textHeight = parseTextNode.height + 5;
        
        const padding = radius * 2 + 5;
        let xPosition = event.offsetX + padding + (isIE() ? this.chartBase.chartMargin.left : 0);
        let yPosition = event.offsetY + padding + (isIE() ? this.chartBase.chartMargin.top : 0);
        
        if (xPosition + textWidth > geometry.width) {
            xPosition = xPosition - textWidth;
        }

        if (yPosition + textHeight > geometry.height) {
            yPosition = yPosition - textHeight - radius * 2;
        }

        this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`)
            .selectAll('rect')
            .attr('width', textWidth)
            .attr('height', textHeight);

        this.itemClickSubject.next({
            data: d,
            event: {
                offsetX: xPosition,
                offsetY: yPosition
            },
            target: {
                width: radius,
                height: radius
            }
        });
    }
}