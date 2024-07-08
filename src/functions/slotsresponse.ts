import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getSlotResponse, SlotHistory } from "../response";

export async function slotsresponse(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const start = Date.now();

    // First verify that they sent in a proper key
    if (request.query.get('key') !== process.env.ACCESS_KEY) {
        return {
            status: 401,
            body: JSON.stringify({ error: 'Unauthorized' }),
        };
    }

    const coins: number = parseInt(request.query.get('coins') as string);
    const gamesPlayed: number = parseInt(request.query.get('games') as string);
    const winStreak: number = parseInt(request.query.get('wins') as string);
    const loseStreak: number = parseInt(request.query.get('losses') as string);

    if (isNaN(coins) || isNaN(gamesPlayed) || isNaN(winStreak) || isNaN(loseStreak)) {
        return {
            status: 400,
            body: JSON.stringify({ error: 'Invalid parameters', timeElasped: Date.now() - start }),
        };
    }

    const history: SlotHistory = {
        userId: request.query.get('userId') as string,
        timestamp: Date.now(),
        coins,
        gamesPlayed,
        winStreak,
        loseStreak,
    };

    let response;
    try {
        response = await getSlotResponse(history, request.query.get('status'));
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
        body: JSON.stringify(Object.assign({ timeElasped: Date.now() - start }, response)),
    };
};

app.http('slotsresponse', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: slotsresponse
});
