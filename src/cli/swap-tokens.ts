import { program } from "commander";
import OdosIntegration from "../integrations/odos/OdosIntegration";
import dotenv from 'dotenv';

program
    .version('0.0.1')
    .description('CLI to interact with DApps');

program
    .command('run')
    .description('Execute a transaction via Odos')
    .requiredOption('-a, --address <type>', 'Address from which the transaction should be executed')
    .requiredOption('-f, --fromToken <type>', 'Token from which the transaction should be executed')
    .requiredOption('-t, --toToken <type>', 'Token to which the transaction should be sent')
    .requiredOption('-m, --amount <type>', 'Amount of tokens to be swapped')
    .action(async (cmd) => {
        dotenv.config();

        const { address, fromToken, toToken, amount } = cmd;

        const odosIntegration = new OdosIntegration(address, fromToken, toToken, amount);
        try {
            await odosIntegration.executeOdosTransaction();
            console.log('Transaction executed successfully.');
        } catch (error: any) {
            console.error('[CLI] - Failed to execute transaction', error.message);
        }
    });

program.parse(process.argv);
