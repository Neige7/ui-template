import { buildScenarioState, SCENARIO_LIST } from '../../mock/scenarios';

export const guildScenarios = SCENARIO_LIST.map((sc) => ({
  ...sc,
  getState: () => buildScenarioState(sc.key, 'guild'),
}));
