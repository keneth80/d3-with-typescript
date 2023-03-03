import {quadtree} from 'd3-quadtree';
import {scaleLinear} from 'd3-scale';
import {BaseType, Selection} from 'd3-selection';

import {ChartSelector} from '../../chart';
import {ContainerSize, DisplayOption, DisplayType, Scale} from '../../chart/chart.interface';
import {SeriesBase} from '../../chart/series-base';
import {SeriesConfiguration} from '../../chart/series.interface';
import {colorDarker, delayExcute} from '../../chart/util/d3-svg-util';
import {setChartTooltipByPosition} from '../../chart/util/tooltip-util';
import {createProgramFromSources, hexToRgb} from '../../chart/util/webgl-util';

export class BasicCanvasWebglLineSeriesOneModel {
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

export interface BasicCanvasWebglLineSeriesOneConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    dot?: {
        radius?: number;
        fill?: string;
    };
    line?: {
        strokeWidth?: number;
        strokeColor?: string;
        // strokeOpacity?: number;
    };
    data?: any[];
    // animation?: boolean;
}

export class BasicCanvasWebgLineSeriesOne<T = any> extends SeriesBase {
    protected canvas: Selection<HTMLCanvasElement, any, HTMLElement, any>;

    private config: BasicCanvasWebglLineSeriesOneConfiguration;

    private seriesIndex = -1;

    private padding = 0;

    // ================= webgl 관련 변수 ================ //
    private gl: any;

    private shaderProgram: any;

    // ================= zoom 관련 변수 ================ //
    private displayType: DisplayType = DisplayType.NORMAL;

    private cashingVertices: number[] = [];

    // ================= style 관련 변수 =============== //
    private radius = 4;

    private dotFill = '';

    private strokeColor = '';

    private strokeWidth = 1;

    // private strokeOpacity = 1;

    constructor(configuration: BasicCanvasWebglLineSeriesOneConfiguration) {
        super(configuration);
        this.config = configuration;
    }

    xField() {
        return this.config.xField;
    }

    yField() {
        return this.config.yField;
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
                // .style('opacity', this.strokeOpacity)
                .style('z-index', 2)
                .style('position', 'absolute');
        } else {
            this.canvas = this.chartBase.chartContainer.select('.' + ChartSelector.DRAWING_CANVAS);
        }

        if (!this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS).node()) {
            this.chartBase.chartContainer
                .append('canvas')
                .attr('class', ChartSelector.SELECTION_CANVAS)
                .style('z-index', 98)
                .style('position', 'absolute');
        }
    }

    drawSeries(chartBaseData: T[], scales: Scale[], geometry: ContainerSize, option: DisplayOption) {
        this.displayType = option.displayType;
        this.seriesIndex = option.index;
        this.geometry = geometry;
        this.radius = this.config.dot ? this.config.dot.radius ?? 4 : 0;
        this.color = this.strokeColor = this.checkSeriesColor() ?? option.color;
        this.dotFill = this.config.dot && this.config.dot.fill ? this.config.dot.fill : option.color;

        const chartData = this.config.data ? this.config.data : chartBaseData;
        const xScale: Scale = scales.find((scale: Scale) => scale.orient === this.xDirection);
        const yScale: Scale = scales.find((scale: Scale) => scale.orient === this.yDirection);

        const x: any = xScale.scale;
        const y: any = yScale.scale;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        this.padding = 0;

        if (x.bandwidth) {
            this.padding = x.bandwidth() / 2;
        }

        // resize가 되면 cashing된 scale data를 초기화 한다.
        if (option.displayType === DisplayType.RESIZE) {
            this.cashingVertices.length = 0;
        }

        const lineData: any[] = !this.config.filter ? chartData : chartData.filter((item: T) => this.config.filter(item));
        // .filter(
        //     (d: T) =>
        //         d[this.config.xField] >= xmin - xmin * 0.01 &&
        //         d[this.config.xField] <= xmax + xmax * 0.01 &&
        //         d[this.config.yField] >= ymin &&
        //         d[this.config.yField] <= ymax
        // );

        this.canvas
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${this.chartBase.chartMargin.left + 1}px, ${this.chartBase.chartMargin.top}px)`);

        this.chartBase.chartContainer
            .select('.' + ChartSelector.SELECTION_CANVAS)
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${this.chartBase.chartMargin.left + 1}px, ${this.chartBase.chartMargin.top}px)`);

        this.webGLStart(lineData, {min: xmin, max: xmax}, {min: ymin, max: ymax}, geometry, this.strokeColor);

        if (this.originQuadTree) {
            this.originQuadTree = undefined;
        }

        const makeQuadtree = () => {
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

                        return [xposition, yposition, d, this.radius, this.radius, this.strokeColor];
                    })
                );
        };

        if (lineData.length >= 500000) {
            delayExcute(300 + this.seriesIndex * 10, makeQuadtree);
        } else {
            makeQuadtree();
        }
    }

    drawPointer(value: number[], selected: any[]): number {
        // const index = Math.floor(selected.length / 2);
        const index = selected.length - 1;
        const selectedItem = selected[index];

        this.drawTooltipPoint(this.geometry, selectedItem, {
            radius: this.radius / 2 + 1,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth
        });

        return index;
    }

    select(displayName: string, isSelected: boolean) {
        this.canvas.style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.canvas.style('opacity', !isHide ? null : 0);
    }

    onSelectItem(value: number[], selected: any[]) {
        const selectedItem = selected[0];
        this.drawSelectionPoint([selectedItem[0], selectedItem[1]], this.geometry, {
            fill: this.dotFill,
            radius: this.radius * 2
        });
    }

    destroy() {
        this.subscription.unsubscribe();
        if (this.canvas) {
            this.canvas.remove();
        }
        this.chartBase.chartContainer.select('.' + ChartSelector.TOOLTIP_CANVAS).remove();
        this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS).remove();
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
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth
        });

        setChartTooltipByPosition(
            this.chartBase.showTooltip(),
            this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser
                ? this.chartBase.tooltip.tooltipTextParser(selectedItem)
                : `${this.config.xField}: ${selectedItem[2][this.config.xField]} \n ${this.config.yField}: ${selectedItem[2][this.config.yField]}`,
            this.geometry,
            [selectedItem[0], selectedItem[1]],
            {
                width: this.radius,
                height: this.radius
            },
            {
                left: this.chartBase.chartMargin.left,
                top: this.chartBase.chartMargin.top
            }
        );

        // this.setChartTooltip(
        //     selectedItem,
        //     {
        //         width: this.geometry.width,
        //         height: this.geometry.height
        //     },
        //     value
        // );

        return index;
    }

    // onSelectItem(selectedItem: Array<any>, event: ChartMouseEvent) {
    //     if (selectedItem && selectedItem.length) {
    //         this.itemClickSubject.next({
    //             data: selectedItem[2],
    //             event: {
    //                 offsetX: event.position[0] + this.chartBase.chartMargin.left,
    //                 offsetY: event.position[1] + this.chartBase.chartMargin.top
    //             },
    //             target: {
    //                 width: 1,
    //                 height: 1
    //             }
    //         });
    //     }
    // }

    clear() {
        this.viewClear();
    }

    private checkSeriesColor() {
        return this.config.line && this.config.line.strokeColor ? this.config.line.strokeColor : null;
    }

    private webGLStart(chartData: T[], xAxis: {min: number; max: number}, yAxis: {min: number; max: number}, geometry: ContainerSize, color: string) {
        const endCount = chartData.length;

        if (
            (this.displayType === DisplayType.NORMAL && !this.cashingVertices.length) ||
            (this.displayType === DisplayType.ZOOMOUT && !this.cashingVertices.length)
        ) {
            this.cashingVertices = this.makeVertices(chartData, xAxis, yAxis);
        }

        // // // data generate
        // const vertices = this.isSizeUpdate ? this.makeVertices(chartData, xAxis, yAxis) : (this.isRestore ? this.cashingVertices : this.makeVertices(chartData, xAxis, yAxis));

        const vertices: any = this.displayType === DisplayType.ZOOMOUT ? this.cashingVertices : this.makeVertices(chartData, xAxis, yAxis);

        // 캔버스 얻어오기
        const canvas: HTMLCanvasElement = this.canvas.node() as HTMLCanvasElement;

        // 초기화
        this.initGL(canvas);

        if (this.seriesIndex === 0) {
            // 화면 지우기
            this.viewClear();
            // this.gl.clearColor(0, 0, 0, 0); // rgba

            // 깊이버퍼 활성화
            // this.gl.enable(this.gl.DEPTH_TEST);
        }

        if (!vertices.length) {
            return;
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
                const webglOption = {
                    alpha: true, // 캔버스에 알파 버퍼가 포함되어 있는지 를 나타내는 부울입니다.
                    antialias: true, // 항별칭을 수행할지 여부를 나타내는 부울
                    preserveDrawingBuffer: true, // 값이 true인 경우 버퍼가 지워지지 않으며 작성자가 지우거나 덮어쓸 때까지 해당 값을 보존합니다.
                    powerPreference: 'high-performance',
                    // depth: false, // 도면 버퍼에 최소 16비트의 깊이 버퍼가 있음을 나타내는 부울입니다.
                    // /**
                    //  * 웹GL 컨텍스트에 적합한 GPU 구성을 나타내는 사용자 에이전트에 대한 힌트입니다. 가능한 값은 다음과 같습니다.
                    // "default": 사용자 에이전트가 가장 적합한 GPU 구성을 결정하도록 합니다. 기본 값입니다.
                    // "high-performance": 전력 소비보다 렌더링 성능의 우선 순위를 지정합니다.
                    // "low-power": 렌더링 성능보다 절전의 우선 순위를 지정합니다.
                    //  */
                    premultipliedAlpha: true, // 페이지 작성자가 드로잉 버퍼에 미리 곱한 알파가 있는 색상이 포함되어 있다고 가정한다는 것을 나타내는 부울입니다.
                    stencil: true, // 도면 버퍼에 최소 8비트의 스텐실 버퍼가 있음을 나타내는 부울입니다.
                    // desynchronized: true, // 이벤트 루프에서 캔버스 페인트 주기의 비동기화를 해제하여 사용자 에이전트가 대기 시간을 줄이도록 힌트하는 부울
                    failIfMajorPerformanceCaveat: true // 시스템 성능이 낮거나 하드웨어 GPU를 사용할 수 없는 경우 컨텍스트가 생성될지 를 나타내는 부울수입니다.
                };
                this.gl = canvas.getContext('webgl', webglOption) || canvas.getContext('experimental-webgl', webglOption);
                this.gl.imageSmoothingEnabled = true;
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

    private initShaders(color: string, geometry: ContainerSize, vertices: [number, number][], alpha: number = 1) {
        const radius = this.config.dot ? this.config.dot.radius ?? 6 : 0;

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

        let i = 0;

        for (i = 0; i < endCount; i++) {
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
            this.gl.clearColor(0, 0, 0, 0); // rgba
        }

        // Bind vertex buffer object
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

        // Get the attribute location
        const coord = this.gl.getAttribLocation(this.shaderProgram, 'coordinates');

        // Point an attribute to the currently bound VBO
        this.gl.vertexAttribPointer(coord, buffer.itemSize, this.gl.FLOAT, false, 0, 0);

        // Enable the attribute
        this.gl.enableVertexAttribArray(coord);

        // this.gl.lineWidth(1 / 1000);

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
        const selectionCanvas = this.chartBase.chartContainer.select('.' + ChartSelector.POINTER_CANVAS);
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

    private drawSelectionPoint(position: number[], geometry: ContainerSize, style: {fill: string; radius: number}) {
        const selectionCanvas = this.chartBase.chartContainer.select('.' + ChartSelector.SELECTION_CANVAS);
        const context = (selectionCanvas.node() as any).getContext('2d');
        context.clearRect(0, 0, geometry.width, geometry.height);
        context.fillStyle = colorDarker(style.fill, 2);
        context.lineWidth = 2;
        context.strokeStyle = colorDarker(style.fill, 1);
        // this.drawPoint(context, {cx: selectedItem[0], cy:selectedItem[1], r: style.radius});
        // cx, cy과 해당영역에 출력이 되는지? 좌표가 마이너스면 출력 안하는 로직을 넣어야 함.
        const cx = position[0];
        const cy = position[1];
        if (cx < 0 || cy < 0) {
            return;
        }

        context.beginPath();
        context.fillRect(cx - style.radius / 2, cy - style.radius / 2, style.radius, style.radius);
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
