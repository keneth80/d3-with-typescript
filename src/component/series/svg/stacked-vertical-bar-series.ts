import {quadtree} from 'd3-quadtree';
import {scaleOrdinal} from 'd3-scale';
import {BaseType, Selection} from 'd3-selection';
import {stack} from 'd3-shape';

import {ChartSelector} from '../../chart';
import {ContainerSize, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';
import {drawSelectionPointByRect, drawTooltipPointByRect} from '../../chart/util/d3-svg-util';

export interface StackedVerticalBarSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    columns: string[];
    colors?: string[];
    displayNames?: string[];
}

export class StackedVerticalBarSeries extends SeriesBase {
    private columns: string[];

    private rootGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private selectionGroup: Selection<BaseType, any, HTMLElement, any>;

    private currentBarWidth = 0;

    private isHide = false;

    private config: StackedVerticalBarSeriesConfiguration;

    constructor(configuration: StackedVerticalBarSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        this.columns = configuration.columns ? [...configuration.columns] : [];
        this.colors = configuration.colors ? [...configuration.colors] : undefined;
        this.displayNames = configuration.displayNames ? [...configuration.displayNames] : [...configuration.columns];
    }

    xField(): any {
        return this.config.xField;
    }

    yField(): any {
        return null;
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        this.rootGroup = mainGroup;
        this.selectionGroup = this.svg.select('.' + ChartSelector.SELECTION_SVG);

        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = this.rootGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === this.xDirection).scale;
        const y: any = scales.find((scale: Scale) => scale.orient === this.yDirection).scale;

        // set the colors
        const z = scaleOrdinal()
            .range(this.colors ?? this.chartBase.seriesColors)
            .domain(this.columns);

        this.currentBarWidth = x.bandwidth();
        this.geometry = {
            width: 0,
            height: 0
        };
        this.geometry.width = geometry.width;
        this.geometry.height = geometry.height;

        const generateChartData = stack().keys(this.columns)(chartData);
        this.mainGroup
            .selectAll('.stacked-bar-group')
            .data(generateChartData)
            .join(
                (enter) => enter.append('g').attr('class', 'stacked-bar-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('fill', (d: any) => {
                return z(d.key) + '';
            })
            .attr('column', (d: any) => {
                return d.key;
            })
            .attr('index', (d: any, index: number) => {
                return index;
            }) // index
            .selectAll('.stacked-bar-item')
            .data((d: any) => {
                return d;
            })
            .join(
                (enter) => enter.append('rect').attr('class', 'stacked-bar-item'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('x', (d: any) => {
                return x(d.data[this.config.xField]);
            })
            .attr('height', (d: any) => {
                return y(d[0]) - y(d[1]);
            })
            .attr('y', (d: any) => {
                return d[1] < 0 ? y(0) : y(d[1]);
            })
            // TODO: 계산 적용해 볼 것.
            // .attr('height', (d: any) => { return Math.abs(y(d[0]) - y(d[1]) - y(0)); })
            .attr('width', x.bandwidth());

        const size = generateChartData.length;
        const generateData: any[] = [];
        for (let i = 0; i < size; i++) {
            const d: any = generateChartData[i];
            const key = d.key;
            const fill = z(key) + '';
            const columnSize = d.length;
            for (let j = 0; j < columnSize; j++) {
                const item = d[j];
                const data = d[j].data;
                const itemx = x(data[this.config.xField]);
                const itemy = item[1] < 0 ? y(0) : y(item[1]);
                // POINT: quadtree 에 저장 되는 데이터는
                // [아이템의 x축, y축, 아이템의 데이터, 막대의 가로 사이즈, 막대의 세로 사이즈, 색상, 컬럼인덱스, 그룹키]
                generateData.push([itemx, itemy, data, x.bandwidth(), y(item[0]) - y(item[1]), fill, j, key]);
            }
        }

        this.originQuadTree = quadtree()
            .extent([
                [0, 0],
                [geometry.width, geometry.height]
            ])
            .addAll(generateData);
    }

    select(displayName: string, isSelected: boolean) {
        const targetIndex = this.displayNames.findIndex((seriesName: string) => seriesName === displayName);
        if (targetIndex > -1) {
            this.mainGroup.selectAll(`[index="${targetIndex}"]`).style('opacity', isSelected ? null : 0.4);
        }
    }

    hide(displayName: string, isHide: boolean) {
        this.isHide = isHide;
        const targetIndex = this.displayNames.findIndex((seriesName: string) => seriesName === displayName);
        this.mainGroup.selectAll(`[index="${targetIndex}"]`).style('opacity', !isHide ? null : 0);
    }

    onSelectItem(value: number[], selected: any[]) {
        const index = this.retriveColumnIndex(value, selected);
        if (index < 0) {
            return;
        }

        const selectedItem = selected[index];

        drawSelectionPointByRect(
            this.selectionGroup,
            [[selectedItem[0], selectedItem[1]]],
            {
                width: selectedItem[3],
                height: selectedItem[4]
            },
            {
                fill: selectedItem[5]
            }
        );
    }

    getSeriesDataByPosition(value: number[]) {
        return this.search(this.originQuadTree, value[0] - this.currentBarWidth, 0, value[0], this.geometry.height);
    }

    drawPointer(value: number[], selected: any[]): number {
        // const index = Math.floor(selected.length / 2);
        const index: number = this.retriveColumnIndex(value, selected);
        if (index > -1) {
            const selectedItem = selected[index];

            drawTooltipPointByRect(
                this.selectionGroup,
                [[selectedItem[0], selectedItem[1]]],
                {
                    width: selectedItem[3],
                    height: selectedItem[4]
                },
                {
                    fill: selectedItem[5]
                }
            );
        }

        return index;
    }

    pointerSize(selectedItem: any): ContainerSize {
        return {
            width: selectedItem[3],
            height: selectedItem[4]
        };
    }

    tooltipText(selectedItem: any[]): string {
        const dataKey = selectedItem[6];
        const tooltipData = selectedItem[2];
        return `${this.displayName ?? this.config.xField}: ${tooltipData[dataKey]}`;
    }

    tooltipStyle(selectedItem: any): {fill: string; opacity: number; stroke: string} {
        return {
            fill: selectedItem[5],
            opacity: 1,
            stroke: selectedItem[5]
        };
    }

    // TODO: tooltip에 시리즈 아이디를 부여하여 시리즈 마다 tooltip을 컨트롤 할 수 있도록 한다.
    // multi tooltip도 구현해야 하기 때문에 이방법이 가장 좋음. 현재 중복으로 발생해서 왔다갔다 함.
    // showPointAndTooltip(value: number[], selected: any[]) {
    //     // const index = Math.floor(selected.length / 2);
    //     // TODO: y좌표보다 작은 아이템을 골라야함.
    //     const index: number = this.retriveColumnIndex(value, selected);

    //     if (index > -1) {
    //         const selectedItem = selected[index];

    //         if (!this.chartBase.isTooltipDisplay) {
    //             drawTooltipPointByRect(
    //                 this.selectionGroup,
    //                 [[selectedItem[0], selectedItem[1]]],
    //                 {
    //                     width: selectedItem[3],
    //                     height: selectedItem[4]
    //                 },
    //                 {
    //                     fill: selectedItem[5]
    //                 }
    //             );

    //             if (!this.chartBase.isTooltipDisplay) {
    //                 this.tooltipGroup = this.chartBase.showTooltip();
    //                 setChartTooltipByPosition(
    //                     this.tooltipGroup,
    //                     this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser
    //                     ? this.chartBase.tooltip.tooltipTextParser(selectedItem)
    //                         : `${this.xField}: ${selectedItem[2][this.xField]} \n ${this.yField}: ${selectedItem[2][this.yField]}`,
    //                     this.geometry,
    //                     [
    //                         selectedItem[0],
    //                         selectedItem[1]
    //                     ],
    //                     {
    //                         width: selectedItem[3],
    //                         height: selectedItem[4]
    //                     }
    //                 )
    //             }
    //         }
    //     }

    //     return index;
    // }

    private retriveColumnIndex(value: number[], selected: any[]): number {
        let index = -1;
        for (let i = 0; i < selected.length; i++) {
            if (value[1] > selected[i][1] && value[1] < selected[i][4] + selected[i][1]) {
                // y좌표보다 작아야하고, 막대 크기보다 커야함.
                index = i;
                break;
            }
        }

        return index;
    }
}
