import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Dial, handAngle, markerAngle, roundedMarker } from '../../src/components/Dial';
import { DialReadOnly } from '../../src/components/DialReadOnly';

function Harness({ initial = null as number | null }) {
  const [v, setV] = useState<number | null>(initial);
  return (
    <>
      <Dial value={v} onChange={setV} />
      <output data-testid="value">{v ?? 'none'}</output>
    </>
  );
}

describe('Dial geometry', () => {
  it('places 10 at the top and steps 36° clockwise', () => {
    expect(markerAngle(10)).toBe(0);
    expect(markerAngle(1)).toBe(36);
    expect(markerAngle(2)).toBe(72);
    expect(markerAngle(5)).toBe(180);
    expect(markerAngle(9)).toBe(324);
  });

  it('turns the hand clockwise all the way to 10', () => {
    expect(handAngle(9)).toBe(324);
    expect(handAngle(10)).toBe(360);
  });

  it('read-only rounding clamps to 1–10', () => {
    expect(roundedMarker(8.5)).toBe(9);
    expect(roundedMarker(8.4)).toBe(8);
    expect(roundedMarker(1.2)).toBe(1);
    expect(roundedMarker(0.4)).toBe(1);
    expect(roundedMarker(10)).toBe(10);
  });
});

describe('Dial interaction', () => {
  it('has ten labelled markers in a radio group and selects on tap', async () => {
    render(<Harness />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    const markers = screen.getAllByRole('radio');
    expect(markers).toHaveLength(10);
    await userEvent.click(screen.getByRole('radio', { name: 'Score 7 of 10' }));
    expect(screen.getByTestId('value')).toHaveTextContent('7');
    expect(screen.getByRole('radio', { name: 'Score 7 of 10' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('fallback number buttons set the score too', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    expect(screen.getByTestId('value')).toHaveTextContent('3');
  });

  it('arrow keys move the selection and wrap', async () => {
    render(<Harness initial={9} />);
    const nine = screen.getByRole('radio', { name: 'Score 9 of 10' });
    expect(nine).toHaveAttribute('tabindex', '0');
    nine.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByTestId('value')).toHaveTextContent('10');
    expect(screen.getByRole('radio', { name: 'Score 10 of 10' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByTestId('value')).toHaveTextContent('1');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByTestId('value')).toHaveTextContent('9');
    await userEvent.keyboard('{Home}');
    expect(screen.getByTestId('value')).toHaveTextContent('1');
  });
});

describe('DialReadOnly', () => {
  it('shows the exact average and has no buttons', () => {
    render(<DialReadOnly avg={8.46} />);
    expect(screen.getByRole('img', { name: 'Average score 8.5 out of 10' })).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('handles no ratings', () => {
    render(<DialReadOnly avg={null} />);
    expect(screen.getByRole('img', { name: 'No ratings yet' })).toBeInTheDocument();
  });
});
