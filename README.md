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

# Endpoints
This module exposes two endpoints - the first, `slotsresponse` takes a fully-formed response and only updates the ending of that response. The second, `generateresponse` takes the raw attributes of the user's slot machine spin and generates a fully-formed SSML-response

## slotsresponse

### Parameters
When calling this API, use the following query parameters with the GET call:

* key: Should be set to the ACCESS_KEY value noted above
* status: Set to `win` if you won the last spin, or `lose` if you lost the last spin
* speech: The speech presented to the user containing the result of their spin
* games: The number of games the user has played in this session
* wins: The consequtive number of wins this player has had (not including the current spin)
* losses: The consequtive number of losses this player has had (not including the current spin)
* getDetails: Optional - if set prompt information will be returned
* userId: Optional - unique user ID
* timestamp: Optional - timestamp that client makes this call

Note that the `speech` parameter can be a full SSML string. If it ends with a question, that questoin is presumed to be an invitation to continue playing and is removed prior to the OpenAI call

### Example

```
https://{YOUR_AZURE_FUNCTION_URL}/api/slotsresponse?userId=1234&key={YOUR_KEY}&speech=cherry%20cherry%20lemon%20that%20gives%20you%2010%20coins%56%20Try%20again%3F&games=10&wins=1&losses=0&status=win
```

### Response
The response for a successful call will be the following:

```
{
    timeElapsed: number, // The amount of internal processing time
    response: string, // The response from the AI prompt
    details: object, // Only returned if getDetails is set
}
```
### Example

```
{"timeElasped":558,"response":"Well done! You're on a winning streak. Keep it up! Play again?"}
```

## generateresponse

### Parameters
When calling this API, use the following query parameters with the GET call:

* key: Should be set to the ACCESS_KEY value noted above
* reels: An SSML-formed spin result. This should include any sound effects desired in the output
* payout: The amount of coins won (positive) or lost (negative)
* bankroll: The ending bankroll of the player after adjusting for the coins won or lost
* games: The number of games the user has played in this session
* wins: The consequtive number of wins this player has had (not including the current spin)
* losses: The consequtive number of losses this player has had (not including the current spin)
* getDetails: Optional - if set prompt information will be returned
* userId: Optional - unique user ID
* timestamp: Optional - timestamp that client makes this call

### Example

```
https://{YOUR_AZURE_FUNCTION_URL}/api/generateresponse?userId=1234&key={YOUR_KEY}&reels=cherry%20cherry%20lemon&payout=2&bankroll=90&games=10&wins=1&losses=0
```

### Response
The response for a successful call will be the following:

```
{
    timeElapsed: number, // The amount of internal processing time
    response: string, // The response from the AI prompt
    details: object, // Only returned if getDetails is set
}
```
### Example

```
{"timeElasped":558,"response":"Cherry cherry lemon. You won 2 coins and have 90 coins left. Well done! You're on a winning streak. Keep it up! Play again?"}
```
