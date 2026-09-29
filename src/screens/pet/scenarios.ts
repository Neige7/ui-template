import { buildScenarioState, SCENARIO_LIST } from '../../mock/scenarios';

export const petScenarios = SCENARIO_LIST.map((sc) => ({
  ...sc,
  getState: () => buildScenarioState(sc.key, 'pet'),
}));
