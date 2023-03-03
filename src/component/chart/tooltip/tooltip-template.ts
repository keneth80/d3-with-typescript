import {Selection, BaseType} from 'd3-selection';

export const baseTooltipTemplate = (
    group: Selection<BaseType, any, HTMLElement, any>,
    boxStyle?: {fill: string; opacity: number; stroke: string},
    textStyle?: {fiil: number; size: number}
) => {
    group
        .selectAll('.tooltip-background')
        .data(['background'])
        .join(
            (enter) => enter.append('rect').attr('class', 'tooltip-background'),
            (update) => update,
            (exit) => exit.remove()
        )
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 60)
        .attr('height', 20)
        .style('fill', '#111')
        .style('fill-opacity', 0.6);

    group
        .selectAll('.tooltip-text')
        .data(['text'])
        .join(
            (enter) => enter.append('text').attr('class', 'tooltip-text'),
            (update) => update,
            (exit) => exit.remove()
        )
        .attr('x', 5)
        .attr('dy', '1.2em')
        .style('text-anchor', 'start')
        .style('fill', '#fff')
        .attr('font-size', '14px')
        .attr('font-weight', '100');

    return group;
};

export const colorTooltipTemplate = (
    group: Selection<BaseType, any, HTMLElement, any>,
    boxStyle?: {fill: string; opacity: number; stroke: string; strokeWidth?: number},
    textStyle?: {fiil: number; size: number}
) => {
    group
        .selectAll('.tooltip-background')
        .data(['tooltip-background'])
        .join(
            (enter) => enter.append('rect').attr('class', 'tooltip-background'),
            (update) => update,
            (exit) => exit.remove()
        )
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 60)
        .attr('height', 20)
        .attr('rx', 0)
        .attr('ry', 0)
        .style('stroke', boxStyle?.stroke ?? '#000')
        .style('stroke-width', boxStyle?.strokeWidth ?? 1)
        .style('fill', boxStyle?.fill ?? '#111')
        .style('fill-opacity', boxStyle?.opacity ?? 1);

    group
        .selectAll('.tooltip-text')
        .data(['tooltip-text'])
        .join(
            (enter) => enter.append('text').attr('class', 'tooltip-text'),
            (update) => update,
            (exit) => exit.remove()
        )
        .attr('x', 5)
        .attr('dy', '1.2em')
        .style('text-anchor', 'start')
        .style('fill', textStyle?.fiil ?? '#000')
        .style('font-size', textStyle?.size + 'px' ?? '14px')
        .style('font-weight', '100');

    return group;
};
