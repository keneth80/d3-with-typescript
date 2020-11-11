import { Selection, BaseType, select } from 'd3-selection';
import { Margin, Placement, Shape } from '../chart-configuration';
import { ContainerSize, LegendItem } from '../chart.interface';
import { ISeries } from '../series.interface';
import {
    drawLegendColorItemByCircle,
    drawLegendColorItemByLine,
    drawLegendColorItemByRect,
    drawSvgCheckBox,
    getMaxText, getTextWidth
} from '../util';

export interface ChartLegendConfiguration {
    isCheckBox: boolean;
    isAll: boolean;
    addTitleWidth: number;
    legendPlacement: string;
    colors: string[];
    defaultLegendStyle: any;
    onLegendLabelItemClickHandler?: any;
    onLegendCheckBoxClickHandler?: any;
    seriesList: ISeries[];
    margin: Margin;
    svgGeometry: ContainerSize;
}

export const legendItemListByGrouped = (seriesList: ISeries[]) => {
    const legendItemList: LegendItem[] = [];
    seriesList[0].displayNames.forEach((displayName: string) => {
        const label: string = displayName;
        const shape: string = Shape.RECT;
        legendItemList.push({
            label,
            shape,
            selected: true,
            isHide: false
        });
    });
    return legendItemList;
}

export const legendItemListByNormal = (seriesList: ISeries[]) => {
    const legendItemList: LegendItem[] = [];
    seriesList.forEach((series: ISeries) => {
        const label: string = series.displayName ? series.displayName : series.selector;
        const shape: string = series.shape ? series.shape : Shape.RECT;
        legendItemList.push({
            label,
            shape,
            selected: true,
            isHide: false
        });
    });
    return legendItemList;
}

export class ChartLegend {
    private configuration: ChartLegendConfiguration;

    private legendItemList: LegendItem[] = [];

    private legendItemSize: ContainerSize = {
        width: 10, height: 10
    };

    private legendContainerSize: ContainerSize = {
        width: 0, height: 0
    };

    private addAllWidth = 0;

    private legendRowCount = 1;

    private legendPadding = 5;

    private checkBoxWidth = 15;

    private legendItemTextHeight = 15;

    private allWidth = 30;

    private totalLegendWidth = 0;

    private legendRowBreakCount: number[] = [];

    private legendTextWidthList: number[] = [];

    private checkboxPadding: number = 0;

    constructor(
        configuration: ChartLegendConfiguration
    ) {
        this.configuration = configuration;
    }

    parseLegendData(seriesList: ISeries[]) {
        const legendItemList: LegendItem[] = [];
        if (seriesList[0].displayNames && seriesList[0].displayNames.length) {
            legendItemListByGrouped(seriesList)
                .forEach((legendItem: LegendItem) => {
                    legendItemList.push(legendItem);
                });
        } else {
            // 일반 시리즈의 경우 범례 설정.
            legendItemListByNormal(seriesList)
                .forEach((legendItem: LegendItem) => {
                    legendItemList.push(legendItem);
                });
        }

        return legendItemList;
    }

    init() {
        const titleTextHeight = 16;
        // 초기화.
        this.legendItemList.length = 0;
        this.legendTextWidthList.length = 0;
        this.legendRowBreakCount.length = 0;
        this.totalLegendWidth = 0;

        this.checkboxPadding = this.configuration.isCheckBox ? this.legendItemSize.width + this.legendPadding : 0;

        this.addAllWidth = this.configuration.isAll ? this.allWidth : 0;

        // legend row 한개의 길이
        const checkWidth = this.configuration.margin.left + this.configuration.margin.right + this.configuration.svgGeometry.width - this.legendPadding * 4;

        let targetText = null;
        let targetTextWidth = 0;
        if (this.configuration.seriesList && this.configuration.seriesList.length) {
            // stacked, group bar 의 경우 범례 설정.
            this.legendItemList = this.parseLegendData(this.configuration.seriesList);

            if (this.configuration.seriesList[0].displayNames && this.configuration.seriesList[0].displayNames.length) {
                targetText = getMaxText(this.configuration.seriesList[0].displayNames.map((displayName: string) => displayName));
            } else {
                // 일반 시리즈의 경우 범례 설정.
                targetText = getMaxText(this.configuration.seriesList.map((series: ISeries) => series.displayName || series.selector));
            }

            targetTextWidth = getTextWidth(targetText, this.configuration.defaultLegendStyle.font.size, this.configuration.defaultLegendStyle.font.family);
        }

        if (this.configuration.isAll) {
            this.totalLegendWidth = this.allWidth - (this.configuration.isCheckBox ? 0 : 10);
            this.legendTextWidthList.push(this.totalLegendWidth);
        }
        this.totalLegendWidth += this.legendPadding;

        let compareWidth = this.totalLegendWidth;

        for (let i = 0; i < this.legendItemList.length; i++) {
            const currentText = this.legendItemList[i].label;
            const currentTextWidth = ((this.configuration.isCheckBox ? this.checkBoxWidth : 0) + getTextWidth(currentText, this.configuration.defaultLegendStyle.font.size, this.configuration.defaultLegendStyle.font.family));
            const currentItemWidth = currentTextWidth + this.legendItemSize.width + this.legendPadding;
            this.legendTextWidthList.push(currentItemWidth);
            this.totalLegendWidth += currentItemWidth;
            compareWidth += currentItemWidth;
            if (compareWidth > checkWidth) {
                compareWidth = currentItemWidth;
                this.legendRowBreakCount.push(i + (this.configuration.isAll ? 1 : 0));
            }
        }

        this.totalLegendWidth += (this.legendPadding * (this.configuration.seriesList.length - 1)) + ((this.legendItemSize.width + this.legendPadding) * this.configuration.seriesList.length);

        this.legendRowCount = Math.ceil(this.totalLegendWidth / this.configuration.svgGeometry.width);

        this.legendContainerSize.width =
        this.configuration.legendPlacement === Placement.LEFT || this.configuration.legendPlacement === Placement.RIGHT ?
            this.legendPadding * 2 + this.legendItemSize.width + this.legendPadding + Math.round(targetTextWidth) + (this.configuration.isCheckBox ? this.checkBoxWidth : 0) :
            (this.legendRowCount > 1 ? this.configuration.svgGeometry.width : this.totalLegendWidth);
        this.legendContainerSize.height =
            this.configuration.legendPlacement === Placement.LEFT || this.configuration.legendPlacement === Placement.RIGHT ?
            this.configuration.svgGeometry.height :
            (this.legendPadding + titleTextHeight) * this.legendRowCount;

        return this.legendContainerSize;
    }

    drawLegend(legendGroup: Selection<BaseType, any, BaseType, any>) {
        let currentRow = 0;
        let currentX = 0;

        if (this.configuration.isAll) {
            this.legendItemList.unshift({
                label: 'All',
                selected: true,
                isHide: false,
                shape: Shape.NONE
            });
        }

        const legendItemGroup = legendGroup.selectAll('.legend-item-group')
            .data(this.legendItemList)
            .join(
                (enter) => enter.append('g').attr('class', 'legend-item-group'),
                (update) => {
                    update.selectAll('*').remove();
                    return update;
                },
                (exit) => exit.remove()
            )
            .attr('id', (d: LegendItem) => {
                return d.label === 'All' ? 'legend-all-group' : null;
            })
            .attr('transform', (d: any, index: number) => {
                let x = 0;
                let y = this.legendPadding;
                if (this.configuration.legendPlacement === Placement.LEFT ||
                    this.configuration.legendPlacement === Placement.RIGHT) {
                    if (this.configuration.legendPlacement === Placement.LEFT) {
                        x = this.legendPadding;
                    }
                    x = x + this.configuration.addTitleWidth;
                    y = index * 20 + this.addAllWidth;
                }
                if (this.configuration.legendPlacement === Placement.TOP ||
                    this.configuration.legendPlacement === Placement.BOTTOM) {
                    if (index > 0) {
                        currentX += this.legendTextWidthList[index - 1] + this.legendPadding;
                    }

                    if (this.legendRowBreakCount.indexOf(index) > -1) {
                        currentRow = this.legendRowBreakCount.indexOf(index) + 1;
                        currentX = 0;
                    }

                    x = currentX;
                    y = (this.legendItemTextHeight + this.legendPadding) * currentRow;
                }
                return `translate(${x}, ${y})`;
            });

        if (this.configuration.isCheckBox) {
            legendItemGroup.each((d: LegendItem, index: number, nodeList: any) => {
                drawSvgCheckBox(select(nodeList[index]), this.configuration.onLegendCheckBoxClickHandler);
            });
        }

        const legendLabelGroup: Selection<BaseType, any, BaseType, any> = legendItemGroup.selectAll('.legend-label-group')
            .data((d: any) =>[d])
            .join(
                (enter) => enter.append('g').attr('class', 'legend-label-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('id', (d: LegendItem) => {
                return d.label === 'All' ? 'legend-all-label' : null;
            })
            .attr('transform', `translate(${this.checkboxPadding}, 0)`)
            .on('click', this.configuration.onLegendLabelItemClickHandler);

        legendLabelGroup.each((d: LegendItem, i: number, nodeList: any) => {
            const distictKeys = this.configuration.isAll ? this.legendItemList.filter((key: LegendItem) => key.label !== 'All') : this.legendItemList;
            if (d.shape === Shape.LINE) {
                drawLegendColorItemByLine(select(nodeList[i]), this.legendItemSize, distictKeys, this.configuration.colors);
            } else if (d.shape === Shape.CIRCLE) {
                drawLegendColorItemByCircle(select(nodeList[i]), this.legendItemSize, distictKeys, this.configuration.colors);
            } else if (d.shape === Shape.RECT) {
                drawLegendColorItemByRect(select(nodeList[i]), this.legendItemSize, distictKeys, this.configuration.colors);
            }
        });

        legendLabelGroup.selectAll('.legend-label')
            .data((d: LegendItem) => [d])
            .join(
                (enter) => enter.append('text').attr('class', 'legend-label'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('font-family', this.configuration.defaultLegendStyle.font.family)
            .style('font-size', this.configuration.defaultLegendStyle.font.size)
            .attr('dy', '.35em')
            .attr('transform', (d: LegendItem, index: number) => {
                const x = (d.shape === Shape.NONE ? 0 : this.legendPadding + this.legendItemSize.width);
                return `translate(${x}, 5)`;
            })
            .text((d: LegendItem) => { return d.label; });
    }
}