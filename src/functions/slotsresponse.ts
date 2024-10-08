import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSlotResponse, SlotInput } from "../response";
import { getRequestParameter, getTimestamp } from "../utils";

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
    const timestamp: number = getTimestamp(request);
    const games: number = getRequestParameter(request, 'games', 'number') as number;
    const wins: number = getRequestParameter(request, 'wins', 'number') as number;
    const losses: number = getRequestParameter(request, 'losses', 'number') as number;
    const status: string = getRequestParameter(request, 'status', 'string') as string;
    const speech: string = getRequestParameter(request, 'speech', 'string') as string;
    const userId: string = getRequestParameter(request, 'userId', 'string') as string;
    const getDetails: string = getRequestParameter(request, 'getDetails', 'string') as string;

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
        fullResponse: false,
    };

    let slotResponse;
    try {
        slotResponse = await getSlotResponse(input);
    } catch (e) {
        // Don't leak the error message to the user
        console.log(e);
        return {
            status: 500,
            body: JSON.stringify({ error: 'Internal server error', timeElasped: Date.now() - start }),
        };
    }

    const body: any = {
        timeElasped: Date.now() - start,
        response: slotResponse.response,
    };
    if (getDetails) {
        body.details = slotResponse.details;
    }
    return {
        status: 200,
        body: JSON.stringify(body),
    };
};

app.http('slotsresponse', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: slotsresponse
});
