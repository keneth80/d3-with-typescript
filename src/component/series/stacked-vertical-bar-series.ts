import { Selection, select, BaseType, mouse } from 'd3-selection';
import { scaleOrdinal } from 'd3-scale';
import { stack } from 'd3-shape';
import { format } from 'd3-format';

import { Scale, ContainerSize } from '../chart/chart-base';
import { SeriesBase } from '../chart/series-base';
import { colorDarker } from '../chart/util/d3-svg-util';
import { SeriesConfiguration } from '../chart/series.interface';

export interface StackedVerticalBarSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    columns: Array<string>;
}

export class StackedVerticalBarSeries extends SeriesBase {
    private xField: string;

    private yField: string;

    private columns: Array<string>;

    private rootGroup: Selection<BaseType, any, HTMLElement, any>;

    private legendGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private numberFmt: any;

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
        }

        this.numberFmt = format(',d');
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        this.rootGroup = mainGroup;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = this.rootGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select('.legend-group').node()) {
            this.legendGroup = this.rootGroup.append('g')
                .attr('class', 'legend-group')
                .attr('font-family', 'sans-serif')
                .attr('font-size', 10)
                .attr('text-anchor', 'end');
        }
    }

    drawSeries(chartData: Array<any>, scales: Array<Scale>, geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orient === 'left').scale;

        // set the colors
        const z = scaleOrdinal()
        .range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']);

        const keys = this.columns.slice(1);
        
        z.domain(keys);

        this.mainGroup.selectAll('.stacked-bar-group')
            .data(stack().keys(keys)(chartData))
            .join(
                (enter) => enter.append('g')
                            .attr('class', 'stacked-bar-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('fill', (d: any) => { return z(d.key) + ''; })
            .attr('column', (d: any) => { return d.key; }) // point
            .selectAll('.stacked-bar-item')
                .data((d: any) => { return d; })
                .join(
                    (enter) => enter.append('rect').attr('class', 'stacked-bar-item')
                        .on('mouseover', (d: any, i, nodeList: any) => {
                            const target: any = nodeList[i];
                            const column: string = target.parentElement.getAttribute('column');
                            const fill: string = z(column) + '';
                            
                            select(nodeList[i])
                                .style('fill', () => colorDarker(fill, 2)) // point
                                // .style('stroke', '#f5330c')
                                // .style('stroke-width', 2);

                            this.tooltipGroup = this.chartBase.showTooltip();
                            select(nodeList[i]).classed('tooltip', true);
                            
                        })
                        .on('mouseout', (d: any, i, nodeList: any) => {
                            const target: any = nodeList[i];
                            const column: string = target.parentElement.getAttribute('column');
                            const fill: string = z(column) + '';

                            select(nodeList[i])
                                .style('fill', () => fill) // point
                                // .style('stroke', null)
                                // .style('stroke-width', null);

                            this.chartBase.hideTooltip();
                            select(nodeList[i]).classed('tooltip', false);
                        })
                        .on('mousemove', (d: any, i, nodeList: any) => {
                            const target: any = nodeList[i];
                            const column: string = target.parentElement.getAttribute('column');
                            const xPosition = mouse(target)[0] + 10;
                            const yPosition = mouse(target)[1] - 10;
                            const textElement: any = this.tooltipGroup.select('text')
                                .text(`${column}: ${this.numberFmt(d.data[column])}`);

                            this.tooltipGroup.attr('transform', `translate(${this.chartBase.chartMargin.left + xPosition}, ${yPosition})`);
                            this.tooltipGroup.selectAll('rect')
                                .attr('width', textElement.node().getComputedTextLength() + 10);
                            // this.tooltipGroup.select('text').text(`${d[1] - d[0]}`);
                            // console.log('d : ', d, target, parent);
                        })
                        .on('click', (data: any) => {
                            event.preventDefault();
                            event.stopPropagation();
                            this.itemClickSubject.next(data);
                        }),
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x', (d: any) => { return x(d.data[this.xField]); })
                .attr('height', (d: any) => { return y(d[0]) - y(d[1]); })
                .attr('y', (d: any) => { return (d[1] < 0 ? y(0) : y(d[1])); })
                // TODO: 계산 적용해 볼 것.
                // .attr('height', (d: any) => { return Math.abs(y(d[0]) - y(d[1]) - y(0)); })
                .attr('width', x.bandwidth());
        
        this.drawLegend(keys, z, geometry.width);
    }

    drawLegend(keys: string[], z: any, width: number) {
        const legendKey = keys.slice().reverse();
        const legend = this.legendGroup.selectAll('.legend-item-group')
            .data(legendKey)
            .join(
                (enter) => enter.append('g').attr('class', 'legend-item-group'),
                (update) => {
                    update.selectAll('*').remove();
                    return update;
                },
                (exit) => exit.remove()
            )
            .attr('transform', (d: any, i: number) => { return 'translate(0,' + i * 20 + ')'; });
      
        legend.append('rect')
            .attr('x', width - 19)
            .attr('width', 19)
            .attr('height', 19)
            .attr('fill', (d) => {
                return z(d) + '';
            });
      
        legend.append('text')
            .attr('x', width - 24)
            .attr('y', 9.5)
            .attr('dy', '0.32em')
            .text((d) => { return d; });
    }
}