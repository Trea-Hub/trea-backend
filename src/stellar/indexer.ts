import { rpc } from '@stellar/stellar-sdk';
import { pool } from '../db/client';

const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const server = new rpc.Server(SOROBAN_RPC_URL);

async function pollEvents() {
  console.log(`[Indexer] Starting indexer service... connected to ${SOROBAN_RPC_URL}`);

  let lastLedger = 0;
  
  while (true) {
    try {
      const latestLedger = await server.getLatestLedger();
      const currentLedger = latestLedger.sequence;
      
      if (lastLedger === 0) {
        lastLedger = currentLedger;
      }
      
      if (currentLedger > lastLedger) {
        console.log(`[Indexer] Processing batch from ledger ${lastLedger} to ${currentLedger}`);
        
        // TODO: In subsequent issues, we will fetch and parse events here
        // e.g. await server.getEvents({ startLedger: lastLedger, filters: [...] });
        
        lastLedger = currentLedger;
      }
      
    } catch (error) {
      console.error('[Indexer] Error encountered during polling:', error);
    }
    
    // Pause before the next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

if (require.main === module) {
  pollEvents().catch((err) => {
    console.error('[Indexer] Fatal error:', err);
    process.exit(1);
  });
}
