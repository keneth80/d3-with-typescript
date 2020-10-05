import { Selection, BaseType } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { stack } from 'd3-shape';
import { format } from 'd3-format';
import { quadtree } from 'd3-quadtree';

import { Scale, ContainerSize } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { colorDarker, textBreak, delayExcute } from '../../chart/util/d3-svg-util';
import { SeriesConfiguration } from '../../chart/series.interface';
import { ChartBase } from '../../chart';

export interface StackedVerticalBarSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    columns: Array<string>;
    displayNames?: Array<string>;
}

export class StackedVerticalBarSeries extends SeriesBase {
    private xField: string;

    private yField: string;

    private columns: Array<string>;

    private rootGroup: Selection<BaseType, any, HTMLElement, any>;

    private legendGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private selectionGroup: Selection<BaseType, any, HTMLElement, any>;

    private numberFmt: any;

    private currentBarWidth = 0;

    private isHide = false;

    constructor(configuration: StackedVerticalBarSeriesConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.columns) {
                this.columns = [...configuration.columns];
            }

            if (configuration.displayNames) {
                this.displayNames = [...configuration.displayNames];
            } else {
                this.displayNames = [...configuration.columns];
            }
        }

        this.numberFmt = format(',d');
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        this.rootGroup = mainGroup;
        this.selectionGroup = this.svg.select('.' + ChartBase.SELECTION_SVG);
        
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = this.rootGroup.append('g').attr('class', `${this.selector}-group`);
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orient === 'left').scale;

        // set the colors
        const z = scaleOrdinal()
        .range(this.chartBase.seriesColors);

        z.domain(this.columns);

        this.currentBarWidth = x.bandwidth();
        this.geometry = {
            width: 0,
            height: 0
        };
        this.geometry.width = geometry.width;
        this.geometry.height = geometry.height;

        const generateChartData = stack().keys(this.columns)(chartData);
        this.mainGroup.selectAll('.stacked-bar-group')
            .data(generateChartData)
            .join(
                (enter) => enter.append('g')
                            .attr('class', 'stacked-bar-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('fill', (d: any) => {
                return z(d.key) + '';
            })
            .attr('column', (d: any) => { return d.key; })
            .attr('index', (d: any, index: number) => { return index; }) // index
            .selectAll('.stacked-bar-item')
                .data((d: any) => { return d; })
                .join(
                    (enter) => enter.append('rect').attr('class', 'stacked-bar-item')
                        // .on('mouseover', (d: any, i, nodeList: any) => {
                        //     const target: any = nodeList[i];
                        //     const column: string = target.parentNode.getAttribute('column');
                        //     const fill: string = z(column) + '';
                            
                        //     select(nodeList[i])
                        //         .style('fill', () => colorDarker(fill, 2)) // point
                        //         // .style('stroke', '#f5330c')
                        //         // .style('stroke-width', 2);

                        //     this.tooltipGroup = this.chartBase.showTooltip();
                        //     select(nodeList[i]).classed('tooltip', true);
                            
                        // })
                        // .on('mouseout', (d: any, i, nodeList: any) => {
                        //     const target: any = nodeList[i];
                        //     const column: string = target.parentNode.getAttribute('column');
                        //     const fill: string = z(column) + '';

                        //     select(nodeList[i])
                        //         .style('fill', () => fill) // point
                        //         // .style('stroke', null)
                        //         // .style('stroke-width', null);

                        //     this.chartBase.hideTooltip();
                        //     select(nodeList[i]).classed('tooltip', false);
                        // })
                        // .on('mousemove', (d: any, i, nodeList: any) => {
                        //     const target: any = nodeList[i];
                        //     const column: string = target.parentNode.getAttribute('column');
                        //     const xPosition = mouse(target)[0] + 10;
                        //     const yPosition = mouse(target)[1] - 10;
                        //     const textElement: any = this.tooltipGroup.select('text')
                        //         .text(`${column}: ${this.numberFmt(d.data[column])}`);

                        //     this.tooltipGroup.attr('transform', `translate(${this.chartBase.chartMargin.left + xPosition}, ${yPosition})`);
                        //     this.tooltipGroup.selectAll('rect')
                        //         .attr('width', textElement.node().getComputedTextLength() + 10);
                        //     // this.tooltipGroup.select('text').text(`${d[1] - d[0]}`);
                        //     // console.log('d : ', d, target, parent);
                        // })
                        // .on('click', (data: any) => {
                        //     event.preventDefault();
                        //     event.stopPropagation();
                        //     this.itemClickSubject.next(data);
                        // })
                        ,
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x', (d: any) => {
                    return x(d.data[this.xField]); 
                })
                .attr('height', (d: any) => {
                    return y(d[0]) - y(d[1]); 
                })
                .attr('y', (d: any) => {
                    return (d[1] < 0 ? y(0) : y(d[1])); 
                })
                // TODO: 계산 적용해 볼 것.
                // .attr('height', (d: any) => { return Math.abs(y(d[0]) - y(d[1]) - y(0)); })
                .attr('width', x.bandwidth());
        
        // this.drawLegend(keys, z, geometry.width);

        delayExcute(300, () => {
            let i, j = 0;
            const size = generateChartData.length;
            
            const generateData: Array<any> = [];
            for ( i = 0; i < size; i++) {
                const d: any = generateChartData[i];
                const key = d.key;
                const fill = z(key) + '';
                const columnSize = d.length;
                for (j = 0; j < columnSize; j++) {
                    const item = d[j];
                    const data = d[j].data;
                    const itemx = x(data[this.xField]);
                    const itemy = (item[1] < 0 ? y(0) : y(item[1]));
                    // POINT: quadtree 에 저장 되는 데이터는
                    // [아이템의 x축, y축, 아이템의 데이터, 컬럼인덱스, 막대의 가로 사이즈, 막대의 세로 사이즈, 색상]
                    generateData.push([
                        itemx, itemy, data, j, key, x.bandwidth(), y(item[0]) - y(item[1]), fill
                    ]);
                }
            }

            this.originQuadTree = quadtree()
                .extent([[0, 0], [geometry.width, geometry.height]])
                .addAll(generateData);
        });
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

    onSelectItem(value: Array<number>, selected: Array<any>) {
        const index = this.retriveColumnIndex(value, selected);

        if (index < 0) {
            return;
        }

        this.chartBase.chartItemClickSubject.next({
            position: {
                x: value[0],
                y: value[1]
            },
            data: selected[2]
        });

        const selectedItem = selected[index];

        this.drawSelectionPoint(
            {
                width: selectedItem[5],
                height: selectedItem[6]
            }, 
            [
                selectedItem[0],
                selectedItem[1]
            ], 
            {
                fill: selectedItem[7]
            }
        );
    }

    unSelectItem() {
        // if (this.currentSelector) {
        //     this.currentSelector.attr('r', this.radius);
        //     this.currentSelector = null;
        // }
    }

    getSeriesDataByPosition(value: Array<number>) {
        return this.search(
            this.originQuadTree,
            value[0] - this.currentBarWidth,
            0,
            value[0],
            this.geometry.height
        );
    }

    showPointAndTooltip(value: Array<number>, selected: Array<any>) {
        // const index = Math.floor(selected.length / 2);
        //TODO: y좌표보다 작은 아이템을 골라야함.
        const index = this.retriveColumnIndex(value, selected);

        if (index < 0) {
            return;
        }

        const selectedItem = selected[index];

        this.setChartTooltip(
            selectedItem,
            {
                width: this.geometry.width,
                height: this.geometry.height
            },
            value
        );
    }

    private retriveColumnIndex(value: Array<number>, selected: Array<any>) {
        let index = -1;
        for (let i = 0; i < selected.length; i++) {
            if (value[1] > selected[i][1] && value[1] < (selected[i][6] + selected[i][1])) { // y좌표보다 작아야하고, 막대 크기보다 커야함.
                index = i;
                break;
            }
        }

        return index;
    }

    // TODO: tooltip에 시리즈 아이디를 부여하여 시리즈 마다 tooltip을 컨트롤 할 수 있도록 한다.
    // multi tooltip도 구현해야 하기 때문에 이방법이 가장 좋음. 현재 중복으로 발생해서 왔다갔다 함.
    private setChartTooltip(seriesData: any, geometry: ContainerSize, mouseEvent: Array<number>) {
        if (this.chartBase.isTooltipDisplay) {
            return;
        }

        // y좌표에 대해서 체크하여 영역안에 있지 않으면 툴팁을 보여주지 않는다.
        // why? 바의 높이는 제각각 다른데 quadtree는 좌표만을 가지고 위치를 찾는다.
        // 특정 영역안에 있는 좌표를 가져와야 하는데 바의 높이는 데이터에 따라 다르므로 좌표만으로 찾을 수 없다.
        // 해서 quadtree는 x 좌표만을 가지고 컨트롤 하고 실제 x좌표를 통해 가져온 데이터에서 실제 좌표와 비교하여 판단 할 수 밖에 없다.
        // if (mouseEvent[1] < seriesData[1]) {
        //     return;
        // }

        this.drawTooltipPoint(
            {
                width: seriesData[5],
                height: seriesData[6]
            }, 
            [
                seriesData[0],
                seriesData[1]
            ], 
            {
                fill: seriesData[7]
            }
        );

        this.tooltipGroup = this.chartBase.showTooltip();

        const textElement: any = this.tooltipGroup
            .select('text')
            .attr('dy', '.1em')
            .text(
                this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser
                    ? this.chartBase.tooltip.tooltipTextParser(seriesData)
                    : `${this.xField}: ${seriesData[2][this.xField]} \n ${this.yField}: ${seriesData[2][this.yField]}`
            );

        textBreak(textElement, '\n');

        // const parseTextNode = textElement.node().getBoundingClientRect();
        const parseTextNode = textElement.node().getBBox();

        const textWidth = Math.floor(parseTextNode.width) + 9;
        const textHeight = Math.floor(parseTextNode.height) + 5;

        let xPosition = seriesData[0] + this.chartBase.chartMargin.left + this.currentBarWidth;
        let yPosition = seriesData[1] + this.chartBase.chartMargin.top - textHeight;

        if (xPosition + textWidth > geometry.width + 5) {
            xPosition = xPosition - textWidth;
        }

        this.tooltipGroup
            .attr('transform', `translate(${xPosition}, ${yPosition})`)
            .selectAll('rect')
            .attr('width', textWidth)
            .attr('height', textHeight);
    }

    private drawTooltipPoint(
        geometry: ContainerSize, 
        position: Array<number>, 
        style:{fill: string}
    ) {
        this.selectionGroup.selectAll('.tooltip-point')
            .data([geometry])
            .join(
                (enter) => enter.append('rect').attr('class', 'tooltip-point'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('x', position[0])
            .attr('y', position[1])
            .attr('height', geometry.height)
            .attr('width', geometry.width)
            .attr('fill', colorDarker(style.fill, 2));
    }

    private drawSelectionPoint(
        geometry: ContainerSize, 
        position: Array<number>, 
        style:{fill: string}
    ) {
        this.selectionGroup.selectAll('.selection-point')
            .data([geometry])
            .join(
                (enter) => enter.append('rect').attr('class', 'selection-point'),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('stroke-width', 3)
            .style('stroke', colorDarker(style.fill, 2))
            .attr('fill', colorDarker(style.fill, 1))
            .attr('x', position[0])
            .attr('y', position[1])
            .attr('height', geometry.height)
            .attr('width', geometry.width);
    }

    // drawLegend(keys: string[], z: any, width: number) {
    //     const legendKey = keys.slice().reverse();
    //     const legend = this.legendGroup.selectAll('.legend-item-group')
    //         .data(legendKey)
    //         .join(
    //             (enter) => enter.append('g').attr('class', 'legend-item-group'),
    //             (update) => {
    //                 update.selectAll('*').remove();
    //                 return update;
    //             },
    //             (exit) => exit.remove()
    //         )
    //         .attr('transform', (d: any, i: number) => { return 'translate(0,' + i * 20 + ')'; });
      
    //     legend.append('rect')
    //         .attr('x', width - 19)
    //         .attr('width', 19)
    //         .attr('height', 19)
    //         .attr('fill', (d) => {
    //             return z(d) + '';
    //         });
      
    //     legend.append('text')
    //         .attr('x', width - 24)
    //         .attr('y', 9.5)
    //         .attr('dy', '0.32em')
    //         .text((d) => { return d; });
    // }
}