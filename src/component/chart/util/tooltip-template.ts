import { Selection, BaseType } from 'd3-selection';

export const baseTooltipTemplate = (group: Selection<BaseType, any, HTMLElement, any>) => {
    group.selectAll('.tooltip-background')
            .data(['background'])
            .join(
                (enter) => enter.append('rect').attr('class', '.tooltip-background'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 60)
            .attr('height', 20)
            .attr('fill', '#111')
            .style('fill-opacity', 0.6);

    group.selectAll('.tooltip-text')
        .data(['text'])
        .join(
            (enter) => enter.append('text').attr('class', '.tooltip-text'),
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
}