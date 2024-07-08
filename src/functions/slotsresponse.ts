import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSlotResponse, SlotInput } from "../response";

export async function slotsresponse(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const start = Date.now();

    // First verify that they sent in a proper key
    if (getRequestParameter(request, 'key', 'string') !== process.env.ACCESS_KEY) {
        return {
            status: 401,
            body: JSON.stringify({ error: 'Unauthorized' }),
        };
    }

    // Get the other parameters
    let timestamp: number = parseInt(request.query.get('timestamp') as string);
    if (!timestamp || isNaN(timestamp)) {
        timestamp = Date.now();
    }

    const games: number = getRequestParameter(request, 'games', 'number') as number;
    const wins: number = getRequestParameter(request, 'wins', 'number') as number;
    const losses: number = getRequestParameter(request, 'losses', 'number') as number;
    const status: string = getRequestParameter(request, 'status', 'string') as string;
    const speech: string = getRequestParameter(request, 'speech', 'string') as string;
    const userId: string = getRequestParameter(request, 'userId', 'string') as string;

    if (isNaN(games) || isNaN(wins) || isNaN(losses) || (['win', 'lose'].indexOf(status) === -1)) {
        return {
            status: 400,
            body: JSON.stringify({ error: 'Invalid parameters', timeElasped: Date.now() - start }),
        };
    }

    const input: SlotInput = {
        userId,
        timestamp,
        speech,
        status: status as 'win' | 'lose',
        games,
        wins,
        losses,
    };

    let response;
    try {
        response = await getSlotResponse(input);
    } catch (e) {
        // Don't leak the error message to the user
        console.log(e);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error', timeElasped: Date.now() - start }),
        };
    }

    return {
        status: 200,
        body: JSON.stringify({ timeElasped: Date.now() - start, response }),
    };
};

// For some reason calling request.query.get isn't working even though I see it in the string representation??
const getRequestParameter = (request: HttpRequest, name: string, type: 'number' | 'string'): string | number => {
    const params: string[] = request.query.toString().split('&');
    let value: string | number;

    // This should just be value = request.query.get(name)
    params.forEach((param: string) => {
        const values: string[] = param.split('=');
        if (values[0] === name) {
            value = values.slice(1).join('=');
        }
    });

    if (type === 'number') {
        value = parseInt(value as string, 10);
    } else {
        value = (value as string).replace(/\+/g, '%20');
        value = decodeURIComponent(value as string);
    }

    return value;
};

app.http('slotsresponse', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: slotsresponse
});
