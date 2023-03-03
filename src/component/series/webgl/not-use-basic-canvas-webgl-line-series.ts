import {Selection, BaseType, select} from 'd3-selection';
import {quadtree} from 'd3-quadtree';
import {scaleLinear} from 'd3-scale';
import {Subject} from 'rxjs';

import {Scale, ContainerSize, DisplayOption, DisplayType} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';
import {textBreak} from '../../chart/util/d3-svg-util';
import {delayExcute} from '../../chart/util/d3-svg-util';
import {Placement} from '../../chart/chart-configuration';
import {createProgramFromSources, hexToRgb} from '../../chart/util/webgl-util';
import {ChartSelector} from '../../chart';

export class BasicCanvasWebglLineSeriesModel {
    x: number;
    y: number;
    i: number; // save the index of the point as a property, this is useful
    data: any;

    constructor(
        x: number,
        y: number,
        i: number, // save the index of the point as a property, this is useful
        data: any
    ) {
        Object.assign(this, {
            x,
            y,
            i,
            data
        });
    }
}

export interface BasicCanvasWebglLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    dot?: {
        radius?: number;
    };
    style?: {
        strokeWidth?: number;
        strokeColor?: string;
        fill?: string;
        opacity?: number;
    };
    filter?: any;
    data?: any[];
    // animation?: boolean;
}

export class BasicCanvasWebgLineSeries<T = any> extends SeriesBase {
    protected canvas: Selection<HTMLCanvasElement, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private config: BasicCanvasWebglLineSeriesConfiguration;

    private dataFilter: any;

    private strokeWidth = 2;

    private strokeColor;

    private strokeOpacity = 1;

    private seriesIndex = -1;

    // private isAnimation: boolean = false;

    private move$: Subject<any> = new Subject();

    private seriesData: T[];

    // ================= webgl 관련 변수 ================ //
    private gl: any;

    private shaderProgram: any;

    // ================= zoom 관련 변수 ================ //
    private restoreCanvas: any;

    // ================= style 관련 변수 =============== //
    private radius = 4;

    private lineStroke = 1;

    private lineColor = '#000000';

    constructor(configuration: BasicCanvasWebglLineSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        this.dataFilter = configuration.filter;
        if (configuration.style) {
            this.strokeWidth = configuration.style.strokeWidth ?? this.strokeWidth;
            this.strokeColor = configuration.style.strokeColor ?? null;
            this.strokeOpacity = configuration.style.opacity ?? 1;
        }

        if (configuration.data) {
            this.seriesData = configuration.data;
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, mainGroup: Selection<BaseType, any, HTMLElement, any>, index: number) {
        this.seriesIndex = index;

        this.svg = svg;

        this.svg.style('position', 'absolute');

        this.setTooltipCanvas(this.svg);

        if (!this.chartBase.chartContainer.select('.' + ChartSelector.DRAWING_CANVAS).node()) {
            this.canvas = this.chartBase.chartContainer
                .append('canvas')
                .datum({
                    index
                })
                .attr('class', ChartSelector.DRAWING_CANVAS)
                .style('opacity', this.strokeOpacity)
                .style('z-index', 2)
                .style('position', 'absolute');
        } else {
            this.canvas = this.chartBase.chartContainer.select('.' + ChartSelector.DRAWING_CANVAS);
        }

        if (!this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS).node()) {
            this.chartBase.chartContainer
                .append('canvas')
                .datum({
                    index
                })
                .attr('class', ChartSelector.SELECTION_CANVAS)
                .style('z-index', 98)
                .style('position', 'absolute');
        }
    }

    drawSeries(chartBaseData: any, scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        this.seriesIndex = option.index;

        this.geometry = geometry;

        this.radius = this.config?.dot?.radius ?? 4;

        this.lineStroke = this.config?.style?.strokeWidth ?? 1;

        this.lineColor = this.strokeColor ? this.strokeColor : option.color;

        const chartData = this.seriesData ? this.seriesData : chartBaseData;

        const xScale: Scale = scales.find((scale: Scale) => scale.orient === Placement.BOTTOM);
        const yScale: Scale = scales.find((scale: Scale) => scale.orient === Placement.LEFT);
        // const yScale: Scale = scales.find((scale: Scale) => scale.field === this.yField);

        const x: any = xScale.scale;
        const y: any = yScale.scale;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        const lineData: any[] = (!this.dataFilter ? chartData : chartData.filter((item: T) => this.dataFilter(item))).filter(
            (d: any) =>
                d[this.config.xField] >= xmin - xmin * 0.01 &&
                d[this.config.xField] <= xmax + xmax * 0.01 &&
                d[this.config.yField] >= ymin &&
                d[this.config.yField] <= ymax
        );
        // console.timeEnd('data_generate' + this.selector);

        this.canvas
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${this.chartBase.chartMargin.left + 1}px, ${this.chartBase.chartMargin.top}px)`);

        this.chartBase.chartContainer
            .select('.' + ChartSelector.SELECTION_CANVAS)
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${this.chartBase.chartMargin.left + 1}px, ${this.chartBase.chartMargin.top}px)`);

        if (this.restoreCanvas && option.displayType === DisplayType.ZOOMOUT) {
            (this.canvas.node() as any)
                .getContext('2d')
                .drawImage(this.restoreCanvas.node(), 0, 0, geometry.width, geometry.height, 0, 0, geometry.width, geometry.height);
        } else {
            this.webGLStart(lineData, {min: xmin, max: xmax}, {min: ymin, max: ymax}, geometry, this.lineColor);
        }

        // canvas로 drawImage 했을때 라인이 픽셀로 지그재그로 보이는 현상이 있음 antialicing 적용방법이 필요함.
        // 아니면 그냥 다시 그리도록 함.

        if (option.displayType === DisplayType.RESIZE) {
            this.restoreCanvas = undefined;
        }

        delayExcute(150, () => {
            // TODO: restore 시에만 적용.
            if (option.displayType === DisplayType.ZOOMOUT) {
                (this.canvas.node() as any)
                    .getContext('2d')
                    .drawImage(
                        this.chartBase.webglCanvasElement.node(),
                        0,
                        0,
                        geometry.width * 6,
                        geometry.height * 6,
                        0,
                        0,
                        geometry.width * 6,
                        geometry.height * 6
                    );
            }

            if (option.displayType === DisplayType.ZOOMOUT && !this.restoreCanvas) {
                this.restoreCanvas = select(document.createElement('CANVAS'));
                this.restoreCanvas.attr('width', geometry.width).attr('height', geometry.height);
                (this.restoreCanvas.node() as any).getContext('2d').drawImage(this.chartBase.webglCanvasElement.node(), 0, 0);
            }
        });

        delayExcute(200, () => {
            this.viewClear();
        });

        if (this.originQuadTree) {
            this.originQuadTree = undefined;
        }

        delayExcute(300 + this.seriesIndex * 10, () => {
            // quadtree setup: data indexing by position
            this.originQuadTree = quadtree()
                .extent([
                    [0, 0],
                    [geometry.width, geometry.height]
                ])
                .addAll(
                    lineData.map<any>((d: any) => {
                        const xposition = x(d[this.config.xField]);
                        const yposition = y(d[this.config.yField]);

                        return [xposition, yposition, d];
                    })
                );
        });
    }

    select(displayName: string, isSelected: boolean) {
        this.canvas.style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.canvas.style('opacity', !isHide ? null : 0);
    }

    destroy() {
        if (this.seriesData) {
            this.seriesData.length = 0;
        }
        this.subscription.unsubscribe();
        this.canvas.remove();
    }

    getSeriesDataByPosition(value: number[]) {
        return this.search(this.originQuadTree, value[0] - this.radius, value[1] - this.radius, value[0] + this.radius, value[1] + this.radius);
    }

    showPointAndTooltip(value: number[], selected: any[]) {
        // const index = Math.floor(selected.length / 2);
        const index = selected.length - 1;
        const selectedItem = selected[index];

        this.drawTooltipPoint(this.geometry, selectedItem, {
            radius: this.radius / 2 + 1,
            strokeColor: this.lineColor,
            strokeWidth: this.strokeWidth
        });

        this.setChartTooltip(
            selectedItem,
            {
                width: this.geometry.width,
                height: this.geometry.height
            },
            value
        );

        return index;
    }

    onSelectItem(selectedItem: any[], position: any[]) {}

    clear() {
        this.viewClear();
    }

    // TEST
    getCanvasNode() {
        return this.canvas.node() as any;
    }

    // TEST
    getGeometry() {
        return this.geometry;
    }

    drawTargetSeries() {
        (this.canvas.node() as any).getContext('2d').drawImage(this.chartBase.webglCanvasElement.node(), 0, 0);
    }

    // TODO: tooltip에 시리즈 아이디를 부여하여 시리즈 마다 tooltip을 컨트롤 할 수 있도록 한다.
    // multi tooltip도 구현해야 하기 때문에 이방법이 가장 좋음. 현재 중복으로 발생해서 왔다갔다 함.
    private setChartTooltip(seriesData: any, geometry: ContainerSize, mouseEvent: number[]) {
        if (this.chartBase.isTooltipDisplay) {
            return;
        }

        this.tooltipGroup = this.chartBase.showTooltip();

        const textElement: any = this.tooltipGroup
            .select('text')
            .attr('dy', '.1em')
            .text(
                this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser
                    ? this.chartBase.tooltip.tooltipTextParser(seriesData)
                    : `${this.xField}: ${seriesData[2][this.config.xField]} \n ${this.yField}: ${seriesData[2][this.config.yField]}`
            );

        textBreak(textElement, '\n');

        // const parseTextNode = textElement.node().getBoundingClientRect();
        const parseTextNode = textElement.node().getBBox();

        const textWidth = parseTextNode.width + 7;
        const textHeight = parseTextNode.height + 5;
        const radius = this.config.dot ? this.config.dot.radius ?? 4 : 0;

        let xPosition = mouseEvent[0] + this.chartBase.chartMargin.left + radius;
        let yPosition = mouseEvent[1];

        if (xPosition + textWidth > geometry.width) {
            xPosition = xPosition - textWidth;
        }

        if (yPosition + textHeight > geometry.height) {
            yPosition = yPosition - textHeight;
        }

        this.tooltipGroup
            .attr('transform', `translate(${xPosition}, ${yPosition})`)
            .selectAll('rect')
            .attr('width', textWidth)
            .attr('height', textHeight);
    }

    private webGLStart(chartData: T[], xAxis: {min: number; max: number}, yAxis: {min: number; max: number}, geometry: ContainerSize, color: string) {
        const endCount = chartData.length;

        // data generate
        const vertices = this.makeVertices(chartData, xAxis, yAxis);

        // 캔버스 얻어오기
        const canvas: HTMLCanvasElement = this.canvas.node() as HTMLCanvasElement;

        // 초기화
        this.initGL(canvas);

        // this.viewClear();

        if (this.seriesIndex === 0) {
            // 화면 지우기
            this.viewClear();

            // 깊이버퍼 활성화
            // this.gl.enable(this.gl.DEPTH_TEST);
        }

        // 버퍼 초기화
        const lineVertexBuffer = this.initBuffers(vertices, 3, endCount);

        // 쉐이더 초기화
        this.initShaders(color, geometry, vertices, 0.9);

        // console.time('webgldraw-' + this.selector);
        // 라인 그리기
        this.drawScene(lineVertexBuffer, endCount, canvas as HTMLCanvasElement, this.gl.LINE_STRIP);

        // 버퍼 초기화
        const pointVertexBuffer = this.initBuffers(vertices, 3, endCount);

        // 쉐이더 초기화
        this.initShaders(color, geometry, vertices, 1);

        // 포인트 그리기
        this.drawScene(pointVertexBuffer, endCount, canvas as HTMLCanvasElement, this.gl.POINTS);
        // console.timeEnd('webgldraw-' + this.selector);
    }

    private initGL(canvas: HTMLCanvasElement) {
        try {
            if (!this.gl) {
                this.gl = this.chartBase.webglElementContext;
            }
            this.gl.viewportWidth = canvas.width;
            this.gl.viewportHeight = canvas.height;
        } catch (e) {
            if (console && console.log) {
                console.log(e);
            }
        }

        if (!this.gl) {
            alert('Could not initialise WebGL, sorry T.T');
        }
    }

    private initShaders(color: string, geometry: ContainerSize, vertices: any, alpha: number = 1) {
        const radius = this.config?.dot?.radius ?? 6;

        // Vertex shader source code
        const vertCodeSquare = `
        attribute vec3 coordinates;

        void main(void) {
            gl_Position = vec4(coordinates, 1.0);
            gl_PointSize = ${radius}.0;
        }
        `;

        // const vertCodeSquare =
        // `
        // attribute vec3 coordinates;
        // attribute vec2 a_normal;
        // uniform float u_linewidth;
        // uniform mat4 u_mv_matrix;
        // uniform mat4 u_p_matrix;

        // void main() {
        //     u_linewidth = 0.5;
        //     a_normal = 1;
        //     vec4 delta = vec4(a_normal * u_linewidth, 0, 0);
        //     vec4 pos = u_mv_matrix * vec4(coordinates, 0, 1);
        //     gl_Position = u_p_matrix * (pos + delta);
        // }
        // `;

        // Create a vertex shader object
        const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);

        // Attach vertex shader source code
        this.gl.shaderSource(vertShader, vertCodeSquare);

        // Compile the vertex shader
        this.gl.compileShader(vertShader);

        // const colors = [
        //     1.0,  1.0,  1.0,  1.0,    // 흰색
        //     1.0,  0.0,  0.0,  1.0,    // 빨간색
        //     0.0,  1.0,  0.0,  1.0,    // 녹색
        //     0.0,  0.0,  1.0,  1.0     // 파란색
        // ];

        const tempColor = hexToRgb(color);
        const colorStr = `${(tempColor[0] / 255).toFixed(1)}, ${(tempColor[1] / 255).toFixed(1)}, ${(tempColor[2] / 255).toFixed(1)}, ${
            alpha === 1 ? '1.0' : alpha + ''
        }`;
        const fragCode = `
        precision mediump float;
        void main(void) {
            // float r = 0.0, delta = 0.0, alpha = 1.0;
            // vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            // r = dot(cxy, cxy);
            // if (r > 1.0) {
            //     discard;
            // }
            gl_FragColor = vec4(${colorStr});
        }`;

        // Create fragment shader object
        const fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        // Attach fragment shader source code
        this.gl.shaderSource(fragShader, fragCode);

        // Compile the fragmentt shader
        this.gl.compileShader(fragShader);

        // Create a shader program object to store
        // the combined shader program
        this.shaderProgram = this.gl.createProgram();

        // Attach a vertex shader
        this.gl.attachShader(this.shaderProgram, vertShader);

        // Attach a fragment shader
        this.gl.attachShader(this.shaderProgram, fragShader);

        // Link both the programs
        this.gl.linkProgram(this.shaderProgram);

        // Use the combined shader program object
        this.gl.useProgram(this.shaderProgram);

        // this.gl.uniform1f(this.gl.getUniformLocation(this.shaderProgram, 'antialiased'), 1);

        // const pointSizeRange = this.gl.getParameter(this.gl.ALIASED_POINT_SIZE_RANGE);
        // const pointRadius = Math.min(pointSizeRange[1]/2, 16);
        // const pointSizeUniformLocation = this.gl.getUniformLocation(this.shaderProgram, 'pointSize');
        // this.gl.uniform1f(pointSizeUniformLocation, pointRadius * 2);

        // this.gl.uniform1f(this.gl.getUniformLocation(this.shaderProgram, 'pointSize'), 4 * 2);

        // this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.ZERO, this.gl.ONE);

        this.gl.enable(this.gl.BLEND);

        this.gl.enable(this.gl.CULL_FACE);

        this.gl.cullFace(this.gl.FRONT);
    }

    private makeVertices(chartData: any, xAxis: any, yAxis: any) {
        // data 만들기
        const xScale = scaleLinear().domain([xAxis.min, xAxis.max]).range([-1, 1]); // [-0.99, 0.99]

        const yScale = scaleLinear().domain([yAxis.min, yAxis.max]).range([-1, 1]); // [-0.99, 0.99]

        const vertices = [];

        const endCount = chartData.length;

        for (let i = 0; i < endCount; i++) {
            const xposition = xScale(chartData[i][this.config.xField]);
            const yposition = yScale(chartData[i][this.config.yField]);

            vertices.push(xposition);
            vertices.push(yposition);
            vertices.push(0);
        }

        return vertices;
    }

    private initBuffers(vertices: number[] = [], itemSize: number, numItems: number): any {
        // example
        /*
        // 사각형 좌표
        vertices = [
            1.0,  1.0,  0.0,
            -1.0,  1.0,  0.0,
            1.0, -1.0,  0.0,
            -1.0, -1.0,  0.0
        ];

        vertexBuffer.itemSize = 3; // 3 (col)
        vertexBuffer.numItems = 4; // 4 (row)
        */

        // Create an empty buffer object
        const vertexBuffer = this.gl.createBuffer();
        vertexBuffer.itemSize = itemSize;
        vertexBuffer.numItems = numItems;

        // Bind appropriate array buffer to it
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);

        // Pass the vertex data to the buffer
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

        // Unbind the buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        return vertexBuffer;
    }

    private drawScene(buffer: any, dataSize: number, canvas: HTMLCanvasElement, glType: any) {
        // 창을 설정
        this.gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);

        if (this.seriesIndex === 0) {
            // 화면 지우기
            this.viewClear();
        }

        // Bind vertex buffer object
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

        // Get the attribute location
        const coord = this.gl.getAttribLocation(this.shaderProgram, 'coordinates');

        // Point an attribute to the currently bound VBO
        this.gl.vertexAttribPointer(coord, buffer.itemSize, this.gl.FLOAT, false, 0, 0);

        // Enable the attribute
        this.gl.enableVertexAttribArray(coord);

        this.gl.lineWidth(1 / 1000);

        this.gl.drawArrays(glType, 0, dataSize);

        // Bind vertex buffer object
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        // delayExcute(100 + this.seriesIndex * 10, () => {
        //     if (!this.originalChartImage) {
        //         // this.originalChartImage = new Image();
        //         // this.originalChartImage.src = canvas.toDataURL('image/png');

        //         canvas.toBlob((blob) => {
        //             this.originalChartImage = new Image();
        //             // this.originalChartImage.src = canvas.toDataURL('image/png');
        //             this.originalChartImage.onload = () =>  URL.revokeObjectURL(this.originalChartImage.src);  // no longer need to read the blob so it's revoked
        //             this.originalChartImage.src = URL.createObjectURL(blob);
        //         });
        //     }
        // });
    }

    private execRestore(image: any, width: number, height: number) {
        const shaderCode = `
        attribute vec2 a_position;

        uniform vec2 u_resolution;
        uniform mat3 u_matrix;

        varying vec2 v_texCoord;

        void main() {

            gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
            v_texCoord = a_position;
        }
        `;

        const fragCode = `
        precision mediump float;

        // our texture
        uniform sampler2D u_image;

        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;

        void main() {
            gl_FragColor = texture2D(u_image, v_texCoord);
        }
        `;

        const canvas: HTMLCanvasElement = this.canvas.node() as HTMLCanvasElement;

        // 초기화
        this.initGL(canvas);

        const gl = this.gl;
        // const program = createProgramFromScripts(gl, ['2d-vertex-shader', '2d-fragment-shader'], null, null, null);
        const program = createProgramFromSources(gl, [shaderCode, fragCode], null, null, null);
        gl.useProgram(program);

        // look up where the vertex data needs to go.
        const positionLocation = gl.getAttribLocation(program, 'a_position');

        // look up uniform locations
        const uImageLoc = gl.getUniformLocation(program, 'u_image');
        const uMatrixLoc = gl.getUniformLocation(program, 'u_matrix');

        // provide texture coordinates for the rectangle.
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set the parameters so we can render any size image.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // Upload the image into the texture.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        const dstX = 0;
        const dstY = 0;
        const dstWidth = width;
        const dstHeight = height;

        // convert dst pixel coords to clipspace coords
        const clipX = (dstX / gl.canvas.width) * 2 - 1;
        const clipY = (dstY / gl.canvas.height) * -2 + 1;
        const clipWidth = (dstWidth / gl.canvas.width) * 2;
        const clipHeight = (dstHeight / gl.canvas.height) * -2;

        // build a matrix that will stretch our
        // unit quad to our desired size and location
        gl.uniformMatrix3fv(uMatrixLoc, false, [clipWidth, 0, 0, 0, clipHeight, 0, clipX, clipY, 1]);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    private drawTooltipPoint(
        geometry: ContainerSize,
        selectedItem: [number, number, any][],
        style: {radius: number; strokeColor: string; strokeWidth: number}
    ) {
        const selectionCanvas = this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS);
        const context = (selectionCanvas.node() as any).getContext('2d');
        context.clearRect(0, 0, geometry.width, geometry.height);
        context.fillStyle = style.strokeColor;
        context.lineWidth = style.strokeWidth;
        context.strokeStyle = '#000000';
        // cx, cy과 해당영역에 출력이 되는지? 좌표가 마이너스면 출력 안하는 로직을 넣어야 함.
        const cx = +selectedItem[0];
        const cy = +selectedItem[1];
        if (cx < 0 || cy < 0) {
            return;
        }
        const rectSize = style.radius * 2.5;
        context.beginPath();
        context.fillRect(cx - rectSize / 2, cy - rectSize / 2, rectSize, rectSize);
        // context.strokeRect(cx - style.radius - 0.5, cy - style.radius + 0.5, style.radius * 2, style.radius * 2);
        // context.arc(pointer.cx, pointer.cy, pointer.r, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        context.stroke();
    }

    private viewClear() {
        // 화면 지우기
        this.gl.clearColor(0, 0, 0, 0); // rgba

        // 화면 지우기
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Enable depth testing
        // this.gl.enable(this.gl.DEPTH_TEST);

        // this.gl.depthFunc(this.gl.LEQUAL);
    }
}
