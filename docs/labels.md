# PR labels explanations

## enable_keep_helm

Retains deployed dev pod allowing you to navigate to it and test changes in a safe environment before merging into master (requires VPN connection).

## run_full_regression

By default, all PRs will run a core regression pack. This label will run the full regression suite against your PR's deployed environment.

## skip_regression_tests

Use this label if you want to skip all regression tests and only run the essential smoke tests.
