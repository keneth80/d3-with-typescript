import { Selection, select, BaseType, mouse, event } from 'd3-selection';
import { scaleOrdinal, scaleBand } from 'd3-scale';
import { format } from 'd3-format';

import { Scale, ContainerSize } from '../../chart/chart.interface';
import { SeriesBase } from '../../chart/series-base';
import { colorDarker } from '../../chart/util/d3-svg-util';
import { SeriesConfiguration } from '../../chart/series.interface';

export interface GroupedHorizontalBarSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    columns: string[];
}

export class GroupedHorizontalBarSeries extends SeriesBase {
    private xField: string;

    private yField: string;

    private columns: string[];

    private rootGroup: Selection<BaseType, any, HTMLElement, any>;

    private legendGroup: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private numberFmt: any;

    constructor(configuration: GroupedHorizontalBarSeriesConfiguration) {
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

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === 'bottom').scale;
        const y: any = scales.find((scale: Scale) => scale.orient === 'left').scale;

        const barx: any = scaleBand()
            .domain(this.columns)
            .rangeRound([0, x.bandwidth()]);

        // set the colors
        const z = scaleOrdinal()
            .range(this.chartBase.seriesColors);

        z.domain(this.columns);

        this.mainGroup.selectAll('.grouped-horizontal-item-group')
            .data(chartData)
            .join(
                (enter) => enter.append('g')
                            .attr('class', 'grouped-horizontal-item-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('transform', (d: any) => {
                return `translate( ${x(d[this.xField])} ,0)`;
            })
            .selectAll('.grouped-horizontal-item')
                .data((data: any) => {
                    return this.columns.map(
                        (key: string, index: number) => { return {key, value: data[key], data, index}; }
                    );
                })
                .join(
                    (enter) => {
                        const enterElements = enter.append('rect').attr('class', 'grouped-horizontal-item');
                        if (this.chartBase.tooltip) {
                            enterElements.on('mouseover', (d: any, i, nodeList: any) => {
                                select(nodeList[i])
                                    .style('fill', () => colorDarker(z(d.key), 2)) // point
                                    // .style('stroke', '#f5330c')
                                    // .style('stroke-width', 2);

                                this.tooltipGroup = this.chartBase.showTooltip();
                                select(nodeList[i]).classed('tooltip', true);
                            })
                            .on('mouseout', (d: any, i, nodeList: any) => {
                                select(nodeList[i])
                                    .style('fill', () => z(d.key) + '') // point
                                    // .style('stroke', null)
                                    // .style('stroke-width', null);

                                this.chartBase.hideTooltip();
                                select(nodeList[i]).classed('tooltip', false);
                            })
                            .on('mousemove', (d: any, i: number, nodeList: any) => {
                                const textElement: any = this.tooltipGroup.select('text').text(`${d.key}: ${this.numberFmt(d.value)}`);
                                const textWidth = textElement.node().getComputedTextLength() + 10;

                                let xPosition = x(d.data[this.xField]) + (d.index * barx.bandwidth());
                                const yPosition = event.offsetY -30;
                                if (xPosition + textWidth > geometry.width) {
                                    xPosition = xPosition - textWidth;
                                }
                                this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`).selectAll('rect').attr('width', textWidth);
                            })
                            .on('click', (data: any) => {
                                event.preventDefault();
                                event.stopPropagation();
                                this.itemClickSubject.next(data);
                            });
                        }

                        return enterElements;
                    },
                    (update) => update,
                    (exit) => exit.remove()
                )
                .attr('x', (d: any) => { return barx(d.key); })
                .attr('y', (d: any) => { return (d.value < 0 ? y(0) : y(d.value)); })
                .attr('height', (d: any) => { return Math.abs(y(d.value) - y(0)); })
                .attr('width', barx.bandwidth())
                .attr('fill', (d: any) => z(d.key) + '');
        // this.drawLegend(this.columns, z, geometry.width);
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