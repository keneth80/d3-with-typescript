export const sampleMockData = (count: number = 10): any[] => {
    const mockData = [];
    for (let i = 0; i < count; i++) {
        const x = (i + 1);
        const y = Math.round(Math.random() * 10);
        const z = Math.round(Math.random() * 10);
        const total = x + y + z;
        mockData.push({
            x,
            y,
            z,
            total,
            data: {
                label: 'number' + (i + 1)
            }
        });
    }

    return mockData;
}

export const sampleMockTimeData = (count: number = 10): any[] => {
    const term = 10 * 1000;
    const start = new Date().getTime() - term * count;
    const mockData = [];
    for (let i = 0; i < count; i++) {
        const date = new Date(start + term * i);
        const y = Math.round(Math.random() * 10);
        const z = Math.round(Math.random() * 10);
        mockData.push({
            date,
            y,
            z,
            data: {
                label: 'number' + (i + 1)
            }
        });
    }

    return mockData;
}
