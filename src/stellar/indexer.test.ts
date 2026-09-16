import { processEvents } from './indexer';
import { pool } from '../db/client';

jest.mock('@stellar/stellar-sdk', () => {
  return {
    rpc: { Server: jest.fn() },
    xdr: {
      ScVal: {
        scvSymbol: (val: any) => val,
        scvString: (val: any) => val,
        scvAddress: (val: any) => val
      },
      ScAddress: {
        scAddressTypeAccount: (val: any) => val
      },
      PublicKey: {
        publicKeyTypeEd25519: (val: any) => val
      }
    },
    scValToNative: (val: any) => val // Since we pass plain values as mocked ScVals
  };
});

jest.mock('../db/client', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Indexer - processEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process create_event and insert into db', async () => {
    const mockEvent = {
      type: 'contract',
      topic: ['create_event', 'event-12345'],
      value: 'G_ORGANIZER_ADDR',
      ledger: 100,
      contractId: 'C...',
      id: '000100-00',
      pagingToken: '000100-00',
      txHash: 'txhash',
      inSuccessfulContractCall: true
    } as any;

    await processEvents([mockEvent]);

    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO events'),
      expect.arrayContaining(['event-12345', 'G_ORGANIZER_ADDR', 'Placeholder', 'Placeholder', 'Placeholder', true, '{}'])
    );
  });

  it('should ignore non-contract events', async () => {
    const mockEvent = {
      type: 'system',
      topic: [],
      value: '',
    } as any;

    await processEvents([mockEvent]);

    expect(pool.query).not.toHaveBeenCalled();
  });

  it('should ignore contract events that are not create_event', async () => {
    const mockEvent = {
      type: 'contract',
      topic: ['other_event'],
      value: 'val',
    } as any;

    await processEvents([mockEvent]);

    expect(pool.query).not.toHaveBeenCalled();
  });
});
