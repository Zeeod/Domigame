import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoiceModalV2 } from './ChoiceModalV2';
import { describe, it, expect, vi } from 'vitest';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, onClick, ...props }: any) => <div onClick={onClick} {...props} className={props.className}>{children}</div>
    },
    Reorder: {
        Group: ({ children }: any) => <div>{children}</div>,
        Item: ({ children }: any) => <div>{children}</div>
    },
    useDragControls: () => ({})
}));

describe('ChoiceModalV2', () => {
    const mockChoose = vi.fn();
    const mockHand = [
        { id: 'copper', instanceId: 'c1', name: 'Cuivre' },
        { id: 'estate', instanceId: 'e1', name: 'Domaine' }
    ];
    const mockSupply = {};

    it('renders simple selection', () => {
        render(<ChoiceModalV2
            choice={{
                id: '1', playerId: 'p1', type: 'SELECT_CARDS', message: 'Choose cards', constraints: { min: 0, max: 5 }
            } as any}
            hand={mockHand}
            discard={[]}
            revealed={[]}
            supply={mockSupply as any}
            onChoose={mockChoose}
        />);

        expect(screen.getByText('Choose cards')).toBeDefined();
        expect(screen.getByText('Cuivre')).toBeDefined();
    });

    it('toggles selection on click', () => {
        render(<ChoiceModalV2
            choice={{
                id: '1', playerId: 'p1', type: 'SELECT_CARDS', message: 'Choose cards', constraints: { min: 1, max: 1 }
            } as any}
            hand={mockHand}
            discard={[]}
            revealed={[]}
            supply={mockSupply as any}
            onChoose={mockChoose}
        />);

        const card = screen.getByText('Cuivre');
        fireEvent.click(card); // Select

        const confirmBtnGeneric = screen.getByText(/Confirmer/);
        expect((confirmBtnGeneric as HTMLButtonElement).disabled).toBe(false);

        fireEvent.click(confirmBtnGeneric);
        expect(mockChoose).toHaveBeenCalledWith('1', { type: 'CARDS', cardInstanceIds: ['c1'] });
    });
});

