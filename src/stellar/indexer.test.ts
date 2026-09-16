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

  it('should process register event and insert into db', async () => {
    const mockEvent = {
      type: 'contract',
      topic: ['register', 'event-12345'],
      value: 'G_ATTENDEE_ADDR',
      ledger: 100,
      contractId: 'C...',
      id: '000100-00',
      pagingToken: '000100-00',
      txHash: 'txhash',
      inSuccessfulContractCall: true
    } as any;

    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({});

    await processEvents([mockEvent]);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO registrations'),
      expect.arrayContaining(['event-12345', 'G_ATTENDEE_ADDR'])
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE events SET registered_count'),
      expect.arrayContaining(['event-12345'])
    );
  });

  it('should not increment registered_count if registration already exists', async () => {
    const mockEvent = {
      type: 'contract',
      topic: ['register', 'event-12345'],
      value: 'G_ATTENDEE_ADDR',
    } as any;

    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });

    await processEvents([mockEvent]);

    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should process refund event and delete from db', async () => {
    const mockEvent = {
      type: 'contract',
      topic: ['refund', 'event-12345'],
      value: 'G_ATTENDEE_ADDR',
      ledger: 100,
      contractId: 'C...',
      id: '000100-00',
      pagingToken: '000100-00',
      txHash: 'txhash',
      inSuccessfulContractCall: true
    } as any;

    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({});

    await processEvents([mockEvent]);

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('DELETE FROM registrations'),
      expect.arrayContaining(['event-12345', 'G_ATTENDEE_ADDR'])
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE events SET registered_count = registered_count - 1'),
      expect.arrayContaining(['event-12345'])
    );
  });

  it('should not decrement registered_count if refund registration does not exist', async () => {
    const mockEvent = {
      type: 'contract',
      topic: ['refund', 'event-12345'],
      value: 'G_ATTENDEE_ADDR',
    } as any;

    (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });

    await processEvents([mockEvent]);

    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should ignore contract events that are not create_event, register, or refund', async () => {
    const mockEvent = {
      type: 'contract',
      topic: ['other_event'],
      value: 'val',
    } as any;

    await processEvents([mockEvent]);

    expect(pool.query).not.toHaveBeenCalled();
  });
});
