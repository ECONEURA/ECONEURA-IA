function canTransition(fromState, toState) {
  const validTransitions = {
    draft: ['pending_approval'],
    pending_approval: ['approved'],
    approved: ['dispatched']
  };

  return validTransitions[fromState] ? validTransitions[fromState].includes(toState) : false;
}

module.exports = { canTransition };
