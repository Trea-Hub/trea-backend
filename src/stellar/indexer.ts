import { rpc, xdr, scValToNative } from '@stellar/stellar-sdk';
import { pool } from '../db/client';

const SOROBAN_RPC_URL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
export const CONTRACT_ID = process.env.CONTRACT_ID || '';

export const server = new rpc.Server(SOROBAN_RPC_URL);

export async function processEvents(events: rpc.Api.EventResponse[]) {
  for (const event of events) {
    if (event.type !== 'contract') continue;

    try {
      const topic0Val = event.topic[0];
      const topic0 = scValToNative(topic0Val);

      if (topic0 === 'create_event') {
        const topic1Val = event.topic[1];
        const eventId = scValToNative(topic1Val);

        const valueVal = event.value;
        const organizer = scValToNative(valueVal);

        await pool.query(
          `INSERT INTO events (id, organizer, title, description, location, date, is_free, tags)
           VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [eventId, organizer, 'Placeholder', 'Placeholder', 'Placeholder', true, '{}']
        );
        console.log(`[Indexer] Created placeholder event ${eventId} for organizer ${organizer}`);
      } else if (topic0 === 'register') {
        const topic1Val = event.topic[1];
        const eventId = scValToNative(topic1Val);

        const valueVal = event.value;
        const attendee = scValToNative(valueVal);

        const result = await pool.query(
          `INSERT INTO registrations (event_id, attendee_address)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING
           RETURNING event_id`,
          [eventId, attendee]
        );

        if (result.rowCount && result.rowCount > 0) {
          await pool.query(
            `UPDATE events SET registered_count = registered_count + 1 WHERE id = $1`,
            [eventId]
          );
          console.log(`[Indexer] Registered attendee ${attendee} for event ${eventId}`);
        }
      }
    } catch (err) {
      console.error(`[Indexer] Failed to parse event:`, err);
    }
  }
}

export async function pollEvents() {
  console.log(`[Indexer] Starting indexer service... connected to ${SOROBAN_RPC_URL}`);

  if (!CONTRACT_ID) {
    console.warn('[Indexer] WARNING: CONTRACT_ID is not set in environment variables. Indexer will not filter by contract ID.');
  }

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
        
        const eventsResponse = await server.getEvents({
          startLedger: lastLedger,
          filters: [
            {
              type: 'contract',
              contractIds: CONTRACT_ID ? [CONTRACT_ID] : [],
            },
          ],
        });

        if (eventsResponse.events && eventsResponse.events.length > 0) {
          await processEvents(eventsResponse.events);
        }
        
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
