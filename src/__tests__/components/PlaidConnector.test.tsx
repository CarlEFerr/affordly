import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';

// Mock react-plaid-link before importing the component
vi.mock('react-plaid-link', () => {
  const openMock = vi.fn();
  return {
    usePlaidLink: vi.fn(() => ({
      open: openMock,
      ready: false,
      error: null,
      exit: vi.fn(),
      submit: vi.fn(),
    })),
    __openMock: openMock,
  };
});

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import PlaidConnector from '../../components/PlaidConnector';

describe('PlaidConnector — user interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const sessionStoreMock: Record<string, string> = {};
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => sessionStoreMock[k] ?? null,
      setItem: (k: string, v: string) => { sessionStoreMock[k] = v; },
    });
    vi.stubGlobal('crypto', { randomUUID: () => '12345678-1234-1234-1234-123456789012' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a "Connect Plaid Sandbox" button', () => {
    render(<PlaidConnector onData={vi.fn()} onError={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /connect plaid sandbox/i })).toBeInTheDocument();
  });

  it('calls onCancel (not onError) when Link exits without an error', async () => {
    const { usePlaidLink } = await import('react-plaid-link');
    let capturedOnExit: PlaidLinkOnExit | undefined;

    (usePlaidLink as ReturnType<typeof vi.fn>).mockImplementation((config: { onExit?: PlaidLinkOnExit }) => {
      capturedOnExit = config.onExit;
      return { open: vi.fn(), ready: false, error: null, exit: vi.fn(), submit: vi.fn() };
    });

    const onCancel = vi.fn();
    const onError = vi.fn();
    render(<PlaidConnector onData={vi.fn()} onError={onError} onCancel={onCancel} />);

    capturedOnExit?.(null, { institution: null, status: null, link_session_id: '', request_id: '' });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onError when Link exits with an error', async () => {
    const { usePlaidLink } = await import('react-plaid-link');
    let capturedOnExit: PlaidLinkOnExit | undefined;

    (usePlaidLink as ReturnType<typeof vi.fn>).mockImplementation((config: { onExit?: PlaidLinkOnExit }) => {
      capturedOnExit = config.onExit;
      return { open: vi.fn(), ready: false, error: null, exit: vi.fn(), submit: vi.fn() };
    });

    const onError = vi.fn();
    const onCancel = vi.fn();
    render(<PlaidConnector onData={vi.fn()} onError={onError} onCancel={onCancel} />);

    const plaidError = {
      error_type: 'API_ERROR',
      error_code: 'INTERNAL_SERVER_ERROR',
      error_message: 'error',
      display_message: null,
    };
    capturedOnExit?.(plaidError, { institution: null, status: null, link_session_id: '', request_id: '' });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    // Must not expose raw Plaid error code to the user
    const errorArg = onError.mock.calls[0][0] as { error: string };
    expect(errorArg.error).not.toContain('INTERNAL_SERVER_ERROR');
  });

  it('calls onError when public_token is null (defensive handling)', async () => {
    const { usePlaidLink } = await import('react-plaid-link');
    let capturedOnSuccess: PlaidLinkOnSuccess | undefined;

    (usePlaidLink as ReturnType<typeof vi.fn>).mockImplementation((config: { onSuccess?: PlaidLinkOnSuccess }) => {
      capturedOnSuccess = config.onSuccess;
      return { open: vi.fn(), ready: false, error: null, exit: vi.fn(), submit: vi.fn() };
    });

    const onError = vi.fn();
    render(<PlaidConnector onData={vi.fn()} onError={onError} onCancel={vi.fn()} />);

    capturedOnSuccess?.(null, { institution: null, accounts: [], link_session_id: '' });

    expect(onError).toHaveBeenCalledTimes(1);
    const errorArg = onError.mock.calls[0][0] as { code: string };
    expect(errorArg.code).toBe('connection_failed');
  });

  it('calls onError with safe message when link-token fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error', code: 'connection_failed' }),
    });

    const onError = vi.fn();
    const user = userEvent.setup();
    render(<PlaidConnector onData={vi.fn()} onError={onError} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /connect plaid sandbox/i }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'connection_failed' }));
    });
  });
});
