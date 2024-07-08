
import { AzureOpenAI } from 'openai';
import { ChatCompletion } from 'openai/resources';
const seedrandom = require('seedrandom');

export class SlotHistory {
    userId?: string;
    timestamp?: number;
    coins: number;
    gamesPlayed: number;
    winStreak: number;
    loseStreak: number;
};

export class SlotResponse {
    prompt: string;
    response: string | { win: string, lose: string};
}

export const getSlotResponse = async (history: SlotHistory, status: string | undefined): Promise<SlotResponse> => {
    const deployment = process.env.OPENAI_DEPLOYMENT_ID;
    const apiVersion = '2024-02-01';
    const endpoint = process.env.OPENAI_URL;
    const apiKey = process.env.OPENAI_KEY;
    const getWinStatus: boolean = (status || '').toLowerCase() !== 'lose';
    const getLoseStatus: boolean = (status || '').toLowerCase() !== 'win';

    const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

    const systemPrompts = [
        'Provide a response to let the user whether they won or lost. Look at their play history. Provide a funny response but encourage them to keep trying if they lost. At the end of the response ask if they would like to keep playing. Keep the response under 20 words.',
        'Let the user know whether they won or lost. Look at their play history. Ask if they would like to keep playing. Keep the response under 20 words.',
        'Let the user know if they won or lost. Give a sarcastic response if they lost. Encourage them to keep playing with a yes/no question. Keep the response under 20 words.',
    ];

    const prompt = randomPrompt(history, systemPrompts);

    // You can ask for a win response, lose response, or both (useful if you want to call this function async before knowing the result)
    let winResult: ChatCompletion;
    let loseResult: ChatCompletion;

    if (getWinStatus) {
        winResult = await client.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: 'You won this spin' },
                { role: "user", content: `You played ${history.gamesPlayed} games this session.` },
                { role: "user", content: `You have ${history.coins} coins.` },
                { role: "user", content: (history.loseStreak > 0) ? `You broke a losing streak of ${history.loseStreak} games.` : `You are on a winning streak of ${history.winStreak + 1} games.` },
            ],
            model: '',
            max_tokens: 100,
        });
    }
    if (getLoseStatus) {
        loseResult = await client.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: 'You lost this spin' },
                { role: "user", content: `You played ${history.gamesPlayed} games this session.` },
                { role: "user", content: `You have ${history.coins} coins.` },
                { role: "user", content: (history.loseStreak > 0) ? `You are on a losing streak of ${history.loseStreak + 1} games.` : `You broke a winning streak of ${history.winStreak} games.` },
            ],
            model: '',
            max_tokens: 100,
        });
    }

    if (winResult && loseResult) {
        return {
            prompt,
            response: {
                win: winResult.choices[0].message.content,
                lose: loseResult.choices[0].message.content,
            },
        };
    }

    if (winResult) {
        return {
            prompt,
            response: winResult.choices[0].message.content,
        };
    }

    return {
        prompt,
        response: loseResult?.choices[0].message.content,
    };
};

const randomPrompt = (history: SlotHistory, prompts: string[]): string => {
    let result: number;

    const randomValue = seedrandom(`${history.userId || 'abc'} ${history.timestamp || Date.now()}`)();
    result = Math.floor(randomValue * prompts.length);
    if (result == prompts.length) {
      result--;
    }

    return prompts[result];
};
