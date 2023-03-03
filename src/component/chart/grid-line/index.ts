import {BaseType, Selection} from 'd3-selection';
import {axisLeft, axisTop} from 'd3-axis';

import {Placement} from '../chart-configuration';
import {ContainerSize, Scale} from '../chart.interface';

export const drawGridLine = (
    svgGeometry: ContainerSize,
    scale: Scale,
    targetGroup: Selection<BaseType, any, BaseType, any>,
    option: {
        color: string;
        dasharray: number;
        opacity: number;
    }
) => {
    const gridLineGroup: Selection<BaseType, any, BaseType, any> = targetGroup
        .selectAll(`g.${scale.orient}-grid-line`)
        .data([scale])
        .join(
            (enter) => enter.append('g').attr('class', `${scale.orient}-grid-line`),
            (update) => update,
            (exit) => exit.remove()
        )
        // .style('stroke', option.color)
        .style('stroke-opacity', option.opacity)
        .style('stroke-dasharray', option.dasharray)
        .style('shape-rendering', 'crispEdges');

    const tickFmt: any = '';
    let targetAxis: any;
    if (scale.orient === Placement.TOP || scale.orient === Placement.BOTTOM) {
        targetAxis = axisTop(scale.scale).tickFormat(tickFmt).tickSize(-svgGeometry.height);
    } else {
        targetAxis = axisLeft(scale.scale).tickFormat(tickFmt).tickSize(-svgGeometry.width);
    }

    if (scale.tickSize) {
        targetAxis.ticks(scale.tickSize);
    }

    const gridLines = gridLineGroup.call(targetAxis);
    gridLines.select('path').remove();
    if (scale.orient === Placement.LEFT || scale.orient === Placement.RIGHT) {
        gridLines.select('g').remove();
    }
    gridLines.selectAll('line').style('stroke', option.color);
    gridLines.lower();
    return gridLines;
};
