import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AffordlyApp from '../../components/AffordlyApp';

// AffordlyApp is tested directly (not through layout/page) to avoid next/font issues.

describe('AffordlyApp — Demo Mode on render', () => {
  it('renders the Affordly heading', () => {
    render(<AffordlyApp />);
    expect(screen.getByRole('heading', { name: /Affordly/i })).toBeInTheDocument();
  });

  it('shows the product framing question', () => {
    render(<AffordlyApp />);
    expect(screen.getByText(/how would a monthly payment have fit/i)).toBeInTheDocument();
  });

  it('displays the Demo data mode indicator', () => {
    render(<AffordlyApp />);
    expect(screen.getByText(/Demo data/i)).toBeInTheDocument();
  });

  it('shows the retrospective disclosure', () => {
    render(<AffordlyApp />);
    expect(screen.getByText(/Historical analysis only/i)).toBeInTheDocument();
  });

  it('renders six month cards with default values', () => {
    render(<AffordlyApp />);
    // Month cards are rendered when both inputs have valid defaults
    // The summary statement is the clearest indicator that 6 months are analyzed
    expect(screen.getByText(/last 6 months/i)).toBeInTheDocument();
  });

  it('shows the backtest summary with the default payment', () => {
    render(<AffordlyApp />);
    expect(screen.getByText(/\$475\.00/)).toBeInTheDocument();
  });

  it('shows the cushion value in the summary', () => {
    render(<AffordlyApp />);
    expect(screen.getByText(/\$300\.00.*cushion/i)).toBeInTheDocument();
  });
});

describe('AffordlyApp — Input validation', () => {
  it('shows a prompt when the payment input is cleared', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);
    const paymentInput = screen.getByLabelText(/proposed monthly payment/i);
    await user.clear(paymentInput);
    await user.tab(); // blur
    // Validation error on the field
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a payment amount/i);
    // No-results prompt shown instead of backtest output
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows a validation error for zero payment', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);
    const paymentInput = screen.getByLabelText(/proposed monthly payment/i);
    await user.clear(paymentInput);
    await user.type(paymentInput, '0');
    await user.tab();
    expect(
      screen.getByRole('alert')
    ).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/greater than \$0/i);
  });

  it('shows a validation error for negative payment', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);
    const paymentInput = screen.getByLabelText(/proposed monthly payment/i);
    await user.clear(paymentInput);
    await user.type(paymentInput, '-100');
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent(/greater than \$0/i);
  });

  it('accepts zero as a valid cushion value', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);
    const cushionInput = screen.getByLabelText(/monthly cushion/i);
    await user.clear(cushionInput);
    await user.type(cushionInput, '0');
    await user.tab();
    // No error alert for cushion
    const alerts = screen.queryAllByRole('alert');
    // Any alerts should not be about the cushion
    const cushionErrors = alerts.filter(a => a.textContent?.includes('cushion'));
    expect(cushionErrors).toHaveLength(0);
    // Results should still show (zero cushion is valid)
    expect(screen.getByText(/last 6 months/i)).toBeInTheDocument();
  });
});

describe('AffordlyApp — Input update behavior (debounce via blur)', () => {
  it('updates the summary after a new valid payment is committed on blur', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);
    const paymentInput = screen.getByLabelText(/proposed monthly payment/i);

    // Change payment to $600 and commit via tab (blur)
    await user.clear(paymentInput);
    await user.type(paymentInput, '600');
    await user.tab(); // triggers immediate commit on blur

    // Summary should now reference $600.00
    expect(screen.getByText(/\$600\.00/)).toBeInTheDocument();
  });

  it('updates classifications when the cushion target changes', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);

    // With default $475 payment and $300 cushion: 3 months not meeting cushion
    expect(screen.getByText(/3 of your last 6 months/)).toBeInTheDocument();

    // Reduce cushion to $0 — only negative months don't meet cushion
    const cushionInput = screen.getByLabelText(/monthly cushion/i);
    await user.clear(cushionInput);
    await user.type(cushionInput, '0');
    await user.tab();

    // With $0 cushion, only 1 negative month doesn't meet the cushion
    expect(screen.getByText(/1 of your last 6 months/)).toBeInTheDocument();
  });
});

describe('AffordlyApp — Month detail expand/collapse', () => {
  it('expands a month card to show detail on click', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);

    // Find the first month card expand button
    const expandButtons = screen.getAllByRole('button', { expanded: false });
    const firstMonthBtn = expandButtons[0];
    await user.click(firstMonthBtn);

    // Detail should now be visible — look for "Cash in" label
    expect(screen.getByText(/Cash in/i)).toBeInTheDocument();
  });

  it('collapses a month card on second click', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);

    const expandButtons = screen.getAllByRole('button', { expanded: false });
    const firstMonthBtn = expandButtons[0];

    // Expand
    await user.click(firstMonthBtn);
    expect(screen.getByText(/Cash in/i)).toBeInTheDocument();

    // Collapse
    const collapseBtn = screen.getByRole('button', { expanded: true });
    await user.click(collapseBtn);
    expect(screen.queryByText(/Cash in/i)).not.toBeInTheDocument();
  });

  it('shows top transaction descriptions in expanded detail', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);

    // Find and expand the M-1 card (most recent — first in the list)
    const expandButtons = screen.getAllByRole('button', { expanded: false });
    await user.click(expandButtons[0]);

    // M-1 contains Annual Car Insurance as a notable top transaction
    expect(screen.getByText('Annual Car Insurance')).toBeInTheDocument();
  });

  it('only allows one expanded card at a time', async () => {
    const user = userEvent.setup();
    render(<AffordlyApp />);

    const expandButtons = screen.getAllByRole('button', { expanded: false });
    await user.click(expandButtons[0]); // expand first
    await user.click(expandButtons[1]); // expand second (should collapse first)

    const expanded = screen.queryAllByRole('button', { expanded: true });
    expect(expanded).toHaveLength(1);
  });
});

describe('AffordlyApp — Retrospective disclosure', () => {
  it('disclosure is visible without any user action', () => {
    render(<AffordlyApp />);
    const aside = screen.getByRole('complementary', { name: /about this analysis/i });
    expect(aside).toBeInTheDocument();
    expect(aside).toHaveTextContent(/do not predict/i);
  });
});
