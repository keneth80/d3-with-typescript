import { Selection, BaseType, select, mouse } from 'd3-selection';
import { Quadtree } from 'd3';
import { quadtree } from 'd3-quadtree';
import { line, curveMonotoneX } from 'd3-shape';
import { hsl } from 'd3-color';
import { randomNormal } from 'd3-random';
import { scaleLinear } from 'd3-scale';
import { fromEvent, Subject, of, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { Scale, ContainerSize, ChartMouseEvent } from '../chart/chart.interface';
import { SeriesBase } from '../chart/series-base';
import { SeriesConfiguration } from '../chart/series.interface';
import { textBreak } from '../chart/util/d3-svg-util';
import { ChartBase, delayExcute } from '../chart';
import { createProgramFromSources, createProgramFromScripts } from '../chart/util/webgl-util';

export class BasicCanvasWebglLineSeriesModel {
    x: number;
    y: number;
    i: number; // save the index of the point as a property, this is useful
    selected: boolean;
    color: string;
    memoryColor: string;
    data: any;

    constructor(
        x: number,
        y: number,
        i: number, // save the index of the point as a property, this is useful
        color: string,
        memoryColor: string,
        selected: boolean,
        data: any
    ) {
        Object.assign(this, {
            x, y, i, selected, color, memoryColor, data
        });
    }
}

export interface BasicCanvasWebglLineSeriesConfiguration extends SeriesConfiguration {
    dotSelector?: string;
    xField: string;
    yField: string;
    isCurve?: boolean; // default : false
    dot?: {
        radius?: number
    }
    style?: {
        strokeWidth?: number;
        // stroke?: string;
        // fill?: string;
    },
    filter?: any;
    crossFilter?: {
        filerField: string;
        filterValue: string;
    };
    // animation?: boolean;
}

export class BasicCanvasWebgLineSeries<T = any> extends SeriesBase {
    protected canvas: Selection<BaseType, any, HTMLElement, any>;

    private tooltipGroup: Selection<BaseType, any, HTMLElement, any>;

    private xField: string;

    private yField: string;

    private config: BasicCanvasWebglLineSeriesConfiguration;

    private dataFilter: any;

    private strokeWidth = 2;

    // private isAnimation: boolean = false;

    private parentElement: Selection<BaseType, any, HTMLElement, any>;

    private move$: Subject<any> = new Subject();

    private crossFilterDimension: any = undefined;

    private originQuadTree: Quadtree<Array<any>> = undefined;

    private generateData: Array<any> = [];

    private originalChartImage: any = null;

    private isRestore = false;

    // ================= webgl 관련 변수 ================ //
    private gl: any;

    private shaderProgram: any;

    constructor(configuration: BasicCanvasWebglLineSeriesConfiguration) {
        super(configuration);
        this.config = configuration;
        if (configuration) {
            if (configuration.xField) {
                this.xField = configuration.xField;
            }

            if (configuration.yField) {
                this.yField = configuration.yField;
            }

            if (configuration.filter) {
                this.dataFilter = configuration.filter;
            }

            if (configuration.style) {
                this.strokeWidth = configuration.style.strokeWidth || this.strokeWidth;
            }
        }
    }

    setSvgElement(svg: Selection<BaseType, any, HTMLElement, any>, 
                  mainGroup: Selection<BaseType, any, HTMLElement, any>, 
                  index: number) {
        this.svg = svg;

        // TODO: SVG 캔버스가 pointer 캔버스 바로 뒤에 와야함.
        this.svg
            .style('z-index', index + 2)
            .style('position', 'absolute');

        this.parentElement = select((this.svg.node() as HTMLElement).parentElement);

        if (!this.canvas) {            
            this.canvas = this.parentElement
                .append('canvas')
                .datum({
                    index
                })
                .attr('class', 'drawing-canvas')
                .style('z-index', index + 1)
                .style('position', 'absolute');
        }
    }

    drawSeries(chartData: Array<T>, scales: Array<Scale>, geometry: ContainerSize, index: number, color: string) {
        const xScale: Scale = scales.find((scale: Scale) => scale.field === this.xField);
        const yScale: Scale = scales.find((scale: Scale) => scale.field === this.yField);
        const x: any = xScale.scale;
        const y: any = yScale.scale;

        const radius = this.config.dot ? (this.config.dot.radius || 4) : 0;

        const lineStroke = (this.config.style && this.config.style.strokeWidth) || 1;

        const xmin = xScale.min;
        const xmax = xScale.max;
        const ymin = yScale.min;
        const ymax = yScale.max;

        let padding = 0;

        if (x.bandwidth) {
            padding = x.bandwidth() / 2;
        }

        const space: number = (radius + lineStroke) * 4;

        if (this.config.crossFilter) {
            this.crossFilterDimension = this.chartBase.crossFilter(chartData).dimension((item: T) => item[this.config.crossFilter.filerField]);
        } else {
            if (this.crossFilterDimension) {
                this.crossFilterDimension.dispose();
            }
            this.crossFilterDimension = undefined;
        }

        const lineData = this.crossFilterDimension ? this.crossFilterDimension.filter(this.config.crossFilter.filterValue).top(Infinity) : 
        !this.dataFilter ? chartData : chartData.filter((item: T) => this.dataFilter(item));

        this.canvas
            .attr('width', geometry.width)
            .attr('height', geometry.height)
            .style('transform', `translate(${(this.chartBase.chartMargin.left + 1)}px, ${(this.chartBase.chartMargin.top)}px)`);
        if (this.isRestore) {
            this.isRestore = false;
            this.execRestore(this.originalChartImage, geometry.width, geometry.height);
        } else {
            this.webGLStart(lineData, {min: xmin, max: xmax}, {min:ymin, max: ymax}, geometry);
        }
        
        // mouse event listen
        this.addMouseEvent(x, y, geometry);

        // quadtree setup: data indexing by position
        if (!this.originQuadTree) {
            delayExcute(200, () => {
                this.generateData = lineData
                .map((d: BasicCanvasWebglLineSeriesModel) => {
                    const xposition = x(d[this.xField]) + padding;
                    const yposition = y(d[this.yField]);
                    
                    return [xposition, yposition, d];
                });

                this.originQuadTree = quadtree()
                    .extent([[0, 0], [geometry.width, geometry.height]])
                    .addAll(this.generateData);
            });
        }
    }

    select(displayName: string, isSelected: boolean) {
        this.canvas.style('opacity', isSelected ? null : 0.4);
    }

    hide(displayName: string, isHide: boolean) {
        this.canvas.style('opacity', !isHide ? null : 0);
    }

    destroy() {
        if (this.crossFilterDimension) {
            this.crossFilterDimension.dispose();
        }
        this.crossFilterDimension = undefined;
        this.subscription.unsubscribe();
        this.canvas.remove();
    }

    testRefresh() {
        
    }

    private search(quadtree: Quadtree<Array<any>>, x0: number, y0: number, x3: number, y3: number) {
        const temp = [];
        quadtree.visit((node: any, x1: number, y1: number, x2: number, y2: number) => {
            if (!node.length) {
                do {
                    const d = node.data;
                    const selected = (d[0] >= x0) && (d[0] < x3) && (d[1] >= y0) && (d[1] < y3);
                    if (selected) {
                        temp.push(d);
                    }
                } while (node = node.next);
            }
            return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
        });

        return temp;
    }

    private onClickItem(selectedItem: any, geometry: ContainerSize, mouseEvent: Array<number>) {
        if (selectedItem) {
            this.itemClickSubject.next({
                data: selectedItem[2],
                event: {
                    offsetX: mouseEvent[0] + this.chartBase.chartMargin.left,
                    offsetY: mouseEvent[1] + this.chartBase.chartMargin.top
                },
                target: {
                    width: 1,
                    height: 1
                }
            });
        }
    }

    private setChartTooltip(d: any, geometry: ContainerSize, mouseEvent: Array<number>) {
        this.tooltipGroup = this.chartBase.showTooltip();
    
        const textElement: any = this.tooltipGroup.select('text').attr('dy', '.1em').text(
            this.chartBase.tooltip && this.chartBase.tooltip.tooltipTextParser ? 
                this.chartBase.tooltip.tooltipTextParser(d) : 
                `${this.xField}: ${d[2][this.xField]} \n ${this.yField}: ${d[2][this.yField]}`
        );

        textBreak(textElement, '\n');

        // const parseTextNode = textElement.node().getBoundingClientRect();
        const parseTextNode = textElement.node().getBBox();

        const textWidth = parseTextNode.width + 7;
        const textHeight = parseTextNode.height + 5;
        
        let xPosition = mouseEvent[0] + this.chartBase.chartMargin.left + 10;
        let yPosition = mouseEvent[1] + this.chartBase.chartMargin.top + 10;
        
        if (xPosition + textWidth > geometry.width) {
            xPosition = xPosition - textWidth;
        }

        if (yPosition + textHeight > geometry.height) {
            yPosition = yPosition - textHeight;
        }

        this.tooltipGroup.attr('transform', `translate(${xPosition}, ${yPosition})`)
            .selectAll('rect')
            .attr('width', textWidth)
            .attr('height', textHeight);

    }

    private webGLStart(chartData: Array<T>, xAxis: {min: number, max: number}, yAxis: {min: number, max: number}, geometry: ContainerSize) {
        // data 만들기
        const xScale = scaleLinear().domain([xAxis.min, xAxis.max]).range([-1, 1]); // [-0.99, 0.99]

        const yScale = scaleLinear().domain([yAxis.min, yAxis.max]).range([-1, 1]); // [-0.99, 0.99]

        const vertices = [];

        const endCount = chartData.length;

        this.generateData.length = 0;

        for (let i = 0; i < endCount; i++) {
            const xposition = xScale(chartData[i][this.xField]);
            const yposition = yScale(chartData[i][this.yField]);

            vertices.push(xposition);
            vertices.push(yposition);
            vertices.push(0);

            // POINT: QuadTree 만들기 위한 데이터.
            this.generateData.push([xposition, yposition]);    
        }

		// 캔버스 얻어오기
        const canvas: HTMLCanvasElement = this.canvas.node() as HTMLCanvasElement;

        // 초기화
        this.initGL(canvas as HTMLCanvasElement);

        // 버퍼 초기화
        const vertexBuffer = this.initBuffers(vertices, 3, endCount);

        // 쉐이더 초기화
        this.initShaders('0.0, 0.0, 1.0, 1.0');

        // 화면 지우기
        this.gl.clearColor(0,  0,  0,  0); // rgba

        // 깊이버퍼 활성화
        this.gl.enable(this.gl.DEPTH_TEST);

        console.time('webgldraw');
        // 화면 그리기
        this.drawScene(vertexBuffer, endCount, canvas as HTMLCanvasElement);
        console.timeEnd('webgldraw');
    }

    private initGL(canvas: HTMLCanvasElement) {
		try {
            const radius = this.config.dot ? (this.config.dot.radius || 4) : 0;
            const lineStroke = (this.config.style && this.config.style.strokeWidth) || 1;
            const space: number = (radius + lineStroke) * 4;
            this.gl = canvas.getContext('experimental-webgl', {preserveDrawingBuffer: true});
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

    private initShaders(color: string = '0.0,  1.0,  0.0,  1.0') {
        const radius = this.config.dot ? (this.config.dot.radius || 6) : 0;
        
        // Vertex shader source code
        const vertCodeSquare =
        `
        attribute vec3 coordinates;
        void main(void) {
            gl_Position = vec4(coordinates, 1.0);
            gl_PointSize = ${radius}.0;
        }`;

        // Create a vertex shader object
        const vertShader = this.gl.createShader(this.gl.VERTEX_SHADER);

        // Attach vertex shader source code
        this.gl.shaderSource(vertShader, vertCodeSquare);

        // Compile the vertex shader
        this.gl.compileShader(vertShader);

        const colors = [
            1.0,  1.0,  1.0,  1.0,    // 흰색
            1.0,  0.0,  0.0,  1.0,    // 빨간색
            0.0,  1.0,  0.0,  1.0,    // 녹색
            0.0,  0.0,  1.0,  1.0     // 파란색
        ];

        const fragCode =
        `
        precision mediump float;
        uniform bool antialiased;
        void main(void) {
            float dist = distance( gl_PointCoord, vec2(0.5) );
            if (!antialiased) {
                if (dist > 0.5)
                   discard;
                   gl_FragColor = vec4(${color});
            } else {
                float alpha = 1.0 - smoothstep(0.45,0.5,dist);
                gl_FragColor = vec4(${color});
            }
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
    }

    private execRestore(image: any, width: number, height: number) {
        const shaderCode = 
        `
        attribute vec2 a_position;
            
        uniform vec2 u_resolution;
        uniform mat3 u_matrix;
        
        varying vec2 v_texCoord;
        
        void main() {
        
            gl_Position = vec4(u_matrix * vec3(a_position, 1), 1);
            v_texCoord = a_position;
        }
        `;

        const fragCode = 
        `
        precision mediump float;
            
        // our texture
        uniform sampler2D u_image;
        
        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;
        
        void main() {
            gl_FragColor = texture2D(u_image, v_texCoord);
        }
        `;
        // 화면 지우기
        this.gl.clearColor(0,  0,  0,  0); // rgba

        // 화면 지우기
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Enable depth testing
        this.gl.enable(this.gl.DEPTH_TEST);

        this.gl.depthFunc(this.gl.LEQUAL);

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
        const u_imageLoc = gl.getUniformLocation(program, 'u_image');
        const u_matrixLoc = gl.getUniformLocation(program, 'u_matrix');

        // provide texture coordinates for the rectangle.
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0,  0.0,
            1.0,  0.0,
            0.0,  1.0,
            0.0,  1.0,
            1.0,  0.0,
            1.0,  1.0]), gl.STATIC_DRAW);
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
        const clipX = dstX / gl.canvas.width  *  2 - 1;
        const clipY = dstY / gl.canvas.height * -2 + 1;
        const clipWidth = dstWidth  / gl.canvas.width  *  2;
        const clipHeight = dstHeight / gl.canvas.height * -2;

        // build a matrix that will stretch our
        // unit quad to our desired size and location
        gl.uniformMatrix3fv(u_matrixLoc, false, [
            clipWidth, 0, 0,
            0, clipHeight, 0,
            clipX, clipY, 1,
            ]);

        // Draw the rectangle.
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    private setRectangle(gl: any, x: number, y: number, width: number, height: number) {
        const x1 = x;
        const x2 = x + width;
        const y1 = y;
        const y2 = y + height;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
           x1, y1,
           x2, y1,
           x1, y2,
           x1, y2,
           x2, y1,
           x2, y2,
        ]), gl.STATIC_DRAW);
    }

    private initBuffers(vertices: Array<number> = [], itemSize: number, numItems: number): any {
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

    private drawScene(buffer: any, dataSize: number, canvas: HTMLCanvasElement) {
        // 창을 설정
        this.gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);

        // 화면 지우기
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Bind vertex buffer object
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);

        // Get the attribute location
        const coord = this.gl.getAttribLocation(this.shaderProgram, 'coordinates');

        // Point an attribute to the currently bound VBO
        this.gl.vertexAttribPointer(coord, buffer.itemSize, this.gl.FLOAT, false, 0, 0);
        // this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, buffer.itemSize, this.gl.FLOAT, false, 0, 0);

        // Enable the attribute
        this.gl.enableVertexAttribArray(coord);

        // 선 그리기
        this.gl.drawArrays(this.gl.LINE_STRIP, 0, dataSize);

        // 포인터 그리기
        this.gl.drawArrays(this.gl.POINTS, 0, dataSize);

        // Bind vertex buffer object
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

        delayExcute(500, () => {
            if (!this.originalChartImage) {
                this.originalChartImage = new Image();
                this.originalChartImage.src = canvas.toDataURL('image/png');
            }
        });
    }

    private addMouseEvent(x: any, y: any, geometry: ContainerSize) {
        this.subscription.unsubscribe();
        this.subscription = new Subscription();

        const radius = this.config.dot ? (this.config.dot.radius || 4) : 0 / 2;
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        this.subscription.add(
            this.chartBase.mouseEvent$.subscribe((event: ChartMouseEvent) => {
                if (event.type === 'mousemove') {
                    this.move$.next(event.position);
                } else if (event.type === 'mouseup') {
                    endX = event.position[0];
                    endY = event.position[1];
                    
                    const selected = this.search(this.originQuadTree, Math.round(endX) - radius, Math.round(endY) - radius, Math.round(endX) + radius, Math.round(endY) + radius);
                    console.log('selected : ', selected);
                    if (selected.length) {
                        const selectedItem = selected[selected.length - 1];
                        this.onClickItem(selectedItem, {
                            width: geometry.width, height: geometry.height
                        }, [endX, endY]);
                    } else {
                        this.chartBase.hideTooltip();
                    }

                } else if (event.type === 'mousedown') {
                    startX = event.position[0];
                    startY = event.position[1];
                } else if (event.type === 'zoomin') {
                    endX = event.position[0];
                    endY = event.position[1];

                    const xStartValue = x.invert(startX).getTime();
                    const yStartValue = y.invert(startY);
                    const xEndValue = x.invert(endX).getTime();
                    const yEndValue = y.invert(endY);
                    this.chartBase.updateAxisForZoom([
                        {
                            field: this.xField,
                            min: xStartValue,
                            max: xEndValue
                        },
                        {
                            field: this.yField,
                            min: yEndValue,
                            max: yStartValue
                        }
                    ]);
                } else if (event.type === 'zoomout') {
                    this.isRestore = true;
                    delayExcute(50, () => {
                        this.chartBase.updateAxisForZoom([]);
                    });
                } else {

                }
            })
        );

        this.subscription.add(
            this.move$
            .pipe(
                debounceTime(200)
            )
            .subscribe((value: any) => {
                // http://plnkr.co/edit/AowXaSYsJM8NSH6IK5B7?p=preview&preview 참고
                const selected = this.search(this.originQuadTree, Math.round(value[0]) - radius, Math.round(value[1]) - radius, Math.round(value[0]) + radius, Math.round(value[1]) + radius);
                
                if (selected.length) {
                    const selectedItem = selected[selected.length - 1];
                    this.setChartTooltip(selectedItem, {
                        width: geometry.width, height: geometry.height
                    }, value);
                } else {
                    this.chartBase.hideTooltip();
                }
            })
        )
    }
}