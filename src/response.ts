
import { AzureOpenAI } from 'openai';
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources';
import { storeResponse } from './storage';
const seedrandom = require('seedrandom');

// If fullResponse is set, we will generate the entire response
// Otherwise we will only update the ending portion of the response
export class SlotInput {
    fullResponse: boolean;
    userId?: string;
    timestamp: number;
    games: number;
    wins: number;
    losses: number;
    // Reels, payout, and bankroll are set for a full response
    reels?: string;
    payout?: number;
    bankroll?: number;
    // Speech and status should be set for a partial response
    speech?: string;
    status?: 'win' | 'lose';
};

export const getSlotResponse = async (input: SlotInput): Promise<{ response: string, details: any }> => {
    const deployment = process.env.OPENAI_DEPLOYMENT_ID;
    const apiVersion = '2024-02-01';
    const endpoint = process.env.OPENAI_URL;
    const apiKey = process.env.OPENAI_KEY;

    // Make sure we have all the required parameters
    if ((input.fullResponse && (!input.reels || !input.payout || (input.bankroll === undefined)))
        || (!input.fullResponse && !input.status)) {
        throw new Error('Missing required parameters');
    }

    const wonSpin: boolean = input.fullResponse ? (input.payout > 0) : (input.status === 'win');
    const client = new AzureOpenAI({ endpoint, apiKey, apiVersion, deployment });

    // Generate a prompt for OpenAI
    const prompt = generatePrompt(input);
    
    // Set up the messages to pass to OpenAI
    const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: prompt },
        { role: 'system', content: `The player ${wonSpin ? "won" : "lost"} this spin` },
        { role: 'system', content: `They player has played ${input.games} games this session.` },
    ];
    if (wonSpin) {
        messages.push({ role: 'system', content: (input.losses > 0) ? `The player broke a losing streak of ${input.losses} games.` : `The player is on a winning streak of ${input.wins + 1} games.` });        
    } else {
        messages.push({ role: 'system', content: (input.wins > 0) ? `The player broke a winning streak of ${input.wins} games.` : `The player is on a losing streak of ${input.losses + 1} games.` });
    }
    if (input.fullResponse) {
        messages.push({ role: 'system', content: `The player ${wonSpin ? "won" : "lost"} ${Math.abs(input.payout)} coins.` });
        messages.push({ role: 'system', content: `The player has ${input.bankroll} coins left after this spin.` });
        messages.push({ role: 'system', content: "Format the response in SSML syntax. Include break SSML tags for maximum impact of the response." });
    }
    if (input.speech) {
        // Update speech so it is text only, and remove the last question if present
        let speech = input.speech.replace(/(<([^>]+)>)/ig, '');
        const speechSentences: string[] = speech.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");
        if (speechSentences[speechSentences.length - 1].endsWith('?')) {
            speech = speechSentences.slice(0, speechSentences.length - 1).join(' ');
        }
        messages.push({ role: 'assistant', content: input.speech });
    }

    let max_tokens: number = parseInt(process.env.OPENAI_MAX_TOKENS, 10);
    if (!max_tokens || isNaN(max_tokens)) {
        max_tokens = 100;
    }
    const result: ChatCompletion = await client.chat.completions.create({
        messages,
        model: '',
        max_tokens,
    });

    // Store the response in blob storage
    await storeResponse(wonSpin, input, prompt, result.choices[0].message.content);

    // Add on reels and make this a fully formatted SSML response
    let response: string = result.choices[0].message.content;
    if (input.fullResponse) {
        // Remove any leading or training <speak> tags
        response = response.replace(/<\/?speak>/g, '');
        response = `${input.reels}<break time="200ms"/>${response}`;
    }

    // Prepare details to return
    const details: any = {
        messages,
        max_tokens,
    };
    return { response, details };
};

// Generate a prompt
const generatePrompt = (input: SlotInput): string => {
    let prompts: string[];
    const wonSpin: boolean = input.fullResponse ? (input.payout > 0) : (input.status === 'win');
    const payout: string = (input.fullResponse ? Math.abs(input.payout) : 0).toString();
    const bankroll: string = (input.bankroll || 0).toString();
    const wordCount: number = input.fullResponse ? 40 : 20;

    if (wonSpin) {
        // Winning prompts
        prompts = input.fullResponse ? [
            `You are a slot machine. Let the player know how many coins they won and how many coins they have left. Ask a question that encourages the user to keep playing. Keep the response under ${wordCount} words.`,
            `You are a slot machine. Let the player know how many coins they won and how many coins they have left. Make a joke about gambling but encourage the user to keep playing. End the response with a yes/no question and keep the response under ${wordCount} words.`,
            `Provide a response to let the player know how many coins they won and how many coins they have left. Look at how many games they\'ve played. Provide a funny response. The response should end in a yes/no question and be under ${wordCount} words.`,
            `Let the player know how many coins they won and how many coins they have left. Observe their winning streak. Ask if they would like to keep playing. Keep the response under ${wordCount} words.`,
            `Let the player know how many coins they won and how many coins they have left. Encourage them to keep playing with a yes/no question. Keep the response under ${wordCount} words.`,
        ] :
        [
            `You are a slot machine. Ask a question that encourages the user to keep playing. Keep the response under ${wordCount} words.`,
            `You are a slot machine. Make a joke about gambling but encourage the user to keep playing. End the response with a yes/no question and keep the response under ${wordCount} words.`,
            `Provide a response to let the user know they won. Look at how many games they\'ve played. Provide a funny response. The response should end in a yes/no question and be under ${wordCount} words.`,
            `Let the user know they won. Observe their winning streak. Ask if they would like to keep playing. Keep the response under ${wordCount} words.`,
            `Let the user know they won. Encourage them to keep playing with a yes/no question. Keep the response under ${wordCount} words.`,
        ];
    } else {
        // Losing prompts
        prompts = input.fullResponse ? [
            `You are a slot machine. Let the player know how many coins they won and how many coins they have left. Be sarcastic and ask a question that encourages the user to keep playing. Keep the response under ${wordCount} words.`,
            `You are a slot machine. Let the player know how many coins they won and how many coins they have left. Make a joke about gambling but encourage the user to keep playing. End the response with a yes/no question and keep the response under ${wordCount} words.`,
            `Provide a response to let the player know how many coins they won and how many coins they have left. Look at how many games they\'ve played. Provide a funny response but encourage them to keep trying. The response should end in a yes/no question and be under ${wordCount} words.`,
            `Let the player know how many coins they won and how many coins they have left. Observe their losing streak. Ask if they would like to keep playing. Keep the response under ${wordCount} words.`,
            `Let the player know how many coins they won and how many coins they have left. Give a sarcastic response and encourage them to keep playing with a yes/no question. Keep the response under ${wordCount} words.`,
        ] :
        [
            `You are a slot machine. Ask a question that encourages the user to keep playing after they lost. Be sarcastic. Keep the response under ${wordCount} words.`,
            `You are a slot machine. Make a joke about gambling but encourage the user to keep playing. End the response with a yes/no question and keep the response under ${wordCount} words.`,
            `Provide a response to let the user know they lost. Look at how many games they\'ve played. Provide a funny response but encourage them to keep trying. The response should end in a yes/no question and be under ${wordCount} words.`,
            `Let the user know they lost. Observe their losing streak. Ask if they would like to keep playing. Keep the response under ${wordCount} words.`,
            `Let the user know they lost. Give a sarcastic response but encourage them to keep playing with a yes/no question. Keep the response under ${wordCount} words.`,
        ];
    }

    // Pick one at random
    let result: number;
    const randomValue = seedrandom(`${input.userId || 'abc'} ${input.timestamp || Date.now()}`)();
    result = Math.floor(randomValue * prompts.length);
    if (result == prompts.length) {
      result--;
    }

    return prompts[result];
};
