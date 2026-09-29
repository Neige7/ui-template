import { buildScenarioState, SCENARIO_LIST } from '../../mock/scenarios';

export const mailScenarios = SCENARIO_LIST.map((sc) => ({
  ...sc,
  getState: () => buildScenarioState(sc.key, 'mail'),
}));
