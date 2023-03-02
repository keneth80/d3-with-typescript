export const clearCanvas = (
    canvasContext: any,
    width: number,
    height: number
) => {
    canvasContext.clearRect(0, 0, width, height);
    canvasContext.beginPath();
    canvasContext.closePath();
    canvasContext.fill();
}