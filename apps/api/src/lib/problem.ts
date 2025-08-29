import { ProblemDetails } from '@econeura/shared/schemas/common';

export function createProblem(problem: ProblemDetails): ProblemDetails {
  return {
    type: 'https://api.econeura.com/problems/' + (problem.type || 'general-error'),
    title: problem.title || 'An error occurred',
    status: problem.status || 500,
    detail: problem.detail || 'An unexpected error occurred',
    instance: problem.instance,
    errors: problem.errors,
  };
}
