import { Selection, BaseType } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { transition } from 'd3-transition';
import { easeLinear } from 'd3-ease';
import { quadtree } from 'd3-quadtree';

import { Scale, ContainerSize, DisplayOption } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';
import { delayExcute, drawTooltipPointByCircle, drawSelectionPointByCircle } from '../../chart/util/d3-svg-util';
import { ChartSelector } from '../../chart';
import { setChartTooltipByPosition } from '../../chart/tooltip/tooltip-util';

export interface BasicLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    dot?: {
        radius?: number;
        fill?: string;
    };
    line?: {
        strokeWidth?: number;
        strokeColor?: string;
        dashArray?: number;
        isCurve?: boolean; // default : false
    };
    animation?: boolean;
}

export class BasicLineSeries extends SeriesBase {
    protected dotGroup: Selection<BaseType, any, HTMLElement, any>;

    protected selectionGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private line: any;

    private dotClass = 'basic-line-dot';

    private xField: string;

    private yField: string;

    private config: BasicLineSeriesConfiguration;

    private strokeWidth = 2;

    private strokeColor: string;

    private dashArray: number = 0;

    private fillColor: string;

    private isAnimation = false;

    private currentSelector: any;

    private isHide = false;

    private radius = 4;

    private lineColor = '';

    constructor(configuration: BasicLineSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        if (this.config) {
            if (configuration.dotSelector) {
                this.dotClass = configuration.dotSelector;
            }

            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.line) {
                this.strokeWidth = configuration.line.strokeWidth || this.strokeWidth;
                this.strokeColor = configuration.line.strokeColor || this.strokeColor;
                this.dashArray = configuration.line.dashArray || this.dashArray;
            }

            if (configuration.dot) {
                this.fillColor = configuration.dot.fill || this.fillColor;
                this.radius = configuration.dot.radius || this.radius;
            }

            if (configuration.hasOwnProperty('animation')) {
                this.isAnimation = configuration.animation;
            }
        }
    }

    setSvgElement(
        svg: Selection<BaseType, any, HTMLElement, any>,
        mainGroup: Selection<BaseType, any, HTMLElement, any>
    ) {
        this.svg = svg;
        this.selectionGroup = this.svg.select('.' + ChartSelector.SELECTION_SVG);
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select(`.${this.dotClass}-group`).node()) {
            this.dotGroup = mainGroup.append('g').attr('class', `${this.dotClass}-group`);
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        const xScale: any = scales.find((scale: Scale) => scale.orient === this.xDirection);
        const yScale: any = scales.find((scale: Scale) => scale.orient === this.yDirection);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        this.geometry = geometry;

        const resultData: any[] = !this.config.filter ? chartData : chartData.filter((item: any) => this.config.filter(item));

        this.lineColor = this.strokeColor ?? option.color;
        this.fillColor = this.lineColor ?? this.fillColor;

        if (this.config.line) {
            this.line = line()
                .defined(data => data[this.xField])
                .x((data: any, i) => {
                    const xposition = x(data[this.xField]) + padding;
                    return xposition;
                })
                .y((data: any) => {
                    const yposition = y(data[this.yField]);
                    return yposition;
                });

            if (this.config.line.isCurve === true) {
                this.line.curve(curveMonotoneX); // apply smoothing to the line
            }
            const lineSeries = this.mainGroup.selectAll(`.${this.selector}`)
                .data([resultData])
                    .join(
                        (enter) => enter.append('path').attr('class', this.selector),
                        (update) => update,
                        (exit) => exit.remove
                    )
                    .style('stroke-dasharray', this.dashArray)
                    .style('stroke-width', this.strokeWidth)
                    .style('stroke', this.lineColor)
                    .style('fill', 'none')
                    .attr('d', this.line);

            if (this.isAnimation) {
                lineSeries
                    .attr('stroke-dasharray', (d: any, i: number, nodeList: any) => nodeList[i].getTotalLength())
                    .attr('stroke-dashoffset', (d: any, i: number, nodeList: any) => nodeList[i].getTotalLength());

                lineSeries.transition(
                    transition().delay(100).duration(500).ease(easeLinear)
                ).attr('stroke-dashoffset', 0);
            }
        }

        if (this.config.dot) {
            // dot설정이 있을 시 에는 mask 영역 늘리기
            // 우선 주석처리함. zoom시 라인이 늘려진 마스크 영역 때문에 시리즈 영역 바깥으로 빗나가는 현상이 생김.
            // this.chartBase.clipPathSelector
            //     .attr('width', geometry.width + (radius * 4))
            //     .attr('height', geometry.height + (radius * 4))
            //     .attr('x', -(radius*2))
            //     .attr('y', -(radius*2));

            this.dotGroup.selectAll(`.${this.dotClass}`)
                .data(resultData)
                    .join(
                        (enter) => enter.append('circle').attr('class', this.dotClass),
                        (update) => update,
                        (exit) => exit.remove
                    )
                    .style('stroke-width', this.radius / 2)
                    .style('stroke', this.lineColor)
                    .style('fill', this.fillColor)
                    .attr('cx', (data: any) => x(data[this.xField]) + padding)
                    .attr('cy', (data: any) => y(data[this.yField]))
                    .attr('r', this.radius);
        }

        if (this.originQuadTree) {
            this.originQuadTree = undefined;
        }

        delayExcute(300, () => {
            const generateData: any[] = resultData
                .map((d: any, i: number) => {
                    const xposition = x(d[this.xField]) + padding;
                    const yposition = y(d[this.yField]);
                    return [xposition, yposition, d, this.radius];
                });
            this.originQuadTree = quadtree()
                .extent([[xScale.min, yScale.min], [geometry.width, geometry.height]])
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

    onSelectItem(value: number[], selected: any[]) {
        const selectedItem = selected[0];
        drawSelectionPointByCircle(
            this.selectionGroup,
            [[selectedItem[0], selectedItem[1]]],
            {
                fill: this.lineColor,
                radius: this.radius * 1.5
            }
        );
    }

    unSelectItem() {
        if (this.currentSelector) {
            this.currentSelector.attr('r', this.radius);
            this.currentSelector = null;
        }
    }

    getSeriesDataByPosition(value: number[]) {
        return this.search(
            this.originQuadTree,
            value[0] - (this.radius + 2),
            value[1] - (this.radius + 2),
            value[0] + this.radius + 2,
            value[1] + this.radius + 2
        );
    }

    showPointAndTooltip(value: number[], selected: any[]) {
        // const index = Math.floor(selected.length / 2);
        const index = selected.length - 1;
        const selectedItem = selected[index];

        drawTooltipPointByCircle(
            this.selectionGroup,
            [selectedItem],
            {
                radius: this.radius * 1.5,
                strokeColor: this.lineColor,
                strokeWidth: this.strokeWidth
            }
        );

        if (!this.chartBase.isTooltipDisplay) {
            this.tooltipGroup = this.chartBase.showTooltip();
            setChartTooltipByPosition(
                this.tooltipGroup,
                this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser
                    ? this.chartBase.tooltip.tooltipTextParser(selectedItem[2])
                    : `${this.xField}: ${selectedItem[2][this.xField]} \n ${this.yField}: ${selectedItem[2][this.yField]}`,
                this.geometry,
                [
                    selectedItem[0],
                    selectedItem[1]
                ],
                {
                    width: this.radius,
                    height: this.radius
                }
            )
        }

        return index;
    }
}
