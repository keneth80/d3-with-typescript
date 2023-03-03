import {Selection, select, BaseType} from 'd3-selection';
import {linkVertical} from 'd3-shape';

import {Scale, ContainerSize} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {getElementInfoByEvent, getTransformByArray, wrapTextByRowLimit} from '../../chart/util/d3-svg-util';
import {SeriesConfiguration} from '../../chart/series.interface';

export class Geometry {
    id: string = '';
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    rx: number = 0;
    ry: number = 0;

    constructor(id: string = '', x: number = 0, y: number = 0, width: number = 0, height: number = 0, rx: number = 0, ry: number = 0) {
        Object.assign(this, {
            id,
            x,
            y,
            width,
            height,
            rx,
            ry
        });
    }
}

export class TopologyGroupElement extends Geometry {
    data: any;
    members: any[] = [];

    constructor(
        id: string = '',
        x: number = 0,
        y: number = 0,
        width: number = 0,
        height: number = 0,
        rx: number = 0,
        ry: number = 0,
        data: any = {},
        members: any[] = []
    ) {
        super();
        Object.assign(this, {
            id,
            x,
            y,
            width,
            height,
            rx,
            ry,
            data: {...data},
            members: [...members]
        });
    }
}

export class GeometryLink {
    id: string = '';
    parent: string = '';
    from: string = '';
    to: string = '';

    constructor(id: string = '', parent: string = '', from: string = '', to: string = '') {
        Object.assign(this, {
            id,
            parent,
            from,
            to
        });
    }
}

export class TopologyData {
    groups: TopologyGroupElement[] = [];
    machines: TopologyGroupElement[] = [];

    constructor(groups: TopologyGroupElement[] = [], machines: TopologyGroupElement[] = []) {
        Object.assign(this, {
            groups,
            machines
        });
    }
}

export interface BasicTopologyConfiguration extends SeriesConfiguration {
    memberSelectedHandler?: any;
}

export class BasicTopology extends SeriesBase {
    protected linkGroup: Selection<any, any, HTMLElement, any>;

    private currentSector: any;

    private boldColor: string = '#0384fc';

    constructor(configuration: BasicTopologyConfiguration) {
        super(configuration);
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>) {
        this.svg = svg;
        if (!mainGroup.select(`.${this.selector}-group`).node()) {
            this.mainGroup = mainGroup.append('g').attr('class', `${this.selector}-group`);
        }

        if (!mainGroup.select(`.${this.selector}-link-group`).node()) {
            this.linkGroup = mainGroup.append('g').attr('class', `${this.selector}-link-group`);
        }

        // TODO: svg zoom group을 삭제 한다? 아니면 mouse handler 연결
        // 우선 zoom group 삭제.
        if (this.svg.select('g.zoom-group').node()) {
            this.svg.select('g.zoom-group').remove();
        }
    }

    drawSeries(chartData: TopologyData[], scales: Scale[], geometry: ContainerSize) {
        const groups: TopologyGroupElement[] = chartData[0].groups;
        const SECTOR_PADDING = 10;
        const MEMBER_PADDING = 5;
        const MACHINE_PADDING = 10;
        const MAX_MEMBER_WIDTH = 100;
        const MAX_MACHINE_WIDTH = 100;
        const sectorSize = groups.length;
        let currentMemberCount = 0;
        let bottomStartIndex = 0;
        const memberCountList = groups.map((item: TopologyGroupElement, index: number) => {
            return item.members.length;
        });
        const memberSize = memberCountList.reduce((prev: number, current: number) => +prev + +current);
        for (let i = 0; i < memberCountList.length; i++) {
            currentMemberCount += memberCountList[i];
            // console.log(`MemberCount ${i}: ${memberCountList[i]} => ${currentMemberCount}`);
            if (memberSize / 2 <= currentMemberCount) {
                bottomStartIndex = i;
                break;
            }
        }

        const topSectorSize = bottomStartIndex + 1;
        const memberPaddingCount = currentMemberCount + topSectorSize;
        const bottomGroupSize = sectorSize - topSectorSize;
        // padding 을 뺀 width
        const calcWidth = geometry.width - SECTOR_PADDING * (topSectorSize - 1) - MEMBER_PADDING * memberPaddingCount;

        // sector y point
        const sectorPoint = geometry.height / (sectorSize > 1 ? 3 : 2);

        // secgor height
        const sectorHeight = sectorPoint * 0.75;
        const memberWidth = calcWidth / currentMemberCount > MAX_MEMBER_WIDTH ? MAX_MEMBER_WIDTH : calcWidth / currentMemberCount;
        // group title height
        const titleHeight = 30;
        // group title height를 뺀 값을 height로
        const memberHeight = sectorHeight - titleHeight * 2;

        // background 설정
        this.mainGroup
            .selectAll('.background')
            .data(['background'])
            .join(
                (enter) => enter.append('rect').attr('class', 'background'),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('fill', 'none');

        const sectorPositions: number[][] = [];
        const topSectors = groups.filter((data: TopologyGroupElement, index: number) => index < topSectorSize);
        const bottomSectors = groups.filter((data: TopologyGroupElement, index: number) => index >= topSectorSize);
        const machineSectors = chartData[0].machines;

        // 상단 그리기
        const topSectorGroup: Selection<BaseType, TopologyGroupElement, BaseType, any> = this.mainGroup
            .selectAll(`.${this.selector}-sector-top-group`)
            .data(topSectors)
            .join(
                (enter) => enter.append('g').attr('class', `${this.selector}-sector-top-group`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('id', (data: TopologyGroupElement, index: number) => {
                return data.data.frameworkID.toLowerCase();
            })
            .attr('transform', (data: TopologyGroupElement, index: number) => {
                let x = 0;
                let y = 0;
                if (index > 0) {
                    const prevData = topSectors[index - 1];
                    const prevDataMemberSize = prevData.members.length;
                    x = prevDataMemberSize * memberWidth + MEMBER_PADDING * (prevDataMemberSize + 1);
                    x += sectorPositions[index - 1][0] + SECTOR_PADDING;
                    y += sectorPositions[index - 1][1];
                }
                // POINT: 좌표, 사이즈 갱신
                data.x = x;
                data.y = y;
                data.width = data.members.length * memberWidth + MEMBER_PADDING * (data.members.length + 1);
                data.height = sectorHeight;
                sectorPositions.push([data.x, data.y, data.width, data.height]);
                return `translate(${data.x}, ${data.y})`;
            });

        // top sector background
        this.drawSectorBackground(topSectorGroup, `${this.selector}-sector-top-group-background`, '#e1e1e3');

        // top sector title
        this.drawSectorTitle(topSectorGroup, `${this.selector}-sector-top-group-title`, 'top');

        topSectorGroup.on('mouseover', this.onSectorMouseOver).on('mouseout', this.onSectorMouseOut);

        const topGroupTotalWidth = sectorPositions[topSectorSize - 1][0] + sectorPositions[topSectorSize - 1][2];
        if (sectorPositions.length && geometry.width > topGroupTotalWidth) {
            // 상단 center 정렬
            const moveX = geometry.width / 2 - topGroupTotalWidth / 2;
            topSectorGroup.attr('transform', (data: TopologyGroupElement) => {
                data.x = data.x + moveX;
                // sector가 하나일 경우에만 예외로 가운데 정렬.
                if (sectorSize < 2) {
                    const moveY = sectorPoint / 2 - data.height / 2;
                    data.y = data.y + moveY;
                }
                return `translate(${data.x}, ${data.y})`;
            });
        }

        // member draw start
        this.drawMember(
            topSectorGroup,
            this.selector,
            {
                width: memberWidth,
                height: memberHeight,
                limitWidth: MAX_MEMBER_WIDTH
            },
            MEMBER_PADDING,
            'top'
        )
            .on('mouseover', this.onMemberMouseOver)
            .on('mouseout', this.onMemberMouseOut);

        // 하단 그리기
        const bottomSectorGroup: Selection<BaseType, TopologyGroupElement, BaseType, any> = this.mainGroup
            .selectAll(`.${this.selector}-sector-bottom-group`)
            .data(bottomSectors)
            .join(
                (enter) => enter.append('g').attr('class', `${this.selector}-sector-bottom-group`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('id', (data: TopologyGroupElement, index: number) => {
                return data.data.frameworkID.toLowerCase();
            })
            .attr('transform', (data: TopologyGroupElement, index: number) => {
                let x = 0;
                const y = sectorPoint * 2 + (sectorPoint - sectorHeight);
                if (index > 0) {
                    const prevData = bottomSectors[index - 1];
                    const prevDataMemberSize = prevData.members.length;
                    x = prevDataMemberSize * memberWidth + MEMBER_PADDING * (prevDataMemberSize + 1);
                    x += sectorPositions[topSectorSize + index - 1][0] + SECTOR_PADDING;
                }
                data.x = x;
                data.y = y;
                data.width = data.members.length * memberWidth + MEMBER_PADDING * (data.members.length + 1);
                data.height = sectorHeight;
                sectorPositions.push([data.x, data.y, data.width, data.height]);
                return `translate(${data.x}, ${data.y})`;
            });
        // bottom sector background
        this.drawSectorBackground(bottomSectorGroup, `${this.selector}-sector-bottom-group-background`);

        // bottom sector title
        this.drawSectorTitle(bottomSectorGroup, `${this.selector}-sector-bottom-group-title`, 'bottom');

        // TODO: 타이틀과 백그라운드 클릭 포인트를 같게 하기위해 투명한 판 생성

        bottomSectorGroup.on('mouseover', this.onSectorMouseOver).on('mouseout', this.onSectorMouseOut);

        const bottomGroupTotalWidth = sectorPositions[sectorPositions.length - 1][0] + sectorPositions[sectorPositions.length - 1][2];
        if (sectorPositions.length && geometry.width > bottomGroupTotalWidth) {
            // 하단 center 정렬
            const moveX = geometry.width / 2 - bottomGroupTotalWidth / 2;
            bottomSectorGroup.attr('transform', (data: TopologyGroupElement) => {
                data.x = data.x + moveX;
                return `translate(${data.x}, ${data.y})`;
            });
        }

        this.drawMember(
            bottomSectorGroup,
            this.selector,
            {width: memberWidth, height: memberHeight, limitWidth: MAX_MEMBER_WIDTH},
            MEMBER_PADDING,
            'bottom'
        )
            .on('mouseover', this.onMemberMouseOver)
            .on('mouseout', this.onMemberMouseOut);

        // machine 그리기
        const machinePosition: number[][] = [];
        const calcMachineWidth = (geometry.width - MACHINE_PADDING * (machineSectors.length - 1)) / machineSectors.length;
        const machineWidth = Math.min(Math.min(sectorHeight, MAX_MACHINE_WIDTH), calcMachineWidth);
        const machineTotalWidth = MACHINE_PADDING * (machineSectors.length - 1) + machineWidth * machineSectors.length;
        const movex = geometry.width / 2 - machineTotalWidth / 2;
        const machineGroup: Selection<BaseType, TopologyGroupElement, BaseType, any> = this.mainGroup
            .selectAll(`.${this.selector}-sector-machine-group`)
            .data(machineSectors)
            .join(
                (enter) => enter.append('g').attr('class', `${this.selector}-sector-machine-group`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('id', (data: TopologyGroupElement) => {
                return data.data.machineAlias.toLowerCase();
            })
            .attr('transform', (data: TopologyGroupElement, index: number) => {
                const x = index * (machineWidth + MACHINE_PADDING) + movex;
                const y = sectorPoint + (sectorPoint - machineWidth) / 2;

                data.x = x;
                data.y = y;
                data.width = machineWidth;
                data.height = machineWidth;
                machinePosition.push([data.x, data.y, data.width, data.height]);
                return `translate(${data.x}, ${data.y})`;
            });

        this.drawSectorBackground(machineGroup, `${this.selector}-sector-machine-group-background`, '#fff', '#ccc');

        this.drawMachine(machineGroup, this.selector, {width: machineWidth, height: machineWidth, limitWidth: MAX_MACHINE_WIDTH});

        machineGroup.on('mouseover', this.onMachineOver).on('mouseout', this.onMachineOut);

        const positions = this.getPositionFromTarget(
            this.mainGroup,
            topSectors,
            machineSectors,
            {width: memberWidth, height: memberHeight},
            {width: machineWidth, height: machineWidth},
            'top'
        ).concat(
            this.getPositionFromTarget(
                this.mainGroup,
                bottomSectors,
                machineSectors,
                {width: memberWidth, height: memberHeight},
                {width: machineWidth, height: machineWidth},
                'bottom'
            )
        );

        // link draw
        const vlink = linkVertical()
            .source((d: any) => d[0])
            .target((d: any) => d[1])
            .x((d: any) => {
                return d.x;
            })
            .y((d: any) => {
                return d.y;
            });

        this.linkGroup
            .selectAll(`.${this.selector}-machine-link`)
            .data(positions)
            .join((enter) => enter.append('path').attr('class', `${this.selector}-machine-link`))
            .attr('id', (d: any) => {
                return d[0].data + '-' + d[1].data;
            })
            .attr('d', vlink)
            .style('stroke', '#888')
            .style('stroke-width', 1)
            .style('fill', 'none');
    }

    private onMachineOver = (event: PointerEvent, data: TopologyGroupElement) => {
        this.currentSector = select(event.target as HTMLElement).style('stroke', this.boldColor);
        const machineAlias = data.data.machineAlias.toLowerCase();
        const links = this.linkGroup.selectAll(`path.${this.selector}-machine-link`).data();

        // member opacity 조정
        this.mainGroup
            .selectAll(`g.${this.selector}-member-group`)
            .filter((item: any, i: number, node: any) => {
                const memeberId = select(node[i]).attr('id');
                return (
                    links.findIndex((link: any) => {
                        return link[0].data === memeberId && link[1].data === machineAlias;
                    }) === -1
                );
            })
            .style('opacity', 0.5);

        // member filter
        this.mainGroup
            .selectAll(`g.${this.selector}-member-group`)
            .filter((item: any, i: number, node: any) => {
                const memeberId = select(node[i]).attr('id');
                return (
                    links.findIndex((link: any) => {
                        return link[0].data === memeberId && link[1].data === machineAlias;
                    }) > -1
                );
            })
            .style('stroke', this.boldColor);

        // line filter
        this.linkGroup
            .selectAll(`path.${this.selector}-machine-link`)
            .filter((item: any) => item[1].data === machineAlias)
            .style('stroke', this.boldColor);

        // machine opacity 조정.
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-machine-group`)
            .filter((item: any) => item.id !== data.id)
            .style('opacity', 0.5);

        event.stopPropagation();
    };

    private onMachineOut = (event: PointerEvent, data: TopologyGroupElement) => {
        this.currentSector = select(event.target as HTMLElement).style('stroke', '');
        this.mainGroup.selectAll(`g.${this.selector}-sector-machine-group`).style('opacity', '');
        this.mainGroup.selectAll(`g.${this.selector}-member-group`).style('stroke', '').style('opacity', '');
        this.initStyle();

        event.stopPropagation();
    };

    private onSectorMouseOver = (event: PointerEvent, data: TopologyGroupElement) => {
        this.currentSector = select(event.target as HTMLElement).style('stroke', this.boldColor);
        const selectIps: any = [];
        let currentIp = '';
        data.members.forEach((member: any) => {
            if (currentIp !== member.machineIP) {
                selectIps.push(member.machineIP);
                currentIp = member.machineIP;
            }
        });

        // machine filter
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-machine-group`)
            .filter((item: any) => selectIps.indexOf(item.data.machineID) > -1)
            .style('stroke', this.boldColor);

        // machine opacity 조정.
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-machine-group`)
            .filter((item: any) => selectIps.indexOf(item.data.machineID) === -1)
            .style('opacity', 0.5);

        this.mainGroup
            .selectAll(`g.${this.selector}-sector-top-group`)
            .filter((item: any) => data.id !== item.id)
            .style('opacity', 0.5);

        this.mainGroup
            .selectAll(`g.${this.selector}-sector-bottom-group`)
            .filter((item: any) => data.id !== item.id)
            .style('opacity', 0.5);

        this.linkGroup
            .selectAll(`.${this.selector}-machine-link`)
            .filter((item: any) => {
                return data.members.findIndex((member: any) => member.memberID.toLowerCase() === item[0].data) > -1;
            })
            .style('stroke', this.boldColor);

        this.linkGroup
            .selectAll(`.${this.selector}-machine-link`)
            .filter((item: any) => {
                return data.members.findIndex((member: any) => member.memberID.toLowerCase() === item[0].data) === -1;
            })
            .style('opacity', 0.5);

        event.stopPropagation();
    };

    private onSectorMouseOut = (event: PointerEvent, data: TopologyGroupElement) => {
        this.currentSector = select(event.target as HTMLElement).style('stroke', '');
        this.initStyle();

        event.stopPropagation();
    };

    private onMemberMouseOver = (event: PointerEvent, data: TopologyGroupElement) => {
        const {index} = getElementInfoByEvent(event);
        const memberData = data.members[index];

        const machineData: any = this.mainGroup
            .selectAll(`g.${this.selector}-sector-machine-group`)
            .filter((item: any) => memberData.machineIP === item.data.machineID)
            .data()[0];

        // machine filter
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-machine-group`)
            .filter((item: any) => memberData.machineIP === item.data.machineID)
            .style('stroke', this.boldColor);

        // machine opacity 조정.
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-machine-group`)
            .filter((item: any) => memberData.machineIP !== item.data.machineID)
            .style('opacity', 0.5);

        // 선택된 타깃 bold
        this.currentSector = select(event.target as HTMLElement).style('stroke', this.boldColor);

        // 맴버에 연결된 라인 bold
        this.linkGroup.select(`#${memberData.memberID.toLowerCase()}-${machineData.data.machineAlias.toLowerCase()}`).style('stroke', this.boldColor);

        // 선택된 맴버를 제외한 나머지 맴버의 opacity를 조정.
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-top-group`)
            .filter((item: any) => item.data.frameworkID === memberData.frameworkID)
            .selectAll(`g.${this.selector}-member-group`)
            .filter((item: any, i: number) => {
                return i !== index;
            })
            .style('opacity', 0.5);

        this.mainGroup
            .selectAll(`g.${this.selector}-sector-bottom-group`)
            .filter((item: any) => item.data.frameworkID === memberData.frameworkID)
            .selectAll(`g.${this.selector}-member-group`)
            .filter((item: any, i: number) => {
                return i !== index;
            })
            .style('opacity', 0.5);

        // 선택된 맴버가 속하지 않는 framework opacity 조정.
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-top-group`)
            .filter((item: any) => data.id !== item.id)
            .style('opacity', 0.5);

        // 선택된 맴버가 속하지 않는 framework opacity 조정.
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-bottom-group`)
            .filter((item: any) => data.id !== item.id)
            .style('opacity', 0.5);

        // 다른 라인들의 opacity 조정.
        this.linkGroup
            .selectAll(`.${this.selector}-machine-link`)
            .filter((item: any) => {
                return memberData.memberID.toLowerCase() !== item[0].data;
            })
            .style('opacity', 0.5);

        event.stopPropagation();
    };

    private onMemberMouseOut = (event: PointerEvent, data: TopologyGroupElement) => {
        const {index} = getElementInfoByEvent(event);
        this.currentSector = select(event.target as HTMLElement).style('stroke', '');
        this.initStyleByMember(data, index);
        this.initStyle();

        event.stopPropagation();
    };

    private initStyleByMember(data: TopologyGroupElement, index: number) {
        const memberData = data.members[index];
        this.mainGroup
            .selectAll(`g.${this.selector}-sector-top-group`)
            .filter((item: any) => item.data.frameworkID === memberData.frameworkID)
            .selectAll(`g.${this.selector}-member-group`)
            .filter((item: any) => item.memberID !== memberData.memberID)
            .style('opacity', '');

        this.mainGroup
            .selectAll(`g.${this.selector}-sector-bottom-group`)
            .filter((item: any) => item.data.frameworkID === memberData.frameworkID)
            .selectAll(`g.${this.selector}-member-group`)
            .filter((item: any) => item.memberID !== memberData.memberID)
            .style('opacity', '');
    }

    private initStyle() {
        this.mainGroup.selectAll(`g.${this.selector}-sector-top-group`).style('opacity', '');
        this.mainGroup.selectAll(`g.${this.selector}-sector-bottom-group`).style('opacity', '');
        this.mainGroup.selectAll(`g.${this.selector}-sector-machine-group`).style('stroke', '').style('opacity', '');
        this.linkGroup.selectAll(`path.${this.selector}-machine-link`).style('stroke', '#888').style('opacity', '');
    }

    private getPositionFromTarget(
        targetGroup: Selection<BaseType, TopologyGroupElement, BaseType, any>,
        sectors: TopologyGroupElement[],
        machines: TopologyGroupElement[],
        memberSize: {width: number; height: number},
        machineSize: {width: number; height: number},
        placement: string
    ): any[] {
        const positions: any = [];
        sectors.forEach((item: TopologyGroupElement) => {
            const currentSector = targetGroup.select(`#${item.data.frameworkID.toLowerCase()}`);
            const parentPosition = getTransformByArray(currentSector.attr('transform'));
            for (let i = 0; i < item.members.length; i++) {
                const currentMember = currentSector.select(`#${item.members[i].memberID.toLowerCase()}`);
                const memberPosition = getTransformByArray(currentMember.attr('transform'));
                const position = [];
                position.push({
                    x: +parentPosition[0] + +memberPosition[0] + memberSize.width / 2,
                    y: +parentPosition[1] + +memberPosition[1] + (placement === 'top' ? memberSize.height : 0),
                    data: item.members[i].memberID.toLowerCase()
                });
                for (let j = 0; j < machines.length; j++) {
                    if (item.members[i].machineIP === machines[j].data.machineID) {
                        const currentMachine = targetGroup.select(`#${machines[j].data.machineAlias.toLowerCase()}`);
                        const machinePosition = getTransformByArray(currentMachine.attr('transform'));
                        position.push({
                            x: +machinePosition[0] + machineSize.width / 2,
                            y: +machinePosition[1] + (placement === 'top' ? 0 : machineSize.height),
                            data: machines[j].data.machineAlias.toLowerCase()
                        });
                        positions.push(position);
                        break;
                    }
                }
            }
        });

        return positions;
    }

    private drawSectorBackground(
        targetGroup: Selection<BaseType, TopologyGroupElement, BaseType, any>,
        selector: string,
        color: string = '#e1e1e3',
        stroke: string = 'none'
    ) {
        // sector background
        return targetGroup
            .selectAll(`.${selector}`)
            .data((d: TopologyGroupElement) => [d])
            .join(
                (enter) => enter.append('rect').attr('class', selector),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('rx', (data: TopologyGroupElement) => {
                return data.rx;
            })
            .attr('ry', (data: TopologyGroupElement) => {
                return data.ry;
            })
            .attr('width', (data: TopologyGroupElement) => {
                return data.width;
            })
            .attr('height', (data: TopologyGroupElement) => {
                return data.height;
            })
            .style('stroke', stroke)
            .style('fill', color);
    }

    private drawSectorTitle(targetGroup: Selection<BaseType, TopologyGroupElement, BaseType, any>, selector: string, placement: string = 'top') {
        // sector title
        return targetGroup
            .selectAll(`.${selector}`)
            .data((d: TopologyGroupElement) => [d])
            .join(
                (enter) => enter.append('text').attr('class', selector),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('x', 10)
            .attr('y', (data: TopologyGroupElement) => {
                return placement === 'top' ? 20 : data.height - 8;
            })
            .style('font-size', '16px')
            .text((data: TopologyGroupElement) => {
                const txts = data.data.fullName.split('.');
                return `${txts[1]}`;
            });
    }

    private drawMember(
        targetGroup: Selection<BaseType, TopologyGroupElement, BaseType, any>,
        selector: string,
        memberGeometry: {width: number; height: number; limitWidth: number},
        memberPadding: number,
        placement: string = 'top'
    ): Selection<BaseType, any, BaseType, any> {
        const topPadding = 30;
        // image size
        const imagePadding = memberGeometry.width * 0.1;
        const imageWidth = memberGeometry.width - imagePadding * 2;
        const imageHeight = memberGeometry.width - imagePadding * 2;
        // text size
        // TODO: text height를 구해야함.
        let textHeight = 12;
        const r = (imageWidth * 0.7) / 2;

        // member draw start
        const memberGroup: Selection<BaseType, any, BaseType, any> = targetGroup
            .selectAll(`.${selector}-member-group`)
            .data((d: TopologyGroupElement) => d.members)
            .join(
                (enter) => enter.append('g').attr('class', `${selector}-member-group`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('id', (data: any) => {
                return data.memberID.toLowerCase();
            })
            .attr('transform', (data: any, index: number) => {
                const x = memberPadding + (memberPadding + memberGeometry.width) * index;
                const y = topPadding;
                // const y = placement === 'top' ? topPadding : bottomPadding;
                return `translate(${x}, ${y})`;
            });

        memberGroup
            .selectAll(`.${selector}-member-group-background`)
            .data((d: any) => [d])
            .join(
                (enter) => enter.append('rect').attr('class', `${selector}-member-group-background`),
                (update) => update,
                (exit) => exit.remove()
            )
            .style('fill', '#fff')
            .attr('rx', 5)
            .attr('ry', 5)
            .attr('width', memberGeometry.width)
            .attr('height', memberGeometry.height);

        memberGroup
            .selectAll(`.${selector}-member-icon`)
            .data((d: any) => [d])
            .join(
                (enter) => enter.append('image').attr('class', `${selector}-member-icon`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('x', imagePadding)
            .attr('y', imagePadding)
            .attr('width', imageWidth)
            .attr('height', imageHeight)
            .attr('xlink:href', (d: any) => {
                return 'assets/image/topology_container_stopped.svg';
            });

        const texts = memberGroup
            .selectAll(`.${selector}-member-title`)
            .data((d: any) => [d])
            .join(
                (enter) => enter.append('text').attr('class', `${selector}-member-title`),
                (update) => update,
                (exit) => exit.remove()
            )
            .text((data: any) => {
                const fullNames = data.fullName.split('_');
                return fullNames[fullNames.length - 1];
            })
            .style('font-size', (d: any, index: number, nodeList: any) => {
                // const r = (imageWidth - imagePadding) / 2;
                // return Math.min(2 * r, (2 * r - 8) / nodeList[index].getComputedTextLength() * 24) + 'px';
                const fontSize = memberGeometry.width < memberGeometry.limitWidth ? 12 : 14;
                // TODO: max width check
                return fontSize + 'px';
            })
            .attr('x', (d: any, index: number, nodeList: any) => {
                return memberGeometry.width / 2 - nodeList[index].getComputedTextLength() / 2;
            })
            .attr('y', (d: any, index: number, nodeList: any) => {
                textHeight = nodeList[index].getBBox().height;
                return imageHeight + textHeight;
            })
            .attr('dy', '.35em');

        // y position 센터로 정렬
        const movey = (memberGeometry.height - imagePadding * 2) / 2 - (imageHeight + textHeight) / 2;
        memberGroup.selectAll(`.${selector}-member-icon`).attr('y', imagePadding + movey);
        memberGroup.selectAll(`.${selector}-member-title`).attr('y', imageHeight + textHeight + imagePadding + movey);

        // text 자르기
        texts.each((d: any, index, nodeList: any) => {
            wrapTextByRowLimit(select(nodeList[index]), memberGeometry.width, 1);
        });

        return memberGroup;
    }

    private drawMachine(
        targetGroup: Selection<BaseType, TopologyGroupElement, BaseType, any>,
        selector: string,
        machineGeometry: {width: number; height: number; limitWidth: number}
    ): Selection<BaseType, any, BaseType, any> {
        // image size
        const imagePadding = machineGeometry.width * 0.15;
        const imageWidth = machineGeometry.width - imagePadding * 2.5;
        const imageHeight = machineGeometry.width - imagePadding * 2.5;
        // text size
        let textHeight = 12;
        const r = (imageWidth * 0.7) / 2;

        // machine draw start
        targetGroup
            .selectAll(`.${selector}-machine-icon`)
            .data((d: TopologyGroupElement) => [d])
            .join(
                (enter) => enter.append('image').attr('class', `${selector}-machine-icon`),
                (update) => update,
                (exit) => exit.remove()
            )
            .attr('x', machineGeometry.width / 2 - imageWidth / 2)
            .attr('y', imagePadding / 2)
            .attr('width', imageWidth)
            .attr('height', imageHeight)
            .attr('xlink:href', (d: any) => {
                return 'assets/image/topology_machine_connected.svg';
            });

        const texts = targetGroup
            .selectAll(`.${selector}-machine-title`)
            .data((d: TopologyGroupElement) => [d])
            .join(
                (enter) => enter.append('text').attr('class', `${selector}-machine-title`),
                (update) => update,
                (exit) => exit.remove()
            )
            .text((data: TopologyGroupElement) => {
                return data.data.machineAlias;
            })
            .style('font-size', () => {
                // const r = (imageWidth - imagePadding) / 2;
                // return Math.min(2 * r, (2 * r - 8) / nodeList[index].getComputedTextLength() * 24) + 'px';
                const fontSize = machineGeometry.width < machineGeometry.limitWidth ? 12 : 14;
                // TODO: max width check
                return fontSize + 'px';
            })
            .attr('x', (d: any, index: number, nodeList: any) => {
                // textWrapping(select(nodeList[index]), machineGeometry.width);
                return machineGeometry.width / 2 - nodeList[index].getComputedTextLength() / 2;
            })
            .attr('y', (d: any, index: number, nodeList: any) => {
                textHeight = nodeList[index].getBBox().height;
                return imageHeight + textHeight + imagePadding / 2;
            });
        // .attr('dy', '.35em')
        // text 자르기
        texts.each((d: any, index, nodeList: any) => {
            wrapTextByRowLimit(select(nodeList[index]), machineGeometry.width, 1);
        });

        // y position 센터로 정렬
        // const movey = (memberGeometry.height - imagePadding * 2) / 2 - (imageHeight + textHeight) / 2;
        // memberGroup.selectAll(`.${this.selector}-member-icon`)
        //     .attr('y', imagePadding + movey);
        // memberGroup.selectAll(`.${this.selector}-member-title`)
        //     .attr('y', imageHeight + textHeight +imagePadding + movey);

        return targetGroup;
    }
}
