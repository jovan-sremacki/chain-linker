import { program } from "commander";
import OdosIntegration from "../integrations/odos/OdosIntegration";
import dotenv from 'dotenv';

program
    .version('0.0.1')
    .description('CLI to interact with DApps');

program
    .command('execute-transaction')
    .description('Execute a transaction via Odos')
    .action(async () => {
        dotenv.config();
        const odosIntegration = new OdosIntegration();
        try {
            await odosIntegration.executeOdosTransaction();
            console.log('Transaction executed successfully.');
        } catch (error: any) {
            console.error('[CLI] - Failed to execute transaction', error.message);
        }
    });

program.parse(process.argv);
