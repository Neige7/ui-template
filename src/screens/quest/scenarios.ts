import { buildScenarioState, SCENARIO_LIST } from '../../mock/scenarios';

export const questScenarios = SCENARIO_LIST.map((sc) => ({
  ...sc,
  getState: () => buildScenarioState(sc.key, 'quest'),
}));
