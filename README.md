## slots-ai-response
Uses LLM to generate an AI response to slot machine game

# Usage
To use this repo, copy the `.sample-env` file to `.env` and set environment variables for your own project:

* ACCESS_KEY: A secret value that must be provided by the client to consume this API
* OPENAI_URL: URL to your own OpenAI endpoint
* OPENAI_KEY: Key to access your OpenAI endpoint
* OPENAI_DEPLOYMENT_ID: The model to use with your OpenAI endpoint

# Parameters
When calling this API, use the following query parameters with the GET call:

* key: Should be set to the ACCESS_KEY value noted above
* coins: The number of coins the user has left
* games: The number of games the user has played in this session
* wins: The consequtive number of wins this player has had
* losses: The consequtive number of losses this player has had
* userId: Optional - unique user ID
* timestamp: Optional - timestamp that client makes this call
* status: Optional - set to `win` to retrieve a response if you won the last spin, or `lose` if you lost the last spin. If not set, both a win and a lose response will be returned

# Response
The response for a successful call will be the following:

```
{
    timeElapsed: number, // The amount of internal processing time
    prompt: string, // The OpenAI prompt which was used to create the response
    response: string | { win: string, lose: string }, // A single string if status was set
                                                      // otherwise a structure with the responses for a winning and losing spin
}
