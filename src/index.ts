import { app } from '@azure/functions';
import 'dotenv/config';

app.setup({
    enableHttpStream: true,
});
