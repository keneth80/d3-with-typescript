import {drag} from 'd3-drag';
import {Selection} from 'd3-selection';
import {zoom} from 'd3-zoom';
import {Observable, Subject} from 'rxjs';

export interface SCROLL_BAR_MODEL {
    x: number;
    y: number;
    width: number;
    height: number;
    containerWidth: number;
    containerHeight: number;
    totalWidth: number;
    totalHeight: number;
}

export interface ScrollBarConfiguration {
    rootGroup: Selection<any, any, any, any>; // 상위 element group
    scrollAreaSize: {width: number; height: number}; // scroll 영역 사이즈
    clipPathName?: string;
    viewPortBackground?: Selection<any, any, any, any>; // item이 리스팅 되는 group (<g>) element 의 background
    padding?: number;
    scrollBarWidth?: number;
}

export class ObjectScrollBar {
    private SCROLLBAR_WIDTH: number = 6;
    private MIN_SCROLLBAR_HEIGHT: number = 15;
    private ITEM_PADDING: number = 0;

    private config: ScrollBarConfiguration;
    private listViewRootGroup: Selection<any, any, any, any>;
    private containerViewGroup: Selection<any, any, any, any>;
    private scrollGroup: Selection<any, any, any, any>;

    // scrollbar information
    private SCROLL_BAR_MODEL: SCROLL_BAR_MODEL = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        containerWidth: 0,
        containerHeight: 0,
        totalWidth: 0,
        totalHeight: 0
    };

    private scroller: Subject<number> = new Subject();

    constructor(config: ScrollBarConfiguration) {
        this.config = config;
        this.listViewRootGroup = config.rootGroup;
        this.containerViewGroup = config.viewPortBackground;
        this.ITEM_PADDING = this.config.padding || this.ITEM_PADDING;
        this.SCROLLBAR_WIDTH = this.config.scrollBarWidth || this.SCROLLBAR_WIDTH;
        this.init();
    }

    get scroller$(): Observable<number> {
        return this.scroller.asObservable();
    }

    get scrollBarModel(): SCROLL_BAR_MODEL {
        return this.SCROLL_BAR_MODEL;
    }

    draw() {
        // 전부 그린 후 scrollbar 를 setup.
        this.SCROLL_BAR_MODEL = this.setupFunctionListScrollbar(
            this.listViewRootGroup,
            this.containerViewGroup,
            this.scrollGroup,
            this.config.scrollAreaSize,
            {
                width: this.SCROLLBAR_WIDTH,
                height: this.MIN_SCROLLBAR_HEIGHT,
                padding: this.ITEM_PADDING
            }
        );
    }

    destroy() {
        this.listViewRootGroup.selectAll('*').remove();
    }

    private init() {
        // scroll wheel event
        const notZoom: any = zoom().scaleExtent([1, 1]).on('zoom', null);

        // wheel event만 살리고 zoom은 처리 안하기 위함.
        this.listViewRootGroup.call(notZoom).on('wheel.zoom', this.scrollWheelEventHandler);

        this.setScrollClipPath(this.listViewRootGroup, this.config.scrollAreaSize, this.config.clipPathName);

        this.listViewRootGroup.append('rect').attr('class', 'scroll-bar-background').style('fill', '#aaa');

        this.scrollGroup = this.listViewRootGroup.append('g').attr('class', 'scroll-group');
        this.scrollGroup.append('rect').attr('class', 'scroll-bar');
        this.scrollGroup.call(drag().touchable(true).on('drag', this.scrollDragEventHandler));
    }

    /**
     * @description : scroll 영역 setup
     * @param rootGroup : listing 되는 영역의 group element (max 사이즈를 가지는 target)
     * @param container : scroll 여부에 따라 사이즈를 조절해주기 위한 element (스크롤이 생기면 +scorllbar width, 스크롤이 없다면 -scorllbar width)
     * @param scrollButtonGroup : scroll bar 가 그려지고 동작하는 group element
     * @param scrollingWidth : scroll영역의 가로 사이즈
     */
    private setupFunctionListScrollbar(
        rootGroup: Selection<any, any, any, any>,
        container: Selection<any, any, any, any>,
        scrollButtonGroup: Selection<any, any, any, any>,
        scrollingAreaSize: {width: number; height: number},
        scrollBarSize: {width: number; height: number; padding: number}
    ): SCROLL_BAR_MODEL {
        // 전체 사이즈 기준 element
        let totalTargetElement = (rootGroup.node() as any).getBBox();

        // if (rootGroup instanceof SVGElement) { // check if node is svg element
        //     totalTargetElement = (rootGroup.node() as any).getBBox();
        // } else { // else is html element
        //     totalTargetElement = (rootGroup.node() as any).getBoundingClientRect();
        // }

        const totalWidth: number = totalTargetElement.width;
        const totalHeight: number = totalTargetElement.height + scrollBarSize.padding; // bottom padding

        // 보여지는 사이즈 기준 element (scroll 영역)
        const width: number = scrollingAreaSize.width;
        const height: number = scrollingAreaSize.height;

        const scrollBarWidth = scrollBarSize.width;

        let scrollBarHeight = height - (totalHeight - height);

        let x: number = width - scrollBarWidth;

        // scroll 여부.
        if (totalHeight - scrollBarSize.padding > height) {
            rootGroup
                .select('rect.scroll-bar-background')
                .attr('x', width - scrollBarWidth)
                .attr('y', 0)
                .attr('width', scrollBarWidth)
                .attr('height', height);

            scrollButtonGroup.attr('transform', `translate(${x}, 0)`);
            scrollButtonGroup
                .select('rect.scroll-bar')
                .style('fill', '#333')
                .attr('width', scrollBarWidth)
                .attr('height', scrollBarHeight < 0 ? scrollBarSize.height : scrollBarHeight)
                .attr('rx', 1)
                .attr('ry', 1);

            if (container) {
                container.attr('width', scrollingAreaSize.width);
            }
        } else {
            rootGroup.select('rect.scroll-bar-background').attr('width', 0).attr('height', 0);

            scrollButtonGroup.select('rect.scroll-bar').style('fill', 'none').attr('width', 0).attr('height', 0);

            if (container) {
                container.attr('width', scrollingAreaSize.width - scrollBarSize.width);
            }
        }

        // wheel, drag event를 처리 하기위한 fix된 data.
        const SCROLL_BAR_MODEL: SCROLL_BAR_MODEL = {
            x,
            y: 0,
            width: scrollBarWidth,
            height: scrollBarHeight,
            totalWidth,
            totalHeight,
            containerHeight: height,
            containerWidth: width
        };

        return SCROLL_BAR_MODEL;
    }

    /**
     *
     * @param svg : svg element
     */
    private setScrollClipPath(
        target: Selection<any, any, any, any>,
        containerSize: {width: number; height: number} = {width: 150, height: 50},
        clipPathName: string = 'scrollbox-clip-path'
    ) {
        const width: number = containerSize.width;
        const height: number = containerSize.height;
        const clipRect = target.append('clipPath').attr('id', clipPathName).append('rect');
        clipRect
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width + 4)
            .attr('height', height);
    }

    private scrollUpdate(diff: number) {
        if (this.SCROLL_BAR_MODEL.height >= this.SCROLL_BAR_MODEL.containerHeight) return;

        let max: number =
            this.SCROLL_BAR_MODEL.containerHeight - (this.SCROLL_BAR_MODEL.height < 0 ? this.MIN_SCROLLBAR_HEIGHT : this.SCROLL_BAR_MODEL.height);

        this.SCROLL_BAR_MODEL.y += diff;
        this.SCROLL_BAR_MODEL.y = Math.max(0, this.SCROLL_BAR_MODEL.y);
        this.SCROLL_BAR_MODEL.y = Math.min(max, this.SCROLL_BAR_MODEL.y);

        this.scrollGroup.attr('transform', `translate(${this.SCROLL_BAR_MODEL.x}, ${this.SCROLL_BAR_MODEL.y})`);

        let compare = 0;
        if (this.SCROLL_BAR_MODEL.height < 0) {
            compare = this.SCROLL_BAR_MODEL.y / (this.SCROLL_BAR_MODEL.containerHeight - this.MIN_SCROLLBAR_HEIGHT); // 10은 scrollbar height
            compare = this.SCROLL_BAR_MODEL.totalHeight * compare - (this.SCROLL_BAR_MODEL.y + this.MIN_SCROLLBAR_HEIGHT * compare); // 10은 scrollbar height
        } else {
            compare = this.SCROLL_BAR_MODEL.y;
        }

        this.scroller.next(compare);

        // this.functionListViewGroup.select('.function-item-group')
        //     .attr('transform', `translate(10, ${-1*(compare)})`);
    }

    /**
     * @description : scroll bar move event handler
     */
    private scrollDragEventHandler = (event: any) => {
        this.scrollUpdate(event.dy);
    };

    /**
     * @description : scroll bar wheel event handler
     */
    private scrollWheelEventHandler = (event: any) => {
        event.stopPropagation();
        this.scrollUpdate(event.deltaY);
    };
}
