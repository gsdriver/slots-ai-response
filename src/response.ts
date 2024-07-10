
import { AzureOpenAI } from 'openai';
import { ChatCompletion } from 'openai/resources';
import { storeResponse } from './storage';
const seedrandom = require('seedrandom');

export class SlotInput {
    userId?: string;
    timestamp: number;
    speech: string;
    status: 'win' | 'lose';
    games: number;
    wins: number;
    losses: number;
};

export const getSlotResponse = async (input: SlotInput): Promise<string> => {
    const deployment = process.env.OPENAI_DEPLOYMENT_ID;
    const apiVersion = '2024-02-01';
    const endpoint = process.env.OPENAI_URL;
    const apiKey = process.env.OPENAI_KEY;

    const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

    const systemPrompts = [
        'You are a slot machine. Ask a question that encourages the user to keep playing. Be sarcastic if they lost. Keep the response under 20 words.',
        'You are a slot machine. Make a joke about gambling but encourage the user to keep playing. End the response with a yes/no question and keep the response under 20 words.',
        'Provide a response to let the user whether they won or lost. Look at how many games they\'ve played. Provide a funny response but encourage them to keep trying if they lost. The response should end in a yes/no question and be under 20 words.',
        'Let the user know whether they won or lost. Observe their winning or losing streak. Ask if they would like to keep playing. Keep the response under 20 words.',
        'Let the user know if they won or lost. Give a sarcastic response if they lost. Encourage them to keep playing with a yes/no question. Keep the response under 20 words.',
    ];

    const prompt = randomPrompt(input, systemPrompts);

    // Update speech so it is text only, and remove the last question if present
    let speech = input.speech.replace(/(<([^>]+)>)/ig, '');
    const speechSentences: string[] = speech.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
    if (speechSentences[speechSentences.length - 1].endsWith('?')) {
        speech = speechSentences.slice(0, speechSentences.length - 1).join(' ');
    }

    let result: ChatCompletion;
    if (input.status === 'win') {
        result = await client.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "assistant", content: input.speech },
                { role: "assistant", content: 'You won this spin' },
                { role: "assistant", content: `You played ${input.games} games this session.` },
                { role: "assistant", content: (input.losses > 0) ? `You broke a losing streak of ${input.losses} games.` : `You are on a winning streak of ${input.wins + 1} games.` },
            ],
            model: '',
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 100,
        });

        // Store the response in blob storage
        await storeResponse('win', input, prompt, result.choices[0].message.content);
    } else {
        result = await client.chat.completions.create({
            messages: [
                { role: "system", content: prompt },
                { role: "assistant", content: input.speech },
                { role: "assistant", content: 'You lost this spin' },
                { role: "assistant", content: `You played ${input.games} games this session.` },
                { role: "assistant", content: (input.losses > 0) ? `You are on a losing streak of ${input.losses + 1} games.` : `You broke a winning streak of ${input.wins} games.` },
            ],
            model: '',
            max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 100,
        });

        // Store the response in blob storage
        await storeResponse('lose', input, prompt, result.choices[0].message.content);
    }

    return result.choices[0].message.content;
};

const randomPrompt = (input: SlotInput, prompts: string[]): string => {
    let result: number;

    const randomValue = seedrandom(`${input.userId || 'abc'} ${input.timestamp || Date.now()}`)();
    result = Math.floor(randomValue * prompts.length);
    if (result == prompts.length) {
      result--;
    }

    return prompts[result];
};
