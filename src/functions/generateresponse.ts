import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSlotResponse, SlotInput } from "../response";
import { getRequestParameter, getTimestamp } from "../utils";

export async function generateresponse(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
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
    const reels: string = getRequestParameter(request, 'reels', 'string') as string;
    const userId: string = getRequestParameter(request, 'userId', 'string') as string;
    const payout: number = getRequestParameter(request, 'payout', 'number') as number;
    const bankroll: number = getRequestParameter(request, 'bankroll', 'number') as number;
    const getDetails: string = getRequestParameter(request, 'getDetails', 'string') as string;

    if (isNaN(games) || isNaN(wins) || isNaN(losses) || isNaN(payout) || isNaN(bankroll)) {
        return {
            status: 400,
            body: JSON.stringify({ error: 'Invalid parameters', timeElasped: Date.now() - start }),
        };
    }

    const input: SlotInput = {
        userId,
        timestamp,
        reels,
        payout,
        bankroll,
        games,
        wins,
        losses,
        fullResponse: true,
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

app.http('generateresponse', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: generateresponse
});
