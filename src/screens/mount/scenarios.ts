import { buildScenarioState, SCENARIO_LIST } from '../../mock/scenarios';

export const mountScenarios = SCENARIO_LIST.map((sc) => ({
  ...sc,
  getState: () => buildScenarioState(sc.key, 'mount'),
}));
