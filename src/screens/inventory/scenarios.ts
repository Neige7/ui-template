import { buildScenarioState, SCENARIO_LIST } from '../../mock/scenarios';

export const inventoryScenarios = SCENARIO_LIST.map((sc) => ({
  ...sc,
  getState: () => buildScenarioState(sc.key, 'inventory'),
}));
