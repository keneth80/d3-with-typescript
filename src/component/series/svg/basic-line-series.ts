import { Selection, BaseType, select, event, mouse } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { format } from 'd3-format';
import { transition } from 'd3-transition';
import { easeLinear, easeCircle } from 'd3-ease';
import { quadtree, Quadtree } from 'd3-quadtree';

import { Subject, Observable } from 'rxjs';

import { Scale, ContainerSize, DisplayOption, ChartMouseEvent } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';
import { textBreak, isIE, getTextWidth, delayExcute } from '../../chart/util/d3-svg-util';
import { Placement } from '../../chart/chart-configuration';
import { ChartBase } from '../../chart';

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

    protected selectionGroup: Selection<BaseType, any, HTMLElement, any>;

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

    private isHide: boolean = false;

    private crossFilterDimension: any = undefined;

    private radius = 4;

    private lineColor: string = '';

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

            this.radius = this.config.dot.radius || this.radius;
        }

        this.numberFmt = format(',d');
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        
        this.seriespGroup = mainGroup;
        this.selectionGroup = this.svg.select('.' + ChartBase.SELECTION_SVG);
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select(`.${this.dotClass}-group`).node()) {
            this.dotGroup = mainGroup.append('g').attr('class', `${this.dotClass}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize, option: DisplayOption) {
        
        const x: any = scales.find((scale: Scale) => scale.orient === Placement.BOTTOM).scale;
        const y: any = scales.find((scale: Scale) => scale.orient === Placement.LEFT).scale;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        this.geometry = geometry;

        this.lineColor = option.color;

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

        const lineData: Array<any> = !this.dataFilter ? chartData : chartData.filter((item: any) => this.dataFilter(item));

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
            // dot설정이 있을 시 에는 mask 영역 늘리기
            // 우선 주석처리함. zoom시 라인이 늘려진 마스크 영역 때문에 시리즈 영역 바깥으로 빗나가는 현상이 생김.
            // this.chartBase.clipPathSelector
            //     .attr('width', geometry.width + (radius * 4))
            //     .attr('height', geometry.height + (radius * 4))
            //     .attr('x', -(radius*2))
            //     .attr('y', -(radius*2));

            const dots = this.dotGroup.selectAll(`.${this.dotClass}`)
                .data(lineData)
                    .join(
                        (enter) => enter.append('circle').attr('class', this.dotClass)
                            .on('click', (data: any, index: number, nodeList: any) => {
                                event.preventDefault();
                                event.stopPropagation();
                                this.chartBase.chartItemClickSubject.next({
                                    position: {
                                        x: x(data[this.xField]),
                                        y: y(data[this.yField])
                                    },
                                    data
                                });
                            }),
                        (update) => update,
                        (exit) => exit.remove
                    )
                    .style('stroke-width', this.radius / 2)
                    .style('stroke', this.lineColor)
                    .style('fill', '#fff')
                    .attr('cx', (data: any, i) => { return x(data[this.xField]) + padding; })
                    .attr('cy', (data: any) => { return y(data[this.yField]); })
                    .attr('r', this.radius);
            
            // if (this.chartBase.tooltip) {
            //     if (!this.chartBase.tooltip.eventType || this.chartBase.tooltip.eventType === 'click') {
            //         dots
            //         .on('click', (d: any, i, nodeList: any) => {
            //             event.preventDefault();
            //             event.stopPropagation();

            //             if (this.isHide) {
            //                 return;
            //             }

            //             if (this.currentSelector) {
            //                 this.currentSelector.attr('r', this.radius);
            //             }
            //             this.setChartTooltip(d, geometry, this.radius);
            //             this.currentSelector = select(nodeList[i]);
            //             this.currentSelector.attr('r', this.radius * 1.7);
            //         });
            //     } else {
            //         dots
            //         .on('mouseover', (d: any, i, nodeList: any) => {
            //             console.log('mouseover');
            //             event.preventDefault();
            //             event.stopPropagation();

            //             if (this.isHide) {
            //                 return;
            //             }

            //             select(nodeList[i]).attr('r', this.radius * 1.7);
            //                 // .style('fill', () => colorDarker(color, 2)); // point

            //             this.setChartTooltip(d, geometry, this.radius);
            //             select(nodeList[i]).classed('tooltip', true);
            //         })
            //         .on('mouseout', (d: any, i, nodeList: any) => {
            //             console.log('mouseout');
            //             event.preventDefault();
            //             event.stopPropagation();

            //             if (this.isHide) {
            //                 return;
            //             }

            //             select(nodeList[i])
            //                 .attr('r', this.radius) // point
            //                 // .style('stroke', null)
            //                 // .style('stroke-width', null);

            //             this.chartBase.hideTooltip();
            //             select(nodeList[i]).classed('tooltip', false);
            //         });
            //     }
            // }
        }

        // TODO: quadtree setup
        if (this.originQuadTree) {
            this.originQuadTree = undefined;
        }

        delayExcute(300, () => {
            const generateData: Array<any> = lineData
                .map((d: any, i: number) => {
                    const xposition = x(d[this.xField]) + padding;
                    const yposition = y(d[this.yField]);
                    
                    return [xposition, yposition, d];
                });
            this.originQuadTree = quadtree()
                .extent([[0, 0], [geometry.width, geometry.height]])
                .addAll(generateData);
        });
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
        if (this.currentSelector) {
            this.currentSelector.attr('r', this.radius);
            this.currentSelector = null;
        }
    }

    getSeriesDataByPosition(value: Array<number>) {
        return this.search(
            this.originQuadTree,
            value[0] - (this.radius + 2),
            value[1] - (this.radius + 2),
            value[0] + this.radius + 2,
            value[1] + this.radius + 2
        );
    }

    showPointAndTooltip(value: Array<number>, selected: Array<any>) {
        if (selected.length && !this.chartBase.isTooltipDisplay) {
            // const index = Math.floor(selected.length / 2);
            const index = selected.length - 1;
            const selectedItem = selected[index];

            this.drawTooltipPoint(this.geometry, selectedItem, {
                radius: this.radius / 2 + 1,
                strokeColor: this.lineColor,
                strokeWidth: this.strokeWidth
            });

            this.setChartTooltip(
                selectedItem,
                {
                    width: this.geometry.width,
                    height: this.geometry.height
                },
                value
            );
        }
    }

    onSelectItem(selectedItem: Array<any>, event: ChartMouseEvent) {
        if (selectedItem && selectedItem.length) {
            this.itemClickSubject.next({
                data: selectedItem[2],
                event: {
                    offsetX: event.position[0] + this.chartBase.chartMargin.left,
                    offsetY: event.position[1] + this.chartBase.chartMargin.top
                },
                target: {
                    width: 1,
                    height: 1
                }
            });
        }
    }

    private search(quadtreeObj: Quadtree<Array<any>>, x0: number, y0: number, x3: number, y3: number) {
        const temp = [];
        if (quadtreeObj) {
            quadtreeObj.visit((node: any, x1: number, y1: number, x2: number, y2: number) => {
                if (!node.length) {
                    do {
                        const d = node.data;
                        const selected = d[0] >= x0 && d[0] < x3 && d[1] >= y0 && d[1] < y3;
                        if (selected) {
                            temp.push(d);
                        }
                    } while ((node = node.next));
                }
                return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
            });
        }

        return temp;
    }

    private setChartTooltip2(d: any, geometry: ContainerSize, radius: number) {
        this.tooltipGroup = this.chartBase.showTooltip();
    
        const textElement: any = this.tooltipGroup.select('text').attr('dy', '.1em').text(
            this.chartBase.tooltip.tooltipTextParser(d)
        );

        textBreak(textElement, '\n');

        const parseTextNode = textElement.node().getBBox();
        const textWidth = parseTextNode.width + 7;
        const textHeight = parseTextNode.height + 5;
        
        const padding = this.radius * 2 + 5;
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
    }

    // TODO: tooltip에 시리즈 아이디를 부여하여 시리즈 마다 tooltip을 컨트롤 할 수 있도록 한다.
    // multi tooltip도 구현해야 하기 때문에 이방법이 가장 좋음. 현재 중복으로 발생해서 왔다갔다 함.
    private setChartTooltip(seriesData: any, geometry: ContainerSize, mouseEvent: Array<number>) {
        if (this.chartBase.isTooltipDisplay) {
            return;
        }

        this.tooltipGroup = this.chartBase.showTooltip();

        const textElement: any = this.tooltipGroup
            .select('text')
            .attr('dy', '.1em')
            .text(
                this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser
                    ? this.chartBase.tooltip.tooltipTextParser(seriesData[2])
                    : `${this.xField}: ${seriesData[2][this.xField]} \n ${this.yField}: ${seriesData[2][this.yField]}`
            );

        textBreak(textElement, '\n');

        // const parseTextNode = textElement.node().getBoundingClientRect();
        const parseTextNode = textElement.node().getBBox();

        const textWidth = Math.floor(parseTextNode.width) + 7;
        const textHeight = Math.floor(parseTextNode.height) + 5;

        let xPosition = mouseEvent[0] + this.chartBase.chartMargin.left + this.radius;
        let yPosition = mouseEvent[1];

        if (xPosition + textWidth > geometry.width + 5) {
            xPosition = xPosition - textWidth;
        }

        this.tooltipGroup
            .attr('transform', `translate(${xPosition + this.radius}, ${yPosition - this.radius})`)
            .selectAll('rect')
            .attr('width', textWidth)
            .attr('height', textHeight);
    }

    private drawTooltipPoint(
        geometry: ContainerSize, 
        position: Array<number>, 
        style:{radius: number, strokeColor: string, strokeWidth: number}
    ) {
        this.selectionGroup.append('circle')
            .style('stroke-width', this.radius * 1.7)
            .style('stroke', this.lineColor)
            .style('fill', '#fff')
            .attr('cx', (data: any, i) => { return position[0]; })
            .attr('cy', (data: any) => { return position[1]; })
            .attr('r', this.radius);
    }
}