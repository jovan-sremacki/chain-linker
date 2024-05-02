require('module-alias/register');
import OdosIntegration from '../../../src//integrations/odos/OdosIntegration';

describe('OdosIntegration', () => {
    it('should return the correct chainId', async () => {
        const odos = new OdosIntegration();
        const data = await odos.getOdosData();
        expect(data).toEqual(8453);
    });

    describe('getQuoteFromOdos', () => {
        it('should return the correct quote', async () => {
            const odos = new OdosIntegration();
            const data = await odos.getQuoteFromOdos();
            expect(data).toHaveProperty('pathId')
        });
    })

    describe('assembleTransaction', () => {
        it('should return the correct transaction', async () => {
            const odos = new OdosIntegration();
            const quote = await odos.getQuoteFromOdos();

            const data = await odos.assembleTransaction(quote.pathId);
            expect(data).toHaveProperty('transaction');
        });
    })
});
