import { Selection, select, BaseType, mouse, event } from 'd3-selection';
import { scaleOrdinal, scaleBand } from 'd3-scale';
import { format } from 'd3-format';

import { Scale, ContainerSize } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { colorDarker, delayExcute, textBreak } from '../../chart/util/d3-svg-util';
import { SeriesConfiguration } from '../../chart/series.interface';
import { quadtree } from 'd3';
import { ChartBase } from '../../chart';

export interface GroupedVerticalBarSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    columns: Array<string>;
}

export class GroupedVerticalBarSeries extends SeriesBase {
    private xField = '';

    private yField = '';

    private columns: Array<string>;

    private rootGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    protected selectionGroup: Selection<BaseType, any, HTMLElement, any>;

    private numberFmt: any;

    private currentSelector: any;

    private isHide = false;

    private currentBarWidth = 0;

    constructor(configuration: GroupedVerticalBarSeriesConfiguration) {
        super(configuration);
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.columns) {
                this.columns = [...configuration.columns];
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

        const barx: any = scaleBand()
            .domain(this.columns)
            .rangeRound([0, x.bandwidth()]);

        this.currentBarWidth = barx.bandwidth();
        this.geometry = {
            width: 0,
            height: 0
        };
        this.geometry.width = geometry.width;
        this.geometry.height = geometry.height;

        // set the colors
        const z = scaleOrdinal()
            .range(this.chartBase.seriesColors);

        z.domain(this.columns);

        this.mainGroup.selectAll('.grouped-bar-item-group')
            .data(chartData)
            .join(
                (enter) => enter.append('g')
                            .attr('class', 'grouped-bar-item-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('transform', (d: any) => {
                return `translate( ${x(d[this.xField])} ,0)`;
            })
            .selectAll('.grouped-bar-item')
                .data((data: any) => { 
                    return this.columns.map(
                        (key: string, index: number) => { return {key: key, value: data[key], data, index}; }
                    ); 
                })
                .join(
                    (enter) => enter.append('rect').attr('class', 'grouped-bar-item'),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x', (d: any) => { return barx(d.key); })
                .attr('y', (d: any) => { return (d.value < 0 ? y(0) : y(d.value)); })
                .attr('height', (d: any) => { return Math.abs(y(d.value) - y(0)); })
                .attr('width', barx.bandwidth())
                .attr('fill', (d: any) => z(d.key) + '');
        
        // this.drawLegend(this.columns, z, geometry.width);

        // TODO: quadtree setup
        if (this.originQuadTree) {
            this.originQuadTree = undefined;
        }

        delayExcute(300, () => {
            let i, j = 0;
            const size = chartData.length;
            const columnSize = this.columns.length;
            const generateData: Array<any> = [];
            for ( i = 0; i < size; i++) {
                const d = chartData[i];
                const groupx = x(d[this.xField]);
                for (j = 0; j < columnSize; j++) {
                    const key = this.columns[j];
                    const itemx = groupx + barx(key);
                    const itemy = d[key] < 0 ? y(0) : y(d[key]);
                    // POINT: quadtree 에 저장 되는 데이터는
                    // [아이템의 x축, y축, 아이템의 데이터, 컬럼인덱스, 막대의 가로 사이즈, 막대의 세로 사이즈, 색상]
                    generateData.push([
                        itemx, itemy, d, j, key, barx.bandwidth(), Math.abs(y(d[key]) - y(0)), z(key) + ''
                    ]);
                }
            }

            this.originQuadTree = quadtree()
                .extent([[0, 0], [geometry.width, geometry.height]])
                .addAll(generateData);
        });
    }

    select(displayName: string, isSelected: boolean) {
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.isHide = isHide;
        this.mainGroup.selectAll(`.${this.selector}`).style('opacity', !isHide ? null : 0);
        
        // TODO: 좌표를 바꿀지 뎁스를 뒤로 보낼지 나중에 고민해볼 것.
        // if (this.isHide) {
        //     this.mainGroup.lower();
        // } else {
        //     this.mainGroup.raise();
        // }
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
        if (selected.length && !this.chartBase.isTooltipDisplay) {
            // const index = Math.floor(selected.length / 2);
            const index = selected.length - 1;
            const selectedItem = selected[index];

            this.drawTooltipPoint(
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
        if (mouseEvent[1] < seriesData[1]) {
            return;
        }


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
        this.selectionGroup.append('rect')
            .style('stroke-width', 3)
            .style('stroke', colorDarker(style.fill, 1))
            .attr('x', position[0])
            .attr('y', position[1])
            .attr('height', geometry.height)
            .attr('width', geometry.width)
            .attr('fill', colorDarker(style.fill, 0.5));
    }
}