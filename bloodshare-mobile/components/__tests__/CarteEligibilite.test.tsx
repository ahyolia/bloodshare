import { fireEvent, render, screen } from '@testing-library/react-native';
import { CarteEligibilite } from '../eligibilite/CarteEligibilite';

describe('CarteEligibilite', () => {
  it('propose de faire le test quand aucun questionnaire n’est en cours', async () => {
    const onCommencer = jest.fn();
    await render(<CarteEligibilite enCours={null} onCommencer={onCommencer} onRecommencer={jest.fn()} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Faire le test' }));

    expect(onCommencer).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Recommencer' })).toBeNull();
  });

  it('propose de reprendre à la bonne question, ou de recommencer', async () => {
    const onCommencer = jest.fn();
    const onRecommencer = jest.fn();
    await render(
      <CarteEligibilite
        enCours={{ numero: 6, total: 15 }}
        onCommencer={onCommencer}
        onRecommencer={onRecommencer}
      />
    );

    expect(screen.getByText(/question 6 sur 15/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Reprendre le questionnaire' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Recommencer' }));

    expect(onCommencer).toHaveBeenCalledTimes(1);
    expect(onRecommencer).toHaveBeenCalledTimes(1);
  });
});
