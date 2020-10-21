export const simpleData = [
    {
        x: 1,
        y: 12,
        z: 11,
        total: 24,
        data: {
            label: 'number 1'
        }
    },
    {
        x: 2,
        y: 3,
        z: 1,
        total: 6,
        data: {
            label: 'number 2'
        }
    },
    {
        x: 3,
        y: 20,
        z: 8,
        total: 31,
        data: {
            label: 'number 3'
        }
    },
    {
        x: 4,
        y: 20,
        z: 9,
        total: 34,
        data: {
            label: 'number 4'
        }
    },
    {
        x: 5,
        y: 18,
        z: 8,
        total: 31,
        data: {
            label: 'number 5'
        }
    },
    {
        x: 6,
        y: 8,
        z: 9,
        total: 23,
        data: {
            label: 'number 6'
        }
    },
    {
        x: 7,
        y: 8,
        z: 9,
        total: 24,
        data: {
            label: 'number 7'
        }
    },
    {
        x: 8,
        y: 10,
        z: 7,
        total: 25,
        data: {
            label: 'number 8'
        }
    },
    {
        x: 9,
        y: 5,
        z: 8,
        total: 22,
        data: {
            label: 'number 9'
        }
    }
];

export const sampleMockData = (count: number = 10): any[] => {
    const mockData = [];
    for (let i = 0; i < count; i++) {
        mockData.push({
            x: (i + 1),
            y: Math.round(Math.random() * 10),
            z: Math.round(Math.random() * 10),
            total: Math.round(Math.random() * 10),
            data: {
                label: 'number' + (i + 1)
            }
        });
    }

    return mockData;
}