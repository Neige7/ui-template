import { buildScenarioState, SCENARIO_LIST } from '../../mock/scenarios';

export const warehouseScenarios = SCENARIO_LIST.map((sc) => ({
  ...sc,
  getState: () => buildScenarioState(sc.key, 'warehouse'),
}));
