import { Selection, BaseType, event } from 'd3-selection';
import { line, curveMonotoneX } from 'd3-shape';
import { format } from 'd3-format';
import { transition } from 'd3-transition';
import { easeLinear } from 'd3-ease';
import { quadtree } from 'd3-quadtree';

import { Scale, ContainerSize, DisplayOption } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { SeriesConfiguration } from '../../chart/series.interface';
import { textBreak, delayExcute, colorDarker } from '../../chart/util/d3-svg-util';
import { Placement } from '../../chart/chart-configuration';
import { ChartSelector } from '../../chart';

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

    private line: any;

    private dotClass = 'basic-line-dot';

    private xField: string;

    private yField: string;

    private config: BasicLineSeriesConfiguration;

    private dataFilter: any;

    private strokeWidth = 2;

    private numberFmt: any;

    private isAnimation = false;

    private currentSelector: any;

    private isHide = false;

    private radius = 4;

    private lineColor = '';

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
        this.selectionGroup = this.svg.select('.' + ChartSelector.SELECTION_SVG);
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select(`.${this.dotClass}-group`).node()) {
            this.dotGroup = mainGroup.append('g').attr('class', `${this.dotClass}-group`);
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        const xScale = scales.find((scale: Scale) => scale.orient === Placement.BOTTOM);
        const x: any = xScale.scale;
        const yScale: any = scales.find((scale: Scale) => scale.orient === Placement.LEFT);
        const y: any = yScale.scale;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        this.geometry = geometry;

        this.lineColor = option.color;

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

        if (this.config.isCurve === true) {
            this.line.curve(curveMonotoneX); // apply smoothing to the line
        }

        const lineData: any[] = !this.dataFilter ? chartData : chartData.filter((item: any) => this.dataFilter(item));

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
                transition().delay(100).duration(500).ease(easeLinear)
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
                        (enter) => enter.append('circle').attr('class', this.dotClass),
                        (update) => update,
                        (exit) => exit.remove
                    )
                    .style('stroke-width', this.radius / 2)
                    .style('stroke', this.lineColor)
                    .style('fill', '#fff')
                    .attr('cx', (data: any) => x(data[this.xField]) + padding)
                    .attr('cy', (data: any) => y(data[this.yField]))
                    .attr('r', this.radius);
        }

        if (this.originQuadTree) {
            this.originQuadTree = undefined;
        }

        delayExcute(300, () => {
            const generateData: any[] = lineData
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

    onSelectItem(value: number[], selected: any[]) {
        const selectedItem = selected[0];
        this.drawSelectionPoint(
            [
                selectedItem[0],
                selectedItem[1]
            ],
            {
                fill: this.lineColor,
                radius: this.radius * 2
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

        return index;
    }

    // TODO: tooltip에 시리즈 아이디를 부여하여 시리즈 마다 tooltip을 컨트롤 할 수 있도록 한다.
    // multi tooltip도 구현해야 하기 때문에 이방법이 가장 좋음. 현재 중복으로 발생해서 왔다갔다 함.
    private setChartTooltip(seriesData: any, geometry: ContainerSize, mouseEvent: number[]) {
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

        let xPosition = mouseEvent[0] + this.chartBase.chartMargin.left + this.radius * 2;
        let yPosition = mouseEvent[1] + this.chartBase.chartMargin.top + this.radius * 2;

        if (xPosition + textWidth > geometry.width + this.chartBase.chartMargin.left) {
            xPosition = xPosition - textWidth;
        }

        if (yPosition + textHeight > geometry.height + this.chartBase.chartMargin.top) {
            yPosition = yPosition - textHeight;
        }

        this.tooltipGroup
            .attr('transform', `translate(${xPosition + this.radius}, ${yPosition - this.radius})`)
            .selectAll('rect')
            .attr('width', textWidth)
            .attr('height', textHeight);
    }

    private drawTooltipPoint(
        geometry: ContainerSize,
        position: number[],
        style:{radius: number, strokeColor: string, strokeWidth: number}
    ) {
        this.selectionGroup.selectAll('.tooltip-point')
            .data([geometry])
            .join(
                (enter) => enter.append('circle').attr('class', 'tooltip-point'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('stroke-width', this.radius * 1.7)
            .style('stroke', this.lineColor)
            .style('fill', '#fff')
            .attr('cx', position[0])
            .attr('cy', position[1])
            .attr('r', this.radius);
    }

    private drawSelectionPoint(
        position: number[],
        style:{fill: string, radius: number}
    ) {
        this.selectionGroup.selectAll('.selection-point')
            .data([style])
            .join(
                (enter) => enter.append('circle').attr('class', 'selection-point'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('stroke-width', 3)
            .style('stroke', colorDarker(style.fill, 2))
            .attr('fill', colorDarker(style.fill, 1))
            .attr('cx', position[0])
            .attr('cy', position[1])
            .attr('r', style.radius);
    }
}