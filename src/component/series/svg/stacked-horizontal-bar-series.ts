import {format} from 'd3-format';
import {scaleOrdinal} from 'd3-scale';
import {BaseType, pointer, select, Selection} from 'd3-selection';
import {stack} from 'd3-shape';

import {ContainerSize, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';
import {colorDarker} from '../../chart/util/d3-svg-util';

export interface StackedHorizontalBarSeriesConfiguration extends SeriesConfiguration {
    xField: string;
    yField: string;
    columns: string[];
}

export class StackedHorizontalBarSeries extends SeriesBase {
    private columns: string[];

    private rootGroup: Selection<BaseType, any, HTMLElement, any>;

    private legendGroup: Selection<any, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private numberFmt: any;

    private config: StackedHorizontalBarSeriesConfiguration;

    constructor(configuration: StackedHorizontalBarSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        this.columns = [...configuration.columns];
        this.numberFmt = format(',d');
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        this.rootGroup = mainGroup;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = this.rootGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select('.legend-group').node()) {
            this.legendGroup = this.rootGroup
                .append('g')
                .attr('class', 'legend-group')
                .attr('font-family', 'sans-serif')
                .attr('font-size', 10)
                .attr('text-anchor', 'end');
        }
    }

    drawSeries(chartData: any[], scales: Scale[], geometry: ContainerSize) {
        const x: any = scales.find((scale: Scale) => scale.orient === this.xDirection).scale;
        const y: any = scales.find((scale: Scale) => scale.orient === this.yDirection).scale;

        // set the colors
        const z = scaleOrdinal().range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']);

        const keys = this.columns;

        z.domain(keys);

        this.mainGroup
            .selectAll('.stacked-horizontal-group')
            .data(stack().keys(keys)(chartData))
            .join(
                (enter) => enter.append('g').attr('class', 'stacked-horizontal-group'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('fill', (d: any) => {
                return z(d.key) + '';
            })
            .attr('column', (d: any) => {
                return d.key;
            }) // point
            .selectAll('.stacked-horizontal-item')
            .data((d: any) => {
                return d;
            })
            .join(
                (enter) =>
                    enter
                        .append('rect')
                        .attr('class', 'stacked-horizontal-item')
                        .on('mouseover', (event: PointerEvent, d: any) => {
                            const target: any = event.target;
                            const column: string = target.parentNode.getAttribute('column');
                            const fill: string = z(column) + '';

                            select(target).style('fill', () => colorDarker(fill, 2)); // point
                            // .style('stroke', '#f5330c')
                            // .style('stroke-width', 2);

                            this.tooltipGroup = this.chartBase.showTooltip();
                            select(target).classed('tooltip', true);
                        })
                        .on('mouseout', (event: PointerEvent, d: any) => {
                            const target: any = event.target;
                            const column: string = target.parentNode.getAttribute('column');
                            const fill: string = z(column) + '';

                            select(target).style('fill', () => fill); // point
                            // .style('stroke', null)
                            // .style('stroke-width', null);

                            this.chartBase.hideTooltip();
                            select(target).classed('tooltip', false);
                        })
                        .on('mousemove', (event: PointerEvent, d: any) => {
                            const target: any = event.target;
                            const column: string = target.parentNode.getAttribute('column');
                            const xPosition = pointer(target)[0] + 10;
                            const yPosition = pointer(target)[1] - 10;
                            const textElement: any = this.tooltipGroup.select('text').text(`${column}: ${this.numberFmt(d.data[column])}`);

                            this.tooltipGroup.attr('transform', `translate(${this.chartBase.chartMargin.left + xPosition}, ${yPosition})`);
                            this.tooltipGroup.selectAll('rect').attr('width', textElement.node().getComputedTextLength() + 10);
                            // this.tooltipGroup.select('text').text(`${d[1] - d[0]}`);
                            // console.log('d : ', d, target, parent);
                        }),
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
        // this.drawLegend(keys, z, geometry.width);
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
