import {Selection, BaseType, select} from 'd3-selection';
import {Subscription} from 'rxjs';

import {Margin, Placement, Shape, Align} from '../chart-configuration';
import {ContainerSize, LegendItem} from '../chart.interface';
import {ISeries} from '../series.interface';
import {
    drawLegendColorItemByCircle,
    drawLegendColorItemByLine,
    drawLegendColorItemByRect,
    drawSvgCheckBox,
    getMaxText,
    getTextWidth,
    getTextHeight
} from '../util';
import {ObjectScrollBar} from '../../svg-component/object-scroll-bar';

export interface ChartLegendConfiguration {
    isCheckBox: boolean;
    isAll: boolean;
    addTitleWidth: number;
    placement: string;
    align?: string;
    colors: string[];
    defaultLegendStyle: any;
    onLegendLabelItemClickHandler?: any;
    onLegendCheckBoxClickHandler?: any;
    seriesList: ISeries[];
    margin: Margin;
    svgGeometry: ContainerSize;
    mainGeometry: ContainerSize;
}

export const legendItemListByGrouped = (displayNames: string[], colors?: string[]) => {
    const legendItemList: LegendItem[] = [];
    displayNames.forEach((displayName: string, index: number) => {
        const label: string = displayName;
        const shape: string = Shape.RECT;
        legendItemList.push({
            label,
            shape,
            selected: true,
            isHide: false,
            color: colors ? colors[index] : undefined
        });
    });
    return legendItemList;
};

export class ChartLegend {
    private configuration: ChartLegendConfiguration;

    private legendItemList: LegendItem[] = [];

    private legendItemSize: ContainerSize = {
        width: 10,
        height: 10
    };

    private legendContainerSize: ContainerSize = {
        width: 0,
        height: 0
    };

    private legendTopBottmPadding = 10;

    private legendRightLeftPadding = 10;

    private addAllWidth = 0;

    private legendRowCount = 1;

    private legendPadding = 5;

    private checkBoxWidth = 15;

    private legendItemTextHeight = 15;

    private allWidth = 30;

    private totalLegendWidth = 0;

    private legendTextWidthList: any[] = [];

    private paddingQueue: any;

    private checkboxPadding: number = 0;

    private scrollBar: ObjectScrollBar;

    private scrollEventSubscription: Subscription;

    constructor(configuration: ChartLegendConfiguration) {
        this.configuration = configuration;
    }

    parseLegendData(seriesList: ISeries[]) {
        const legendItemList: LegendItem[] = [];
        // TODO: 색상을 커스텀으로 줄시에 색상 셋팅이 안됨. 그리고 갯수가 많아지니 아래 여백이 넓어짐.
        seriesList.forEach((series: ISeries) => {
            if (series.displayNames && series.displayNames.length) {
                // TODO: series color setup
                legendItemListByGrouped(series.displayNames, series.colors).forEach((legendItem: LegendItem) => {
                    legendItemList.push(legendItem);
                });
            } else {
                const label: string = series.displayName ? series.displayName : series.selector;
                const shape: string = series.shape ? series.shape : Shape.RECT;
                legendItemList.push({
                    label,
                    shape,
                    selected: true,
                    isHide: false,
                    color: series.color
                });
            }
        });
        return legendItemList;
    }

    init() {
        const titleTextHeight = getTextHeight(this.configuration.defaultLegendStyle.font.size, this.configuration.defaultLegendStyle.font.family); // 14
        // legend row 한개의 길이
        // const checkWidth = this.configuration.margin.left + this.configuration.margin.right + this.configuration.svgGeometry.width - this.legendPadding * 2;
        const checkWidth = this.configuration.svgGeometry.width - this.legendPadding * 2;
        // 초기화.
        this.legendItemList.length = 0;
        this.legendTextWidthList.length = 0;
        this.totalLegendWidth = 0;

        this.paddingQueue = {};
        this.checkboxPadding = this.configuration.isCheckBox ? this.legendItemSize.width + this.legendPadding : 0;
        this.addAllWidth = this.configuration.isAll ? this.allWidth : 0;

        let targetText = null;
        let targetTextWidth = 0;
        if (this.configuration.seriesList.length) {
            // stacked, group bar 의 경우 범례 설정.
            this.legendItemList = this.parseLegendData(this.configuration.seriesList);

            if (this.configuration.seriesList[0].displayNames && this.configuration.seriesList[0].displayNames.length) {
                targetText = getMaxText(this.configuration.seriesList[0].displayNames.map((displayName: string) => displayName));
            } else {
                // 일반 시리즈의 경우 범례 설정.
                targetText = getMaxText(this.configuration.seriesList.map((series: ISeries) => series.displayName || series.selector));
            }
            targetTextWidth = getTextWidth(
                targetText,
                this.configuration.defaultLegendStyle.font.size,
                this.configuration.defaultLegendStyle.font.family
            );
        }

        if (this.configuration.isAll) {
            this.totalLegendWidth = this.allWidth - (this.configuration.isCheckBox ? 0 : 10);
            this.legendTextWidthList.push({
                row: 0,
                breakIndex: -1,
                width: this.totalLegendWidth
            });
        }
        this.totalLegendWidth += this.legendPadding;

        let compareWidth = this.totalLegendWidth;
        let rowNumber = 0;
        // TODO: reduce로 바꾸고 각 변수를 object key value로 할당 할 것.
        this.legendItemList.reduce((pre: any, currentItem: LegendItem, currentIndex: number) => {
            let breakIndex = -1;
            const currentText = currentItem.label;
            const currentTextWidth = getTextWidth(
                currentText,
                this.configuration.defaultLegendStyle.font.size,
                this.configuration.defaultLegendStyle.font.family
            );
            const currentItemWidth =
                (this.configuration.isCheckBox ? this.checkBoxWidth : 0) + currentTextWidth + this.legendItemSize.width + this.legendPadding;
            this.totalLegendWidth += currentItemWidth;

            if (compareWidth + currentItemWidth + this.legendPadding >= checkWidth) {
                breakIndex = currentIndex + (this.configuration.isAll ? 1 : 0);
                this.paddingQueue[rowNumber + ''] = checkWidth - compareWidth;
                rowNumber++;
                compareWidth = currentItemWidth;
            } else {
                compareWidth += currentItemWidth + this.legendPadding;
            }

            pre.push({
                text: currentText,
                width: currentItemWidth,
                row: rowNumber,
                breakIndex
            });
            return pre;
        }, this.legendTextWidthList);

        const lastKey = this.legendTextWidthList[this.legendTextWidthList.length - 1].row || 0;
        this.paddingQueue[lastKey + ''] = checkWidth - compareWidth;
        this.totalLegendWidth +=
            this.legendPadding * (this.configuration.seriesList.length - 1) +
            (this.legendItemSize.width + this.legendPadding) * this.configuration.seriesList.length;

        this.legendContainerSize.width =
            this.configuration.placement === Placement.LEFT || this.configuration.placement === Placement.RIGHT
                ? this.legendPadding * 2 +
                  this.legendItemSize.width +
                  this.legendPadding +
                  Math.round(targetTextWidth) +
                  (this.configuration.isCheckBox ? this.checkBoxWidth : 0) +
                  5
                : lastKey + 1 > 1
                ? this.configuration.svgGeometry.width
                : this.totalLegendWidth;
        this.legendContainerSize.height =
            this.configuration.placement === Placement.LEFT || this.configuration.placement === Placement.RIGHT
                ? this.configuration.svgGeometry.height
                : (this.legendPadding + titleTextHeight) * (lastKey + 1);

        if (this.configuration.isAll) {
            this.legendItemList.unshift({
                label: 'All',
                selected: true,
                isHide: false,
                shape: Shape.NONE
            });
        }

        return this.legendContainerSize;
    }

    drawLegend(legendGroup: Selection<BaseType, any, BaseType, any>) {
        // clip path 설정
        const clipPathName: string = 'scrollbox-clip-path';
        legendGroup.attr('clip-path', `url(#${clipPathName})`);
        // scroll로 인한 view position을 지정해주기 위한.group.
        legendGroup.append('g').attr('class', 'legend-item-list-group').attr('transform', `translate(0, 0)`);

        let currentRow = 0;
        let currentX = 0;
        let rowStart = 0;
        const legendItemGroup = legendGroup
            .select('.legend-item-list-group')
            .selectAll('.legend-item-group')
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
                if (this.configuration.align) {
                    const currentRow = this.legendTextWidthList[index].row;
                    if (this.configuration.align === Align.RIGHT) {
                        rowStart =
                            (this.paddingQueue[currentRow + ''] ? this.paddingQueue[currentRow + ''] : rowStart) +
                            (currentRow === 0 ? this.legendPadding : 0);
                    } else if (this.configuration.align === Align.CENTER) {
                        rowStart =
                            (this.paddingQueue[currentRow + ''] ? this.paddingQueue[currentRow + ''] : rowStart) +
                            (currentRow === 0 ? this.legendPadding : 0);
                        rowStart = rowStart / 2;
                    }
                }
                let x = rowStart;
                let y = this.legendTopBottmPadding;
                if (this.configuration.placement === Placement.LEFT || this.configuration.placement === Placement.RIGHT) {
                    if (this.configuration.placement === Placement.LEFT) {
                        x = this.legendPadding;
                    }
                    x += this.configuration.addTitleWidth;
                    y = index * 20 + this.legendTopBottmPadding;
                }
                if (this.configuration.placement === Placement.TOP || this.configuration.placement === Placement.BOTTOM) {
                    if (index > 0) {
                        currentX += this.legendTextWidthList[index - 1].width + this.legendPadding;
                    }

                    if (index === this.legendTextWidthList[index].breakIndex) {
                        currentRow = this.legendTextWidthList[index].row;
                        currentX = 0;
                    }

                    x += currentX;
                    y = (this.legendItemTextHeight + this.legendPadding) * currentRow;
                }
                return `translate(${x}, ${y})`;
            });

        if (this.configuration.isCheckBox) {
            legendItemGroup.each((d: LegendItem, index: number, nodeList: any) => {
                drawSvgCheckBox(select(nodeList[index]), this.configuration.onLegendCheckBoxClickHandler);
            });
        }

        const legendLabelGroup: Selection<BaseType, any, BaseType, any> = legendItemGroup
            .selectAll('.legend-label-group')
            .data((d: any) => [d])
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
            // if (d.shape === Shape.LINE) {
            //     drawLegendColorItemByLine(select(nodeList[i]), this.legendItemSize, distictKeys, this.configuration.colors);
            // } else if (d.shape === Shape.CIRCLE) {
            //     drawLegendColorItemByCircle(select(nodeList[i]), this.legendItemSize, distictKeys, this.configuration.colors);
            // } else if (d.shape === Shape.RECT) {
            //     drawLegendColorItemByRect(select(nodeList[i]), this.legendItemSize, distictKeys, this.configuration.colors);
            // }
        });

        legendLabelGroup
            .selectAll('.legend-label')
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
                const x = d.shape === Shape.NONE ? 0 : this.legendPadding + this.legendItemSize.width;
                return `translate(${x}, 5)`;
            })
            .text((d: LegendItem) => {
                return d.label;
            });

        if (this.configuration.svgGeometry.height < (legendGroup.node() as SVGAElement).getBBox().height) {
            console.log('draw scrollbar : ', this.configuration.svgGeometry.height, (legendGroup.node() as SVGAElement).getBBox().height);
            // scroll bar initialize
            const backgroundRect: Selection<any, any, BaseType, any> = this.drawLegendContainerBackground(legendGroup, {
                width: this.legendContainerSize.width,
                height: this.configuration.svgGeometry.height
            });
            // scrollbar setup
            if (!this.scrollBar) {
                this.scrollBar = new ObjectScrollBar({
                    rootGroup: legendGroup,
                    clipPathName: clipPathName,
                    viewPortBackground: backgroundRect,
                    scrollAreaSize: {
                        width: this.legendContainerSize.width,
                        height: this.configuration.svgGeometry.height
                    },
                    padding: 10
                });

                this.addEvent(legendGroup, this.scrollBar, this.scrollEventSubscription);
            }
            this.scrollBar.draw();
        }
    }

    destroy() {
        if (this.scrollEventSubscription) {
            this.scrollEventSubscription.unsubscribe();
        }

        if (this.scrollBar) {
            this.scrollBar.destroy();
        }
    }

    private drawLegendContainerBackground(
        targetGroup: Selection<BaseType, any, BaseType, any>,
        containerSize: {width: number; height: number} = {width: 150, height: 100}
    ) {
        const width: number = containerSize.width;
        const height: number = containerSize.height;
        return targetGroup
            .append('rect')
            .style('fill', '#fff')
            .style('fill-opacity', 0)
            .attr('class', 'legend-group-background')
            .attr('width', width)
            .attr('height', height + 10)
            .lower();
    }

    private addEvent(legendGroup: Selection<BaseType, any, BaseType, any>, scrollBar: ObjectScrollBar, scrollEventSubscription: Subscription) {
        // scroll bar event 등록.
        if (scrollBar) {
            scrollEventSubscription = scrollBar.scroller$.subscribe((position: number) => {
                legendGroup.select('.legend-item-list-group').attr('transform', `translate(0, ${-1 * position})`);
            });
        }
    }
}
