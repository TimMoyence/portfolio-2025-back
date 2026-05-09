import * as memberContributionRepoModule from './IBudgetMemberContribution.repository';
import * as goalRepoModule from './IBudgetGoal.repository';
import * as budgetMemberModule from './BudgetMember';

describe('budget domain ports smoke', () => {
  it('exporte IBudgetMemberContributionRepository, IBudgetGoalRepository, BudgetMember', () => {
    expect(memberContributionRepoModule).toBeDefined();
    expect(goalRepoModule).toBeDefined();
    expect(budgetMemberModule).toBeDefined();
  });
});
