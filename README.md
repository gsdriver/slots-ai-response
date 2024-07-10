## slots-ai-response
Uses LLM to generate an AI response to slot machine game

# Usage
To use this repo, copy the `.sample-env` file to `.env` and set environment variables for your own project:

* ACCESS_KEY: A secret value that must be provided by the client to consume this API
* OPENAI_URL: URL to your own OpenAI endpoint
* OPENAI_KEY: Key to access your OpenAI endpoint
* OPENAI_MAX_TOKENS: The number of tokens to use in the OpenAI request (default 100)
* OPENAI_DEPLOYMENT_ID: The model to use with your OpenAI endpoint
* AZURE_STORAGE_ACCOUNT_NAME: If set a blob storage account which will be used to hold prompts and responses for later analysis
* AZURE_STORAGE_ACCOUNT_KEY: The key for the optional blob storage noted above

# Parameters
When calling this API, use the following query parameters with the GET call:

* key: Should be set to the ACCESS_KEY value noted above
* status: Set to `win` if you won the last spin, or `lose` if you lost the last spin
* speech: The speech presented to the user containing the result of their spin
* games: The number of games the user has played in this session
* wins: The consequtive number of wins this player has had (not including the current spin)
* losses: The consequtive number of losses this player has had (not including the current spin)
* userId: Optional - unique user ID
* timestamp: Optional - timestamp that client makes this call

Note that the `speech` parameter can be a full SSML string. If it ends with a question, that questoin is presumed to be an invitation to continue playing and is removed prior to the OpenAI call

Example:

```
https://{YOUR_AZURE_FUNCTION_URL}/api/slotsresponse?userId=1234&key={YOUR_KEY}&speech=cherry%20cherry%20lemon%20that%20gives%20you%2010%20coins%56%20Try%20again%3F&games=10&wins=1&losses=0&status=win
```

# Response
The response for a successful call will be the following:

```
{
    timeElapsed: number, // The amount of internal processing time
    response: string, // The response from the AI prompt
}

Example:

```
{"timeElasped":558,"response":"Well done! You're on a winning streak. Keep it up! Play again?"}
```
